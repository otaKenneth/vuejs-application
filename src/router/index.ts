/**
 * router/index.ts
 *
 * Manual routes for ./src/pages/*.vue
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router'
import Index from '@/pages/index.vue'
import HomeLayout from '@/layouts/HomeLayout.vue'
import Home from '@/pages/Home/Home.vue'
import Services from '@/pages/Home/Services.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: HomeLayout,
      children: [
        {
          path: '',
          component: Home
        },
        {
          path: 'services',
          component: Services
        }
      ]
    },
    {
      path: '/login',
      component: AuthLayout,
      children: [
        {
          path: '',
          component: () => import('@/pages/Auth/Login.vue')
        }
      ]
    },
    {
      path: '/business',
      component: AdminLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '/:pathMatch(.*)*',
          component: Index
        },
        {
          path: 'list',
          component: () => import('@/pages/Business/List.vue')
        },
        {
          path: 'profile',
          component: () => import('@/pages/Business/Register.vue')
        },
        {
          path: 'employees',
          component: () => import('@/pages/Employees/List.vue')
        },
        {
          path: 'shifts',
          component: () => import('@/pages/Shifts/List.vue')
        }
      ]
    },
  ],
})

export default router
