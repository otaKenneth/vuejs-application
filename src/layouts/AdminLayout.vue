<template>
  <v-navigation-drawer>
    <v-list-item title>
      <v-list-item-content>
        <v-list-item-title>AMO</v-list-item-title>
        <v-list-item-subtitle>{{ appStore.user?.email }}</v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
    <v-list-item class="my-5">
      <v-select :items="appStore.user?.businesses" label="Business"
        density="compact"
        variant="solo"
        elevated
        hide-details
        item-value="id"
        item-title="name"
        v-model="appStore.business"
      ></v-select>
    </v-list-item>
    <v-divider class="my-5"></v-divider>
    <v-list-item to="/business/dashboard">Dashboard</v-list-item>
    <v-list-item to="/business/list">Business</v-list-item>
    <v-list-item to="/business/employees">Employees</v-list-item>
    <v-list-item to="/business/shifts">Shifts</v-list-item>
    <v-list-item to="/business/dtr">DTR</v-list-item>
    <v-list-item to="/business/payroll">Payroll</v-list-item>
    <v-list-item to="/business/transactions">Transactions</v-list-item>
    <v-list-item>Logout</v-list-item>
  </v-navigation-drawer>
  <v-container>
    <router-view />
  </v-container>
</template>

<script setup>
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
</script>