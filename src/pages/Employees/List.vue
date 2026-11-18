<template>
  <v-container>
    <v-card>
      <v-card-title class="d-flex align-center">
        <div class="text-h4">Employees</div><v-spacer />
        <v-btn-group>
          <v-btn color="secondary">Create</v-btn>
          <input id="import" type="file" accept=".xlsx,.xls,.csv,.dat,.mhrimport" class="d-none" @change="handleInputChanged">
          <v-btn color="primary" :loading="importing" @click="handleFileUpload">Import attendance</v-btn>
        </v-btn-group>
      </v-card-title>
      <v-card-text v-if="attendanceStore.currentImport">
        <div class="d-flex align-center flex-wrap ga-2 mb-3">
          <div><strong>{{ attendanceStore.currentImport.fileName }}</strong><div class="text-caption">{{ attendanceStore.currentImport.employees.length }} employees · {{ attendanceStore.currentImport.attendance.length }} attendance rows</div></div>
          <v-spacer /><v-btn variant="text" color="error" @click="attendanceStore.clearImport()">Clear import</v-btn>
        </div>
        <v-alert type="info" variant="tonal" class="mb-3">Review the imported employee IDs and names, then open each employee to complete their contact details. Attendance is staged in this browser and is not yet sent to the server.</v-alert>
        <v-data-table :headers="importHeaders" :items="attendanceStore.currentImport.employees" item-value="employeeId">
          <template #item.name="{ item }"><strong>{{ item.name }}</strong></template>
          <template #item.email="{ item }">{{ item.email || 'Not provided' }}</template>
          <template #item.actions="{ item }"><v-btn size="small" variant="tonal" @click="attendanceStore.selectEmployee(item.employeeId)">Complete details</v-btn></template>
        </v-data-table>
        <EmployeeDetails />
      </v-card-text>
      <v-data-table-server v-else v-bind="table" :loading="$this.tableLoading" @update:options="fetchEmployees">
        <template #item.first_name="{ item }"><span>{{ item.last_name }}, {{ item.first_name }} {{ item?.middle_name }} {{ item?.suffix }}</span></template>
      </v-data-table-server>
    </v-card>
    <v-snackbar v-model="errorSnackbar" color="error" timeout="6000">{{ importError }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { reactive, watch, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { useAttendanceStore } from '@/stores/attendance'
import { getEmployeeListByBusiness } from '@/api/employees'
import * as employeeService from './employee'
import EmployeeDetails from './modals/EmployeeDetails.vue'
const userStore = useAppStore()
const attendanceStore = useAttendanceStore()
const importing = ref(false), errorSnackbar = ref(false), importError = ref('')
const $this = reactive({ tableLoading: false })
const importHeaders = [
  { title: 'Employee ID', key: 'employeeId' }, { title: 'Name', key: 'name' }, { title: 'Department', key: 'department' },
  { title: 'Email', key: 'email' }, { title: 'Phone', key: 'phone' }, { title: 'Actions', key: 'actions', sortable: false }
]
const table = reactive({
  headers: [{ title: 'ID', value: 'id' }, { title: 'Name', value: 'first_name' }, { title: 'Email', value: 'email' }, { title: 'Phone', value: 'phone' }],
  items: [], page: 1, itemsPerPage: 10, sortBy: [], groupBy: [], search: '', itemsLength: 0
})
const fetchEmployees = async ({ page, itemsPerPage, sortBy, groupBy, search }: any) => {
  $this.tableLoading = true
  try {
    const token = localStorage.getItem('token')
    const { data } = await getEmployeeListByBusiness(token, userStore.business, { page, itemsPerPage, sortBy, groupBy, search })
    table.items = data.data; table.itemsLength = data.total
  } catch (error) { console.error('Error fetching employees:', error) }
  finally { $this.tableLoading = false }
}
function handleFileUpload() { (document.getElementById('import') as HTMLInputElement)?.click() }
async function handleInputChanged(event: Event) {
  const input = event.target as HTMLInputElement, file = input.files?.[0]
  if (!file) return
  importing.value = true
  try { attendanceStore.setImport(await employeeService.processFile(file)) }
  catch (error) { importError.value = error instanceof Error ? error.message : 'Unable to process this file.'; errorSnackbar.value = true }
  finally { importing.value = false; input.value = '' }
}
watch(() => userStore.business, newBusinessId => {
  if (newBusinessId) fetchEmployees({ page: table.page, itemsPerPage: table.itemsPerPage, sortBy: table.sortBy, groupBy: table.groupBy, search: table.search })
}, { immediate: true })
</script>
