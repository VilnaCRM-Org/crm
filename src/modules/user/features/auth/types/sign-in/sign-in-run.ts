import type { SignInDto } from '@/modules/user/types/user/sign-in-dto';

export type SignInRun = (dto: SignInDto, signal: AbortSignal) => Promise<void>;
