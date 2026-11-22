<template>
  <v-card>
    <v-card-title class="flex items-center">
      Shifts
      <v-spacer />
      <v-btn color="primary" @click="createDialogOpen = true">Create</v-btn>
    </v-card-title>
    <v-card-text>
      <v-data-table-server
        v-bind="table"
        :loading="$this.tableLoading"
        @update:options="fetchShifts"
      >
        <template #item.allow_break="{ item }">
          <v-chip size="small" :color="item.allow_break ? 'success' : 'default'" variant="tonal">
            {{ item.allow_break ? 'Yes' : 'No' }}
          </v-chip>
        </template>
        <template #item.is_flexible="{ item }">
          <v-chip size="small" :color="item.is_flexible ? 'success' : 'default'" variant="tonal">
            {{ item.is_flexible ? 'Yes' : 'No' }}
          </v-chip>
        </template>
        <template #item.is_general_shift="{ item }">
          <v-chip size="small" :color="item.is_general_shift ? 'success' : 'default'" variant="tonal">
            {{ item.is_general_shift ? 'Public' : 'Private' }}
          </v-chip>
        </template>
      </v-data-table-server>
    </v-card-text>

    <CreateShiftModal
      v-model="createDialogOpen"
      :loading="creating"
      @create="createShift"
    />
  </v-card>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { getShifts, storeShift } from '@/api/shifts'
import { useAppStore } from '@/stores/app'
import CreateShiftModal from './modals/CreateShiftModal.vue'

type ShiftPayload = {
  code: string
  day_of_week: string
  clock_in: string
  clock_out: string
  break_in: string | null
  break_out: string | null
  allow_break: boolean
  is_flexible: boolean
  is_general_shift: boolean
}

const useApp = useAppStore()
const createDialogOpen = ref(false)
const creating = ref(false)
const $this = reactive({ tableLoading: true })
const table = reactive({
  headers: [
    { title: 'Code', key: 'code' },
    { title: 'Day of Week', key: 'day_of_week' },
    { title: 'Clock-In', key: 'clock_in' },
    { title: 'Clock-Out', key: 'clock_out' },
    { title: 'Break-In', key: 'break_in' },
    { title: 'Break-Out', key: 'break_out' },
    { title: 'Allow Break', key: 'allow_break' },
    { title: 'Flexible', key: 'is_flexible' },
    { title: 'PUBLIC', key: 'is_general_shift' },
    { title: 'Action', key: 'id' },
  ],
  items: [],
  page: 1,
  itemsPerPage: 10,
  sortBy: [],
  groupBy: [],
  search: '',
  itemsLength: 0,
})

const fetchShifts = async ({ page, itemsPerPage, sortBy, groupBy, search }: any) => {
  $this.tableLoading = true
  try {
    const resp = await getShifts(useApp.token, useApp.business, {
      page, itemsPerPage, sortBy, groupBy, search,
    })
    const payload = resp?.data
    table.items = payload?.data ?? []
    table.itemsLength = payload?.total ?? 0
  } catch (error) {
    console.error('Unable to fetch shifts:', error)
  } finally {
    $this.tableLoading = false
  }
}

/**
 * The modal emits a backend-shaped shift payload. Wire this handler to the
 * shift-create API action when that endpoint is available in the frontend API.
 */
async function createShift(payload: ShiftPayload) {
  creating.value = true
  try {
    console.info('Shift ready for API submission:', payload)
    storeShift(useApp.token, useApp.business, payload)
      .then((resp:any) => {
        const { success, message } = resp
        if (success) {
          console.log(message)
        }
      }).catch((err:any) => {
        const { response } = err
        if (response.data) {
          console.log(response.data)
        } else {
          console.error(err)
        }
      })
    createDialogOpen.value = false
  } finally {
    creating.value = false
  }
}
</script>
