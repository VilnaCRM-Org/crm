import { inject, injectable } from 'tsyringe';

import TOKENS from '@/config/tokens';

import LoginAPI from './login-api';
import RegistrationAPI from './registration-api';

@injectable()
export default class AuthClients {
  constructor(
    @inject(TOKENS.LoginAPI) public readonly loginAPI: LoginAPI,
    @inject(TOKENS.RegistrationAPI) public readonly registrationAPI: RegistrationAPI
  ) {}
}
