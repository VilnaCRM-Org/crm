const ROUTE_PATHS = {
  home: '/',
  signUp: '/sign-up',
  signIn: '/sign-in',
  // Declared ahead of the flow it names (issue #315): the sign-in forgot-password link points
  // here and lands on the not-found page until a route contract registers it.
  passwordRecovery: '/password-recovery',
  forbidden: '/forbidden',
  serverError: '/server-error',
  notFound: '*',
} as const;

export default ROUTE_PATHS;
