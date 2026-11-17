/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Composables
import { createApp } from 'vue'

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Styles
import 'unfonts.css'
import './styles/tailwind.css'
import './styles/main.scss'

const app = createApp(App)

registerPlugins(app)

import router from '@/router';
import { useAppStore } from '@/stores/app'
import { refresh } from '@/api/auth'

const userStore = useAppStore()


let sessionPromise: Promise<void> | null = null;

async function loadSession(token: string | null): Promise<void> {
  if (userStore.token === token) {
    return;
  }

  if (!sessionPromise) {
    sessionPromise = refresh(token)
      .then((response: any) => {
        const { token, user } = response.data

        userStore.setToken(token);
        userStore.setUser(user);
      })
      .finally(() => {
        sessionPromise = null;
      });
  }

  await sessionPromise;
}


router.beforeEach(async (to) => {
  // Public routes don't require authentication.
  if (!to.meta.requiresAuth) {
    return true
  }

  const token = localStorage.getItem('token')

  // Protected routes require a token.
  if (!token) {
    return {
      path: '/login',
      query: { to: to.fullPath }
    }
  }

  try {
    await loadSession(token)
    return true
  } catch (error) {
    console.error('Unable to restore user session:', error)

    localStorage.removeItem('token')
    localStorage.removeItem('user')
    userStore.setToken(null)

    return {
      path: '/login',
      query: { to: to.fullPath }
    }
  }
})

app.mount('#app')
