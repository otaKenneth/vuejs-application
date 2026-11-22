import * as XLSX from 'xlsx'
import type { AttendanceImport, ImportedEmployee, AttendanceRecord, EmployeeDetailsImport } from '@/stores/attendance'

const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase().replace(/[\s\\_-]+/g, '')
function parseDelimited(text: string, delimiter = ','): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]

    if (char === '"' && quoted && text[i + 1] === '"') {
      cell += '"'
      i += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === delimiter && !quoted) {
      row.push(cell.trim())
      cell = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1
      row.push(cell.trim())
      if (row.some(value => value !== '')) rows.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }

  row.push(cell.trim())
  if (row.some(value => value !== '')) rows.push(row)
  return rows
}
function buildImport(rows: unknown[][], fileName: string): AttendanceImport {
  const headerIndex = rows.findIndex(row => {
    const cells = row.map(normalize)
    return (cells.includes('id') && cells.includes('name') && cells.includes('date'))
      || (cells.includes('ID') && cells.includes('NAME') && cells.includes('DATE'))
      || (cells.includes('Id') && cells.includes('Name') && cells.includes('Date'))
  })
  if (headerIndex < 0) throw new Error('Could not find a header row containing ID, Name, and Date.')

  // Some biometric exports use grouped columns (First/Second Time Zone)
  // with On Duty / Off Duty labels on the following header row.
  const primaryHeaders = rows[headerIndex].map(value => String(value ?? '').trim())
  const possibleSubHeaders = rows[headerIndex + 1] ?? []
  const hasSubHeaders = possibleSubHeaders.some(value => ['onduty', 'offduty'].includes(normalize(value)))
  const headers = primaryHeaders.map((primary, index) => {
    const secondary = hasSubHeaders ? String(possibleSubHeaders[index] ?? '').trim() : ''
    return [primary, secondary].filter(Boolean).join(' ').trim()
  })
  const isIn = (header: string) => ['onduty', 'clockin', 'timein'].some(alias => normalize(header).includes(alias))
  const isOut = (header: string) => ['offduty', 'clockout', 'timeout'].some(alias => normalize(header).includes(alias))
  const findZoneIndex = (zone: string, predicate: (header: string) => boolean) =>
    headers.findIndex(header => normalize(header).includes(zone) && predicate(header))
  const inIndexes = headers.map((header, index) => isIn(header) ? index : -1).filter(index => index >= 0)
  const outIndexes = headers.map((header, index) => isOut(header) ? index : -1).filter(index => index >= 0)
  const firstIn = findZoneIndex('firsttimezone', isIn) >= 0 ? findZoneIndex('firsttimezone', isIn) : (inIndexes[0] ?? -1)
  const firstOut = findZoneIndex('firsttimezone', isOut) >= 0 ? findZoneIndex('firsttimezone', isOut) : (outIndexes[0] ?? -1)
  const secondIn = findZoneIndex('secondtimezone', isIn) >= 0 ? findZoneIndex('secondtimezone', isIn) : (inIndexes[1] ?? -1)
  const secondOut = findZoneIndex('secondtimezone', isOut) >= 0 ? findZoneIndex('secondtimezone', isOut) : (outIndexes[1] ?? -1)
  const value = (row: unknown[], names: string[]) => { const index = headers.findIndex(h => names.includes(normalize(h))); return index < 0 ? '' : String(row[index] ?? '').trim() }
  const at = (row: unknown[], index: number) => index < 0 ? '' : String(row[index] ?? '').trim()
  const employees = new Map<string, ImportedEmployee>(), attendance: AttendanceRecord[] = []
  for (const row of rows.slice(headerIndex + 1)) {
    const id = value(row, ['id', 'employeeid', 'ID', 'Id']), name = value(row, ['name', 'employeename', 'NAME', 'Name'])
    if (!id || !name) continue
    if (!employees.has(id.toLowerCase())) employees.set(id.toLowerCase(), {
      employeeId: id, name, department: value(row, ['department', 'Department']), email: '', phone: '',
      first_name: '', last_name: name, middle_name: '', suffix: ''
    })
    const date = value(row, ['date', 'workdate', 'Date'])
    if (!date) continue
    attendance.push({
      employeeId: id, employeeName: name, date, firstOnDuty: at(row, firstIn), firstOffDuty: at(row, firstOut),
      secondOnDuty: at(row, secondIn), secondOffDuty: at(row, secondOut),
      scheduledClockIn: '', scheduledClockOut: '',
      lateMinutes: value(row, ['latetimemin', 'lateminutes', 'latetime(min)']), leaveEarlyMinutes: value(row, ['leaveearlymin', 'leaveearlyminutes', 'leaveearly(min)']), overtimeMinutes: '',
      absenceMinutes: value(row, ['absencemin', 'absenceminutes', 'absence(min)']), totalMinutes: value(row, ['totalmin', 'totalminutes', 'total(min)']),
      note: value(row, ['note'])
    })
  }
  if (!employees.size) throw new Error('No employee records were found in this file.')
  return { fileName, employees: [...employees.values()], attendance, importedAt: new Date().toISOString() }
}

