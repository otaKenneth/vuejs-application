import * as XLSX from 'xlsx'
import type { AttendanceImport, ImportedEmployee, AttendanceRecord, EmployeeDetailsImport } from '@/stores/attendance'

const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase().replace(/[\\s_-]+/g, '')
function parseDelimited(text: string, delimiter = ',', expectedColumnCount: number): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (char === '"' && quoted && text[i + 1] === '"') { cell += '"'; i += 1 }
    else if (char === '"') quoted = !quoted
    else if (char === delimiter && !quoted) { row.push(cell.trim()); cell = '' }
    else if (row.length === expectedColumnCount) {
      if (char === '\\r' && text[i + 1] === '\\n') i += 1
      row.push(cell.trim()); cell = ''
      if (row.some(value => value !== '')) rows.push(row)
      row = []
    } else cell += char
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

  // Attendance exports commonly use a two-row header: merge the second row's
  // On-duty / Off-duty labels into the grouped time-zone columns.
  const headers = rows[headerIndex].map((value, index) => {
    const subHeader = String(rows[headerIndex]?.[index] ?? '').trim()
    if (subHeader == '') return String(rows[headerIndex + 1]?.[index] ?? '').trim()
    return subHeader
  })
  const indexes = (names: string[]) => headers.map((h, i) => names.includes(normalize(h)) ? i : -1).filter(i => i >= 0)
  const firstIn = indexes(['onduty', 'firsttimezone'])[0] ?? -1, firstOut = indexes(['offduty'])[0] ?? -1
  const secondIn = indexes(['onduty', 'secondtimezone'])[1] ?? -1, secondOut = indexes(['offduty'])[1] ?? -1
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
      lateMinutes: value(row, ['latetimemin', 'lateminutes', 'latetime(min)']), leaveEarlyMinutes: value(row, ['leaveearlymin', 'leaveearlyminutes', 'leaveearly(min)']),
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
    rows = XLSX.utils.sheet_to_json(
      XLSX.read(text.replace(/^\\uFEFF/, ''), { type: 'string', FS: delimiter }).Sheets[
        XLSX.read(text.replace(/^\\uFEFF/, ''), { type: 'string', FS: delimiter }).SheetNames[0]
      ],
      { header: 1, defval: '' }
    ) as unknown[][]
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
