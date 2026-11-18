<template>
  <v-container>
    <v-card>
      <v-card-text>
        <v-form @submit.prevent="handleSubmit">
          <v-text-field label="Business Name" variant="outlined"
            v-model="form.name"
            :rules="[rules.required]"
          ></v-text-field>
          <v-text-field label="Email" variant="outlined"
            v-model="form.email"
            :rules="[rules.required, rules.email]"
          ></v-text-field>
          <v-text-field label="Phone (Optional)" variant="outlined"
            v-model="form.phone"
          ></v-text-field>
          <v-text-field label="Address (Optional)" variant="outlined"
            v-model="form.address"
          ></v-text-field>
          
          <v-btn class="w-full text-lg" color="primary" type="submit">Create New Business Profile</v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getBusinessProfile, storeBusinessProfile } from '@/api/business'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const appStore = useAppStore()
const form = reactive({
  name: '',
  email: '',
  phone: '',
  address: ''
})

const rules = {
  required: value => !!value || 'Required.',
  email: value => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || 'Invalid e-mail.'
  }
}

function handleSubmit() {
  // Handle form submission logic here
  storeBusinessProfile(appStore.token, form).then(response => {
    const { success } = response
    if (success) {
      router.push('/business/list')
    }
  }).catch(error => {
    console.error('Error storing business profile:', error)
  })
}
</script>