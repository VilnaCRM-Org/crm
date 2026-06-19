import LazyModuleLoader from './lazy-module-loader';

const loginFormLoader = new LazyModuleLoader(
  () => import('@auth/components/form-section/auth-forms/login-form')
);

export default loginFormLoader;
