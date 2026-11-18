<template>
  <v-dialog :model-value="attendanceStore.isDetailsDialogOpen" max-width="900" @update:model-value="!$event && attendanceStore.closeDetailsDialog()">
    <v-card v-if="employee">
      <v-card-title>Employee details</v-card-title>
      <v-card-subtitle>Complete the profile for {{ employee.name }} (ID: {{ employee.employeeId }})</v-card-subtitle>
      <v-card-text>
        <v-form ref="formRef" @submit.prevent="save">
          <v-row>
            <v-col cols="12" sm="6"><v-text-field v-model="form.firstName" label="First name" /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.lastName" label="Last name" /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.middleName" label="Middle name" /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.suffix" label="Suffix" /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.email" label="Email" type="email" :rules="[value => !value || /.+@.+\\..+/.test(value) || 'Enter a valid email']" /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.phone" label="Phone number" /></v-col>
            <v-col cols="12"><v-text-field :model-value="employee.department" label="Department" readonly /></v-col>
          </v-row>
        </v-form>
        <v-divider class="my-4" />
        <div class="text-subtitle-1 mb-2">Attendance records ({{ attendanceStore.attendanceForSelectedEmployee.length }})</div>
        <v-data-table :headers="attendanceHeaders" :items="attendanceStore.attendanceForSelectedEmployee" density="compact" />
      </v-card-text>
      <v-card-actions><v-spacer /><v-btn variant="text" @click="attendanceStore.closeDetailsDialog()">Close</v-btn><v-btn color="primary" @click="save">Save details</v-btn></v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue'
import { useAttendanceStore } from '@/stores/attendance'
const attendanceStore = useAttendanceStore()
const formRef = ref()
const employee = computed(() => attendanceStore.selectedEmployee)
const form = reactive({ firstName: '', lastName: '', middleName: '', suffix: '', email: '', phone: '' })
const attendanceHeaders = [
  { title: 'Date', key: 'date' }, { title: '1st IN', key: 'firstOnDuty' }, { title: '1st OUT', key: 'firstOffDuty' },
  { title: '2nd IN', key: 'secondOnDuty' }, { title: '2nd OUT', key: 'secondOffDuty' },
  { title: 'Late (min)', key: 'lateMinutes' }, { title: 'Leave early (min)', key: 'leaveEarlyMinutes' }
]
watch(() => attendanceStore.selectedEmployeeId, () => {
  const current = attendanceStore.selectedEmployee
  Object.assign(form, { firstName: current?.firstName ?? '', lastName: current?.lastName ?? '', middleName: current?.middleName ?? '', suffix: current?.suffix ?? '', email: current?.email ?? '', phone: current?.phone ?? '' })
}, { immediate: true })
async function save() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) return
  if (employee.value) attendanceStore.updateEmployee(employee.value.employeeId, { ...form })
  attendanceStore.closeDetailsDialog()
}
</script>
