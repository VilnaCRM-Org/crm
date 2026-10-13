const ROUTE_PATHS = {
  home: '/',
  signUp: '/sign-up',
  signIn: '/sign-in',
  passwordRecovery: '/password-recovery',
  passwordReset: '/password-reset',
  forbidden: '/forbidden',
  serverError: '/server-error',
  notFound: '*',
} as const;

export default ROUTE_PATHS;
