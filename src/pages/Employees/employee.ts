import * as XLSX from 'xlsx'
import type { AttendanceImport, ImportedEmployee, AttendanceRecord } from '@/stores/attendance'

const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase().replace(/[\s_-]+/g, '')
function parseDelimited(text: string, delimiter = ','): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (char === '"' && quoted && text[i + 1] === '"') { cell += '"'; i += 1 }
    else if (char === '"') quoted = !quoted
    else if (char === delimiter && !quoted) { row.push(cell.trim()); cell = '' }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1
      row.push(cell.trim()); cell = ''
      if (row.some(value => value !== '')) rows.push(row)
      row = []
    } else cell += char
  }
  row.push(cell.trim()); if (row.some(value => value !== '')) rows.push(row)
  return rows
}
function buildImport(rows: unknown[][], fileName: string): AttendanceImport {
  const headerIndex = rows.findIndex(row => { const cells = row.map(normalize); return cells.includes('id') && cells.includes('name') && cells.includes('date') })
  if (headerIndex < 0) throw new Error('Could not find a header row containing ID, Name, and Date.')
  // Attendance exports commonly use a two-row header: merge the second row's
  // On-duty / Off-duty labels into the grouped time-zone columns.
  const headers = rows[headerIndex].map((value, index) => {
    const subHeader = String(rows[headerIndex + 1]?.[index] ?? '').trim()
    return subHeader || String(value ?? '').trim()
  })
  const indexes = (names: string[]) => headers.map((h, i) => names.includes(normalize(h)) ? i : -1).filter(i => i >= 0)
  const firstIn = indexes(['onduty'])[0] ?? -1, firstOut = indexes(['offduty'])[0] ?? -1
  const secondIn = indexes(['onduty'])[1] ?? -1, secondOut = indexes(['offduty'])[1] ?? -1
  const value = (row: unknown[], names: string[]) => { const index = headers.findIndex(h => names.includes(normalize(h))); return index < 0 ? '' : String(row[index] ?? '').trim() }
  const at = (row: unknown[], index: number) => index < 0 ? '' : String(row[index] ?? '').trim()
  const employees = new Map<string, ImportedEmployee>(), attendance: AttendanceRecord[] = []
  for (const row of rows.slice(headerIndex + 2)) {
    const id = value(row, ['id', 'employeeid']), name = value(row, ['name', 'employeename'])
    if (!id || !name) continue
    if (!employees.has(id.toLowerCase())) employees.set(id.toLowerCase(), {
      employeeId: id, name, department: value(row, ['department']), email: '', phone: '',
      firstName: '', lastName: name, middleName: '', suffix: ''
    })
    const date = value(row, ['date', 'workdate'])
    if (!date) continue
    attendance.push({
      employeeId: id, employeeName: name, date, firstOnDuty: at(row, firstIn), firstOffDuty: at(row, firstOut),
      secondOnDuty: at(row, secondIn), secondOffDuty: at(row, secondOut),
      lateMinutes: value(row, ['latetimemin', 'lateminutes']), leaveEarlyMinutes: value(row, ['leaveearlymin', 'leaveearlyminutes']),
      absenceMinutes: value(row, ['absencemin', 'absenceminutes']), totalMinutes: value(row, ['totalmin', 'totalminutes']),
      note: value(row, ['note'])
    })
  }
  if (!employees.size) throw new Error('No employee records were found in this file.')
  return { fileName, employees: [...employees.values()], attendance, importedAt: new Date().toISOString() }
}
export async function processFile(file: File): Promise<AttendanceImport> {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !['csv', 'xlsx', 'xls', 'dat', 'mhrimport'].includes(extension)) throw new Error('Unsupported file type. Choose XLSX, XLS, CSV, DAT, or MHRIMPORT.')
  if (extension === 'xlsx' || extension === 'xls') {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    if (!sheet) throw new Error('The workbook does not contain a readable worksheet.')
    return buildImport(XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][], file.name)
  }
  const text = await file.text()
  const delimiter = text.split(/\r?\n/, 1)[0].includes('\t') ? '\t' : ','
  return buildImport(parseDelimited(text.replace(/^\uFEFF/, ''), delimiter), file.name)
}
