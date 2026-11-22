<template>
  <v-container>
    <v-card>
      <v-card-title class="flex items-center flex-wrap">
        <div class="text-h4">Employees</div>
        <v-spacer />
        <input
          id="biometrics-import"
          type="file"
          accept=".xlsx,.xls,.csv,.dat,.mhrimport"
          class="hidden"
          @change="handleBiometricsFileChanged"
        />
        <input
          id="employee-details-import"
          type="file"
          accept=".xlsx,.xls,.csv"
          class="hidden"
          @change="handleEmployeeDetailsFileChanged"
        />
        <v-btn-group class="flex gap-2">
          <v-btn color="secondary">Create</v-btn>
          <v-btn color="primary" :loading="importing" @click="handleFileUpload('biometrics')">
            Import biometrics + DTR
          </v-btn>
          <v-btn color="secondary" variant="tonal" :loading="importing" @click="handleFileUpload('employees')">
            Import employee details
          </v-btn>
        </v-btn-group>
      </v-card-title>

      <v-card-text v-if="attendanceStore.currentImport">
        <div class="d-flex align-center flex-wrap ga-2 mb-3">
          <div>
            <strong>{{ attendanceStore.currentImport.fileName }}</strong>
            <div class="text-caption">
              {{ attendanceStore.currentImport.employees.length }} employees ·
              {{ attendanceStore.currentImport.attendance.length }} attendance rows
            </div>
          </div>
          <v-spacer />
          <v-btn variant="text" color="error" @click="attendanceStore.clearImport()">Clear import</v-btn>
        </div>
        <v-alert type="info" variant="tonal" class="mb-3">
          Biometrics import includes employee identifiers and DTR punches. Review the imported employees and attendance before proceeding.
          This data is staged in this browser and has not yet been sent to the server.
        </v-alert>
        <v-row class="items-center">
          <v-col cols="6">
            <v-select
              label="Select default Shift for Employees"
              :items="$this.shifts"
              item-title="code"
              item-value="code"
              :model-value="$this.selectedShiftCode"
              :loading="$this.shiftHasChangedLoading"
              hide-details
              @update:model-value="handleDefaultShiftChange"
            ></v-select>
          </v-col>
          <v-col cols="6" class="flex justify-end">
            <v-btn color="primary">Save this Record?</v-btn>
          </v-col>
        </v-row>
        <v-data-table :headers="importHeaders" :items="attendanceStore.currentImport.employees" item-value="employeeId">
          <template #item.name="{ item }"><strong>{{ item.name }}</strong></template>
          <template #item.email="{ item }">{{ item.email || "Not provided" }}</template>
          <template #item.actions="{ item }">
            <v-btn size="small" variant="tonal" @click="attendanceStore.selectEmployee(item.employeeId)">
              Complete details
            </v-btn>
          </template>
        </v-data-table>
        <EmployeeDetails :shifts="$this.shifts" @shift-change="handleEmployeeShiftChange" />
      </v-card-text>

      <v-card-text v-else-if="attendanceStore.currentEmployeeImport">
        <div class="d-flex align-center flex-wrap ga-2 mb-3">
          <div>
            <strong>{{ attendanceStore.currentEmployeeImport.fileName }}</strong>
            <div class="text-caption">
              {{ attendanceStore.currentEmployeeImport.records.length }} employee records ·
              {{ attendanceStore.currentEmployeeImport.columns.length }} columns
            </div>
          </div>
          <v-spacer />
          <v-btn variant="text" color="error" @click="attendanceStore.clearImport()">Clear import</v-btn>
        </div>
        <v-alert type="info" variant="tonal" class="mb-3">
          Employee-only import detected. Column headers are kept exactly as provided and must match the backend column names
          (for example, last_name, first_name, and middle_name). No DTR records are included.
          The data is staged for review and has not yet been sent to the server.
        </v-alert>
        <v-data-table
          :headers="employeeDetailsHeaders"
          :items="attendanceStore.currentEmployeeImport.records"
          :items-per-page="10"
          density="comfortable"
        />
      </v-card-text>

      <v-data-table-server
        v-else
        v-bind="table"
        :loading="$this.tableLoading"
        @update:options="fetchEmployees"
      >
        <template #item.first_name="{ item }">
          <span>{{ item.last_name }}, {{ item.first_name }} {{ item?.middle_name }} {{ item?.suffix }}</span>
        </template>
      </v-data-table-server>
    </v-card>

    <AttendanceImportConfig
      v-model="importConfigOpen"
      :file-name="pendingFile ? pendingFile.name : 'Uploaded file'"
      @confirm="processPendingFile"
      @cancel="cancelPendingFile"
    />
    <v-snackbar v-model="errorSnackbar" color="error" timeout="6000">{{ importError }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, reactive, watch, ref } from "vue";
import { useAppStore } from "@/stores/app";
import { useAttendanceStore } from "@/stores/attendance";
import { getEmployeeListByBusiness } from "@/api/employees";
import { getShiftsForSelection, getShiftDetail } from '@/api/shifts'
import * as employeeService from "./employee";
import EmployeeDetails from "./modals/EmployeeDetails.vue";
import AttendanceImportConfig from "./modals/AttendanceImportConfig.vue";

