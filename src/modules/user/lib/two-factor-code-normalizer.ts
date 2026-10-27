import type { TwoFactorCodeAcceptance } from '@/modules/user/types/two-factor/code';

const TOTP_CODE = /^\d{6}$/;
const RECOVERY_CODE = /^[A-Za-z0-9]{4}-?[A-Za-z0-9]{4}$/;
const WHITESPACE = /\s+/g;
const RECOVERY_GROUP_LENGTH = 4;

export default class TwoFactorCodeNormalizer {
  public normalize(raw: string, accept: TwoFactorCodeAcceptance): string | null {
    const compact = raw.replace(WHITESPACE, '');
    if (accept !== 'recovery' && TOTP_CODE.test(compact)) return compact;
    if (accept === 'totp' || !RECOVERY_CODE.test(compact)) return null;
    const letters = compact.replace('-', '').toUpperCase();
    return `${letters.slice(0, RECOVERY_GROUP_LENGTH)}-${letters.slice(RECOVERY_GROUP_LENGTH)}`;
  }
}
