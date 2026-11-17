<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import axiosInstance from '@/api/axios';
import GoogleSignInButton from '@/components/GoogleSignInButton.vue'
import { useAppStore } from '@/stores/app'
import { login } from '@/api/auth'

const router = useRouter()
const appStore = useAppStore()

const form = reactive({
  email: '',
  password: '' //V11c2NfOVKS4
})

async function onGoogleCredential(credential) {
  try {
    const { data } = await axiosInstance.post('/auth/google', { credential })
    const respData = data.data
    // store data.token the same way your existing login does
    localStorage.setItem('token', respData.token)
    appStore.setToken(respData.token)
    appStore.setUser(respData.user)
    router.push(respData.needs_business_registration == null ? '/business/profile' : '/dashboard')
  } catch (e) {
    // show an error message
  }
}

function onCredential(credential) {
  console.log('Google Sign-In Credential:', credential)
  onGoogleCredential(credential)
}

function onError(error) {
  console.error('Google Sign-In Error:', error)
}

function onSubmit() {
  login(form).then((response) => {
    const { data } = response
    // Handle the login response
    localStorage.setItem('token', data.token)
    appStore.setToken(data.token)
    appStore.setUser(data.user)
    router.push(data.needs_business_registration == null ? '/business/profile' : '/dashboard')
  }).catch((error) => {
    console.error('Login failed:', error)
  })
}
</script>

<template>
  <div id="login-container">
    <v-card>
      <v-card-title>
        <h1 class="text-center font-bold text-2xl mb-4">Login</h1>
      </v-card-title>
      <v-card-text>
        <v-form @submit.prevent="onSubmit">
          <v-text-field label="Email" variant="outlined" v-model="form.email"/>
          <v-text-field label="Password" type="password" variant="outlined" v-model="form.password"/>
          <v-btn class="w-full text-lg" color="primary" type="submit">Login</v-btn>
        </v-form>
        <v-divider class="my-5">OR</v-divider>
        <div class="w-full">
          <GoogleSignInButton @credential="onCredential" @error="onError" />
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
#login-container {
  max-width: 400px;
  width: 100%;
  margin: 0 auto;
}

@media screen and (max-width: 600px) {
  #login-container {
    max-width: 600px;
    padding: 0 16px;
  }
}
</style>