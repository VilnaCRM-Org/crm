const ROUTE_PATHS = {
  home: '/',
  signUp: '/sign-up',
  signIn: '/sign-in',
  twoFactorChallenge: '/sign-in/two-factor',
  passwordRecovery: '/password-recovery',
  passwordReset: '/password-reset',
  settings: '/settings',
  forbidden: '/forbidden',
  serverError: '/server-error',
  boards: '/boards',
  products: '/products',
  orders: '/orders',
  contacts: '/contacts',
  analytics: '/analytics',
  settingsIntegrations: '/settings/integrations',
  settingsWebhooks: '/settings/webhooks',
  settingsBilling: '/settings/billing',
  notFound: '*',
} as const;

export default ROUTE_PATHS;
