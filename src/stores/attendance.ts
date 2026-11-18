import { defineStore } from 'pinia'

export interface ImportedEmployee {
  employeeId: string; name: string; department: string; email: string; phone: string
  first_name: string; last_name: string; middle_name: string; suffix: string
}
export interface AttendanceRecord {
  employeeId: string; employeeName: string; date: string
  firstOnDuty: string; firstOffDuty: string; secondOnDuty: string; secondOffDuty: string
  lateMinutes: string; leaveEarlyMinutes: string; absenceMinutes: string; totalMinutes: string; note: string
}
export interface AttendanceImport {
  fileName: string; employees: ImportedEmployee[]; attendance: AttendanceRecord[]; importedAt: string
}
export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    currentImport: null as AttendanceImport | null,
    selectedEmployeeId: null as string | null,
    isDetailsDialogOpen: false
  }),
  getters: {
    selectedEmployee: state => state.currentImport?.employees.find(employee => employee.employeeId === state.selectedEmployeeId) ?? null,
    attendanceForSelectedEmployee: state => state.currentImport?.attendance.filter(record => record.employeeId === state.selectedEmployeeId) ?? []
  },
  actions: {
    setImport(payload: AttendanceImport) { this.currentImport = payload; this.selectedEmployeeId = payload.employees[0]?.employeeId ?? null },
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
    closeDetailsDialog() { this.isDetailsDialogOpen = false },
    clearImport() { this.currentImport = null; this.selectedEmployeeId = null; this.isDetailsDialogOpen = false }
  }
})
