<template>
  <v-card>
    <v-card-title class="flex align-center">
      Shifts
      <v-spacer></v-spacer>
      <v-btn-group>
        <v-btn color="primary">Create</v-btn>
      </v-btn-group>
    </v-card-title>
    <v-card-text>
      <v-data-table-server
        v-bind="table"
        @update:options="fetchShifts"
      ></v-data-table-server>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { getShifts } from '@/api/shifts'
import { useAppStore } from '@/stores/app';


const useApp = useAppStore()
const $this = reactive({
  tableLoading: true
})
const table = reactive({
  headers: [
    { title: "Code", key: "code" },
    { title: "Day of Week", key: "day_of_week" },
    { title: "Clock-In", key: "clock_in" },
    { title: "Clock-Out", key: "clock_out" },
    { title: "Break-In", key: "break_in" },
    { title: "Break-Out", key: "break_out" },
    { title: "Allow Break", key: "allow_break" },
    { title: "Flexible", key: "is_flexible" },
    { title: "PUBLIC", key: "is_general_shift" },
    { title: "Action", key: "id" },
  ],
  items: [],
  page: 1,
  itemsPerPage: 10,
  sortBy: [],
  groupBy: [],
  search: "",
  itemsLength: 0,
})

const fetchShifts = async ({
  page,
  itemsPerPage,
  sortBy,
  groupBy,
  search,
}: any) => {
  $this.tableLoading = true;
  getShifts(useApp.token, useApp.business, {
    page, itemsPerPage,sortBy,groupBy,search,
  }).then(resp => {
    console.log(resp)
  })
}
</script>