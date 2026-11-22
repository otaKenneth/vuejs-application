import { defineStore } from 'pinia'

export interface ShiftDetails {
  code: string
  clock_in: string
  clock_out: string
  [key: string]: unknown
}


function timeToMinutes(value: string): number | null {
  const match = String(value ?? '').trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i)
  if (!match) return null
  let hours = Number(match[1])
  const minutes = Number(match[2])
  const meridiem = match[3]?.toUpperCase()
  if (hours > 23 || minutes > 59) return null
  if (meridiem) {
    if (hours < 1 || hours > 12) return null
    hours = hours % 12 + (meridiem === 'PM' ? 12 : 0)
  }
  return hours * 60 + minutes
}

function calculateAttendance(record: AttendanceRecord, shift: ShiftDetails) {
  const scheduledIn = timeToMinutes(shift.clock_in)
  const scheduledOutValue = timeToMinutes(shift.clock_out)
  const actualInValue = timeToMinutes(record.firstOnDuty)
  const actualOutValue = timeToMinutes(record.secondOffDuty || record.firstOffDuty)

  if (scheduledIn === null || scheduledOutValue === null) return
  let scheduledOut = scheduledOutValue
  if (scheduledOut <= scheduledIn) scheduledOut += 1440

  if (actualInValue !== null) {
    let actualIn = actualInValue
    if (scheduledOut > 1440 && actualIn < scheduledIn) actualIn += 1440
    record.lateMinutes = String(Math.max(0, actualIn - scheduledIn))
  }

  if (actualOutValue !== null) {
    let actualOut = actualOutValue
    const actualIn = actualInValue === null ? scheduledIn : (
      scheduledOut > 1440 && actualInValue < scheduledIn ? actualInValue + 1440 : actualInValue
    )
    if (actualOut < actualIn) actualOut += 1440
    record.leaveEarlyMinutes = String(Math.max(0, scheduledOut - actualOut))
    record.overtimeMinutes = String(Math.max(0, actualOut - scheduledOut))
  }
}

export interface ImportedEmployee {
  employeeId: string; name: string; department: string; email: string; phone: string
  first_name: string; last_name: string; middle_name: string; suffix: string
  shiftCode?: string; shiftDetails?: ShiftDetails | null
}
export interface AttendanceRecord {
  employeeId: string; employeeName: string; date: string
  firstOnDuty: string; firstOffDuty: string; secondOnDuty: string; secondOffDuty: string
  lateMinutes: string; leaveEarlyMinutes: string; overtimeMinutes: string; absenceMinutes: string; totalMinutes: string; note: string
}
export interface AttendanceImport {
  fileName: string; employees: ImportedEmployee[]; attendance: AttendanceRecord[]; importedAt: string
}
export interface EmployeeDetailsImport {
  fileName: string
  columns: string[]
  records: Record<string, string>[]
  importedAt: string
}

export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    currentImport: null as AttendanceImport | null,
    currentEmployeeImport: null as EmployeeDetailsImport | null,
    selectedEmployeeId: null as string | null,
    isDetailsDialogOpen: false
  }),
  getters: {
    selectedEmployee: state => state.currentImport?.employees.find(employee => employee.employeeId === state.selectedEmployeeId) ?? null,
    attendanceForSelectedEmployee: state => state.currentImport?.attendance.filter(record => record.employeeId === state.selectedEmployeeId) ?? []
  },
  actions: {
    setImport(payload: AttendanceImport) {
      this.currentImport = payload
      this.currentEmployeeImport = null
      this.selectedEmployeeId = payload.employees[0]?.employeeId ?? null
    },
    setEmployeeDetailsImport(payload: EmployeeDetailsImport) {
      this.currentEmployeeImport = payload
      this.currentImport = null
      this.selectedEmployeeId = null
      this.isDetailsDialogOpen = false
    },
    selectEmployee(employeeId: string) { this.selectedEmployeeId = employeeId; this.isDetailsDialogOpen = true },
    updateEmployee(employeeId: string, details: Partial<ImportedEmployee>) {
      const employee = this.currentImport?.employees.find(item => item.employeeId === employeeId)
      if (!employee) return

      const updated = { ...employee, ...details }
      const nameParts = [updated.first_name, updated.middle_name, updated.suffix].map(value => value?.trim()).filter(Boolean)
      updated.name = updated.last_name?.trim()
        ? `${updated.last_name.trim()}, ${nameParts.join(' ')}`.replace(/, $/, '')
        : nameParts.join(' ')

      Object.assign(employee, updated)
    },
    applyShiftToAll(code: string, shift: ShiftDetails) {
      if (!this.currentImport) return
      this.currentImport.employees.forEach(employee => {
        employee.shiftCode = code
        employee.shiftDetails = shift
      })
      this.currentImport.attendance.forEach(record => {
        const employee = this.currentImport?.employees.find(item => item.employeeId === record.employeeId)
        if (employee?.shiftDetails) calculateAttendance(record, employee.shiftDetails)
      })
    },
    updateEmployeeShift(employeeId: string, code: string, shift: ShiftDetails) {
      const employee = this.currentImport?.employees.find(item => item.employeeId === employeeId)
      if (!employee || !this.currentImport) return
      employee.shiftCode = code
      employee.shiftDetails = shift
      this.currentImport.attendance
        .filter(record => record.employeeId === employeeId)
        .forEach(record => calculateAttendance(record, shift))
    },
    closeDetailsDialog() { this.isDetailsDialogOpen = false },
    clearImport() {
      this.currentImport = null
      this.currentEmployeeImport = null
      this.selectedEmployeeId = null
      this.isDetailsDialogOpen = false
    }
  }
})
