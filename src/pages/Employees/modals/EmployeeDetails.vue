<template>
  <v-dialog :model-value="attendanceStore.isDetailsDialogOpen" max-width="1100" @update:model-value="!$event && attendanceStore.closeDetailsDialog()" scrollable>
    <v-card v-if="employee">
      <v-card-title>Employee details</v-card-title>
      <v-card-subtitle>Complete the profile for {{ employee.name }} (ID: {{ employee.employeeId }})</v-card-subtitle>
      <v-card-text>
        <v-form ref="formRef" @submit.prevent="save">
          <v-row>
            <v-col cols="12" sm="6"><v-text-field v-model="form.first_name" label="First name" /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.last_name" label="Last name" /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.middle_name" label="Middle name" /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.suffix" label="Suffix" /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.email" label="Email" type="email" :rules="[value => !value || /.+@.+\\..+/.test(value) || 'Enter a valid email']" /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.phone" label="Phone number" /></v-col>
            <v-col cols="12"><v-text-field :model-value="employee.department" label="Department" readonly /></v-col>
          </v-row>
        </v-form>

        <v-divider class="my-4" />
        <div class="text-subtitle-1 mb-2">Assigned shift</div>
        <v-row align="center">
          <v-col cols="12" sm="6">
            <v-select
              label="Employee shift"
              :items="shifts"
              item-title="code"
              item-value="code"
              :model-value="employee.shiftCode ?? null"
              @update:model-value="changeShift"
            />
          </v-col>
          <v-col cols="12" v-if="employee.shiftDetails?.length">
            <div class="text-body-2 mb-1">Weekly schedule</div>
            <v-chip
              v-for="schedule in employee.shiftDetails"
              :key="schedule.day_of_week"
              class="mr-2 mb-2"
              size="small"
              variant="tonal"
            >
              {{ schedule.day_of_week }}: {{ schedule.clock_in }} – {{ schedule.clock_out }}
            </v-chip>
          </v-col>
        </v-row>

        <v-divider class="my-4" />
        <div class="text-subtitle-1 mb-2">
          Attendance records ({{ attendanceStore.attendanceForSelectedEmployee.length }})
        </div>
        <v-data-table
          :headers="attendanceHeaders"
          :items="attendanceStore.attendanceForSelectedEmployee"
          density="compact"
          :items-per-page="10"
        >
          <template #item.lateMinutes="{ item }">{{ item.lateMinutes || '0' }}</template>
          <template #item.leaveEarlyMinutes="{ item }">{{ item.leaveEarlyMinutes || '0' }}</template>
          <template #item.overtimeMinutes="{ item }">{{ item.overtimeMinutes || '0' }}</template>
        </v-data-table>
        <div class="text-caption text-medium-emphasis mt-2">
          Late, early-out, and overtime values are calculated in minutes from the employee's assigned shift and biometric punches.
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="attendanceStore.closeDetailsDialog()">Close</v-btn>
        <v-btn color="primary" @click="save">Save details</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue'
import { useAttendanceStore } from '@/stores/attendance'

defineProps<{
  shifts: Array<{ code: string }>
}>()
const emit = defineEmits<{
  (event: 'shift-change', employeeId: string, shiftCode: string): void
}>()

const attendanceStore = useAttendanceStore()
const formRef = ref()
const employee = computed(() => attendanceStore.selectedEmployee)
const form = reactive({ first_name: '', last_name: '', middle_name: '', suffix: '', email: '', phone: '' })
const attendanceHeaders = [
  { title: 'Date', key: 'date' },
  { title: '1st IN', key: 'firstOnDuty' },
  { title: '1st OUT', key: 'firstOffDuty' },
  { title: '2nd IN', key: 'secondOnDuty' },
  { title: '2nd OUT', key: 'secondOffDuty' },
  { title: 'Late (min)', key: 'lateMinutes' },
  { title: 'Early out (min)', key: 'leaveEarlyMinutes' },
  { title: 'Overtime (min)', key: 'overtimeMinutes' },
]

watch(() => attendanceStore.selectedEmployeeId, () => {
  const current = attendanceStore.selectedEmployee
  Object.assign(form, {
    first_name: current?.first_name ?? '',
    last_name: current?.last_name ?? '',
    middle_name: current?.middle_name ?? '',
    suffix: current?.suffix ?? '',
    email: current?.email ?? '',
    phone: current?.phone ?? ''
  })
}, { immediate: true })

function changeShift(code: string | null) {
  if (employee.value && code) emit('shift-change', employee.value.employeeId, code)
}

async function save() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) return
  if (employee.value) attendanceStore.updateEmployee(employee.value.employeeId, { ...form })
  attendanceStore.closeDetailsDialog()
}
</script>
