import container from '@/config/dependency-injection-config';

import AuthStoreActions from './auth-store-actions';
import AuthStoreFactory from './auth-store-factory';

export { default as AuthStoreSelectors } from './auth-store-selectors';
export type { AuthState, AuthStore } from '../types/auth-store';
export type { UseAuthStore } from './auth-store-factory';

export const useAuthStore = AuthStoreFactory.create(container.resolve(AuthStoreActions));
