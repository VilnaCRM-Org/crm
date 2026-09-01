const ROUTE_PATHS = {
  home: '/',
  signUp: '/sign-up',
  signIn: '/sign-in',
  // Declared ahead of the flow it names: the `forgotPassword` feature flag (issue #145) gates the
  // sign-in link that points here and stays off until the recovery route is implemented.
  passwordRecovery: '/password-recovery',
  notFound: '*',
} as const;

export default ROUTE_PATHS;
