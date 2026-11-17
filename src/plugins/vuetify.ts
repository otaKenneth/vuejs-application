
import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

const amoLight = {
  dark: false,
  colors: {
    primary: '#082B5C',
    secondary: '#078DE0',
    accent: '#FF9800',

    background: '#F4F7FB',
    surface: '#FFFFFF',

    success: '#16865B',
    info: '#0284C7',
    warning: '#F59E0B',
    error: '#DC2626',

    'on-primary': '#FFFFFF',
    'on-secondary': '#FFFFFF',
    'on-background': '#172B4D',
    'on-surface': '#172B4D',
  },
}

const amoDark = {
  dark: true,
  colors: {
    primary: '#4DA3FF',
    secondary: '#38BDF8',
    accent: '#FFB547',

    background: '#101827',
    surface: '#192538',

    success: '#34D399',
    info: '#38BDF8',
    warning: '#FBBF24',
    error: '#F87171',

    'on-primary': '#082B5C',
    'on-secondary': '#082B5C',
    'on-background': '#E5EDF8',
    'on-surface': '#E5EDF8',
  },
}

export default createVuetify({
  theme: {
    defaultTheme: 'amoLight',
    themes: {
      amoLight,
      amoDark,
    },
  },

  defaults: {
    VBtn: {
      rounded: 'lg',
      elevation: 0,
    },

    VCard: {
      rounded: 'lg',
      elevation: 0,
    },

    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'secondary',
    },

    VTextarea: {
      variant: 'outlined',
      color: 'secondary',
    },

    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'secondary',
    },

    VAutocomplete: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'secondary',
    },
  },

  display: {
    mobileBreakpoint: 'md',
    thresholds: {
      xs: 0,
      sm: 600,
      md: 840,
      lg: 1145,
      xl: 1545,
      xxl: 2138,
    },
  },
})
