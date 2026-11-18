
import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

const amoLight = {
  dark: false,
  colors: {
    primary: '#493078',
    secondary: '#8064C8',
    accent: '#D6B878',

    background: '#F8F6FC',
    surface: '#FFFFFF',

    success: '#258568',
    info: '#647FC5',
    warning: '#D6A044',
    error: '#C65B68',

    'on-primary': '#FFFFFF',
    'on-secondary': '#FFFFFF',
    'on-background': '#29213B',
    'on-surface': '#29213B',
  },
}

const amoDark = {
  dark: true,
  colors: {
    primary: '#B69AEF',
    secondary: '#A991E8',
    accent: '#D6B878',

    background: '#171321',
    surface: '#211B30',

    success: '#55C9A0',
    info: '#8BA7ED',
    warning: '#E8BB68',
    error: '#ED8290',

    'on-primary': '#25163F',
    'on-secondary': '#25163F',
    'on-background': '#F1ECF8',
    'on-surface': '#F1ECF8',
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
