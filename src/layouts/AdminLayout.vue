<template>
  <v-navigation-drawer>
    <v-list-item title>
      <v-list-item-title>
        <img src="@/assets/logo.png" alt="AMO Logo" srcset="@/assets/logo.png" />
      </v-list-item-title>
    </v-list-item>
    <v-divider></v-divider>
    <v-list-item class="my-0">
      <v-select :items="appStore.user?.businesses" label="Business"
        style="padding: 2px;"
        density="compact"
        variant="solo"
        elevated
        hide-details
        item-value="id"
        item-title="name"
        v-model="appStore.business"
      ></v-select>
    </v-list-item>
    <v-divider class="mb-5"></v-divider>
    <v-list class="pa-3" nav dense>
      <v-list-item to="/business/dashboard" rounded="lg" color="primary">Dashboard</v-list-item>
      <v-list-item to="/business/list" rounded="lg" color="primary">Business</v-list-item>
      <v-list-item to="/business/employees" rounded="lg" color="primary">Employees</v-list-item>
      <v-list-item to="/business/shifts" rounded="lg" color="primary">Shifts</v-list-item>
      <v-list-item to="/business/dtr" rounded="lg" color="primary">DTR</v-list-item>
      <v-list-item to="/business/payroll" rounded="lg" color="primary">Payroll</v-list-item>
      <v-list-item to="/business/transactions" rounded="lg" color="primary">Transactions</v-list-item>
    </v-list>
    <v-list-item rounded="lg" color="primary">Logout</v-list-item>
  </v-navigation-drawer>
  <v-container>
    <router-view />
  </v-container>
</template>

<script setup>
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
</script>