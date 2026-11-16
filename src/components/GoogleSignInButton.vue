<script setup>
import { onMounted, ref } from 'vue'

const emit = defineEmits(['credential', 'error'])
const buttonEl = ref(null)

function loadGsi() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}

onMounted(async () => {
  try {
    await loadGsi()
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: (res) => emit('credential', res.credential),
    })
    window.google.accounts.id.renderButton(buttonEl.value, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      width: 320,
    })
  } catch (e) {
    emit('error', e)
  }
})
</script>

<template>
  <div id="google-signin-button" ref="buttonEl"></div>
</template>

<style lang="scss">
#google-signin-button {
  div[role="button"] {
    width: 100% !important;
  }
}
</style>