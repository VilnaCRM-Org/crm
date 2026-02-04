import TOKENS from '@/config/tokens';
import { inject, injectable } from 'tsyringe';

import type { LoginUserDto, RegisterUserDto } from '../../types/credentials';

import UserRemoteSource from './sources/user.remote';
import type { IUserRepository, LoginResult, CreateUserResult } from './user-repository.types';

/**
 * User Repository
 * Orchestrates user-related data operations through various sources
 */
@injectable()
export default class UserRepository implements IUserRepository {
  private readonly remoteSource: UserRemoteSource;

  constructor(@inject(TOKENS.UserRemoteSource) remoteSource: UserRemoteSource) {
    this.remoteSource = remoteSource;
  }

  public async login(
    credentials: LoginUserDto,
    options?: { signal?: AbortSignal }
  ): Promise<LoginResult> {
    return this.remoteSource.login(credentials, options);
  }

  public async createUser(credentials: RegisterUserDto): Promise<CreateUserResult> {
    return this.remoteSource.createUser(credentials);
  }
}