function readWorkbookRows(buffer: ArrayBuffer): unknown[][] {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) throw new Error('The workbook does not contain a readable worksheet.')
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][]
}

export async function processFile(file: File, expectedColumnCount: number): Promise<AttendanceImport> {
  if (!Number.isInteger(expectedColumnCount) || expectedColumnCount < 1) throw new Error('Enter a valid number of columns.')
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !['csv', 'xlsx', 'xls', 'dat', 'mhrimport'].includes(extension)) throw new Error('Unsupported file type. Choose XLSX, XLS, CSV, DAT, or MHRIMPORT.')
  if (extension === 'xlsx' || extension === 'xls') return buildImport(readWorkbookRows(await file.arrayBuffer()), file.name)
  const text = await file.text()
  const delimiter = text.split(/\\r?\\n/, 1)[0].includes('\\t') ? '\\t' : ','
  return buildImport(parseDelimited(text.replace(/^\\uFEFF/, ''), delimiter, expectedColumnCount - 1), file.name)
}

/**
 * Employee-only imports use the exact backend column names supplied in the
 * first row. Keys are deliberately not renamed or inferred.
 */
export async function processEmployeeDetailsFile(file: File): Promise<EmployeeDetailsImport> {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !['csv', 'xlsx', 'xls'].includes(extension)) {
    throw new Error('Employee details imports support XLSX, XLS, and CSV files.')
  }

  let rows: unknown[][]
  if (extension === 'xlsx' || extension === 'xls') {
    rows = readWorkbookRows(await file.arrayBuffer())
  } else {
    const text = await file.text()
    const delimiter = text.split(/\\r?\\n/, 1)[0].includes('\\t') ? '\\t' : ','
    const workbook = XLSX.read(text.replace(/^\\uFEFF/, ''), { type: 'string', FS: delimiter })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    if (!sheet) throw new Error('The CSV file does not contain readable data.')
    rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][]
  }

  const headerIndex = rows.findIndex(row => row.some(value => String(value ?? '').trim() !== ''))
  if (headerIndex < 0) throw new Error('The uploaded file is empty.')

  const columns = rows[headerIndex].map(value => String(value ?? '').trim())
  if (columns.some(column => !column)) throw new Error('Every column must have a header. Use the exact backend column names.')
  if (new Set(columns).size !== columns.length) throw new Error('Duplicate column names were found. Each backend column must appear only once.')

  const dataRows = rows.slice(headerIndex + 1).filter(row => row.some(value => String(value ?? '').trim() !== ''))
  if (!dataRows.length) throw new Error('No employee records were found below the header row.')

  const records = dataRows.map(row => Object.fromEntries(
    columns.map((column, index) => [column, row[index] == null ? '' : String(row[index]).trim()])
  ))
  return { fileName: file.name, columns, records, importedAt: new Date().toISOString() }
}
