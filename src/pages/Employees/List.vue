<template>
  <v-container>
    <h1>Employees</h1>

    <v-data-table-server v-bind="table" @update:options="fetchEmployees">
      <template #item.first_name="{ item }">
        <span>{{ item.last_name }}, {{ item.first_name }} {{ item?.middle_name }} {{ item?.suffix }}</span>
      </template>
    </v-data-table-server>
  </v-container>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import { useAppStore } from '@/stores/app';
import { getEmployeeListByBusiness } from '@/api/employees';

const userStore = useAppStore();
const $this = reactive({
  tableLoading: false,
})
const table = reactive({
  headers: [
    { title: 'ID', value: 'id' },
    { title: 'Name', value: 'first_name' },
    { title: 'Email', value: 'email' },
    { title: 'Phone', value: 'phone' },
  ],
  items: [],
  page: 1,
  itemsPerPage: 10,
  sortBy: [],
  groupBy: [],
  search: '',
  itemsLength: 0,
})

const fetchEmployees = async ({page, itemsPerPage, sortBy, groupBy, search}) => {
  $this.tableLoading = true;
  try {
    const token = localStorage.getItem('token');
    const business_id = userStore.business
    const { data, message, success } = await getEmployeeListByBusiness(token, business_id, { page, itemsPerPage, sortBy, groupBy, search });
    table.items = data.data;
    table.itemsLength = data.total;
    $this.tableLoading = false
  } catch (error) {
    console.error('Error fetching employees:', error);
    $this.tableLoading = false
  }
};

watch(
  () => userStore.business,
  (newBusinessId) => {
    if (newBusinessId && !$this.tableLoading) {
      fetchEmployees({ page: table.page, itemsPerPage: table.itemsPerPage, sortBy: table.sortBy, groupBy: table.groupBy, search: table.search });
    }

    return;
  },
  { immediate: true }
)
</script>