// Utilities
import { defineStore } from 'pinia'

interface User {
  businesses: object[]
  email?: string
}

export const useAppStore = defineStore('app', {
  state: (): {
    user: User,
    token: string | null,
    business: number | null
  } => ({
    user: {
      businesses: []
    },
    token: null,
    business: null
  }),
  actions: {
    setToken(token: string | null) {
      this.token = token
    },
    setBusiness(business: number | null) {
      this.business = business
    },
    setUser(user: object) {
      this.user = user
      this.business = user?.businesses?.[0]?.id || null
    }
  }
})