const userStore = useAppStore();
const attendanceStore = useAttendanceStore();
const importing = ref(false);
const errorSnackbar = ref(false);
const importError = ref("");
const importConfigOpen = ref(false);
const pendingFile = ref<File | null>(null);
const $this = reactive({ 
  tableLoading: false,
  shifts: [],
  selectedShiftCode: '',
  selectedShiftDetail: {},
  shiftHasChangedLoading: false,
});

const importHeaders = [
  { title: "Employee ID", key: "employeeId" },
  { title: "Name", key: "name" },
  { title: "Department", key: "department" },
  { title: "Email", key: "email" },
  { title: "Phone", key: "phone" },
  { title: "Actions", key: "actions", sortable: false },
];
const employeeDetailsHeaders = computed(() =>
  (attendanceStore.currentEmployeeImport?.columns ?? []).map(column => ({
    title: column,
    key: column,
    sortable: true,
  }))
);
const table = reactive({
  headers: [
    { title: "ID", value: "id" },
    { title: "Name", value: "first_name" },
    { title: "Email", value: "email" },
    { title: "Phone", value: "phone" },
  ],
  items: [],
  page: 1,
  itemsPerPage: 10,
  sortBy: [],
  groupBy: [],
  search: "",
  itemsLength: 0,
});

const fetchEmployees = async ({ page, itemsPerPage, sortBy, groupBy, search }: any) => {
  $this.tableLoading = true;
  try {
    const token = localStorage.getItem("token");
    const { data } = await getEmployeeListByBusiness(
      token,
      userStore.business,
      { page, itemsPerPage, sortBy, groupBy, search },
    );
    table.items = data.data;
    table.itemsLength = data.total;
  } catch (error) {
    console.error("Error fetching employees:", error);
  } finally {
    $this.tableLoading = false;
    fetchShifts()    
  }
};

function fetchShifts() {
  getShiftsForSelection(userStore.token, userStore.business)
    .then((resp:any) => {
      const { array, select } = resp.data
      $this.shifts = array
      if (array.length > 0) {
        $this.selectedShiftCode = array[0].code;
        $this.selectedShiftDetail = select
      }
    }).catch((err:any) => {
      console.log(err)
    })
}

function handleFileUpload(type: "biometrics" | "employees") {
  const inputId = type === "biometrics" ? "biometrics-import" : "employee-details-import";
  (document.getElementById(inputId) as HTMLInputElement | null)?.click();
}

function handleBiometricsFileChanged(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  pendingFile.value = file;
  importConfigOpen.value = true;
  input.value = "";
}

async function handleEmployeeDetailsFileChanged(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  importing.value = true;
  try {
    const result = await employeeService.processEmployeeDetailsFile(file);
    attendanceStore.setEmployeeDetailsImport(result);
  } catch (error) {
    importError.value = error instanceof Error ? error.message : "Unable to process this employee file.";
    errorSnackbar.value = true;
  } finally {
    importing.value = false;
  }
}

async function processPendingFile(columnCount: number) {
  if (!pendingFile.value) return;
  importing.value = true;
  importConfigOpen.value = false;
  try {
    const result = await employeeService.processFile(pendingFile.value, columnCount);
    attendanceStore.setImport(result);
    pendingFile.value = null;
    if ($this.selectedShiftCode) {
      attendanceStore.applyShiftToAll($this.selectedShiftCode, $this.selectedShiftDetail)
    }
  } catch (error) {
    importError.value = error instanceof Error ? error.message : "Unable to process this file.";
    errorSnackbar.value = true;
  } finally {
    importing.value = false;
  }
}

function cancelPendingFile() {
  pendingFile.value = null;
  importConfigOpen.value = false;
}

async function handleDefaultShiftChange(value: string) {
  if (!value || !attendanceStore.currentImport) return
  $this.selectedShiftCode = value
  $this.shiftHasChangedLoading = true
  try {
    const response: any = await getShiftDetail(userStore.token, value)
    if (!response?.data) throw new Error('The selected shift details could not be loaded.')
    $this.selectedShiftDetail = response.data
    attendanceStore.applyShiftToAll(value, response.data)
  } catch (error) {
    importError.value = error instanceof Error ? error.message : 'Unable to load the selected shift.'
    errorSnackbar.value = true
  } finally {
    $this.shiftHasChangedLoading = false
  }
}

async function handleEmployeeShiftChange(employeeId: string, value: string) {
  if (!value) return
  try {
    const response: any = await getShiftDetail(userStore.token, value)
    if (!response?.data) throw new Error('The selected shift details could not be loaded.')
    attendanceStore.updateEmployeeShift(employeeId, value, response.data)
  } catch (error) {
    importError.value = error instanceof Error ? error.message : 'Unable to update this employee shift.'
    errorSnackbar.value = true
  }
}

watch(
  () => userStore.business,
  (newBusinessId) => {
    if (newBusinessId)
      fetchEmployees({
        page: table.page,
        itemsPerPage: table.itemsPerPage,
        sortBy: table.sortBy,
        groupBy: table.groupBy,
        search: table.search,
      });
  },
  { immediate: true },
);
</script>
