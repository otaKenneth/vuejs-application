<template>
  <v-container>
    <v-card>
      <v-card-title class="flex items-center">
        <div>Business List</div>
        <v-spacer></v-spacer>
        <v-btn variant="elevated" color="primary" nav to="/business/profile">Create</v-btn>
      </v-card-title>
      <v-card-text>
        <v-data-table-server
          v-bind="table"
          @update:options="fetchBuiness"
        >
          <template #item.user="{ item }">
            {{ item.user.email }}
          </template>
          <template #item.id="{ item }">
            <v-btn-group>
              <v-btn>Edit</v-btn>
              <v-btn>Delete</v-btn>
            </v-btn-group>
          </template>
        </v-data-table-server>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAppStore } from '@/stores/app'
import { getBusinesses } from '@/api/business'

const appStore = useAppStore()
const $this = reactive({
  tableLoading: false
})
const table = reactive({
  headers: [
    { title: "Name", key: "name" },
    { title: "Email", key: "email" },
    { title: "Phone", key: "phone" },
    { title: "Address", key: "address" },
    { title: "Owner", key: "user" },
    { title: "Actions", key: "id" },
  ],
  items: [],
  page: 1,
  itemsPerPage: 10,
  sortBy: [],
  groupBy: [],
  search: '',
  itemsLength: 0,
})

async function fetchBuiness ({page, itemsPerPage, sortBy, groupBy, search}) {
  $this.tableLoading = true;
  getBusinesses(appStore.token, { page, itemsPerPage, sortBy, groupBy, search })
    .then(response => {
      const { data } = response;
      table.items = data.data;
      table.itemsLength = data.total;
      $this.tableLoading = false

      appStore.setBusinesses(data.data)
    }).catch(error => {
      console.error('Error fetching employees:', error);
      $this.tableLoading = false
    })
}
</script>