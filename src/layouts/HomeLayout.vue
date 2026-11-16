<template>
  <v-app-bar>
    <v-toolbar-title>AMO Payroll</v-toolbar-title>
    <div class="d-flex ga-2 align-self-center">
      <v-btn to="/" exact class="mr-2">Home</v-btn>
      <v-btn to="/services" exact class="mr-2">Services</v-btn>
      <v-btn to="/contact" exact class="mr-2">Contact Us</v-btn>
    </div>
    <v-spacer />
    <v-btn to="/login" primary>Login</v-btn>
  </v-app-bar>
  <v-container>
    <router-view />
  </v-container>
</template>