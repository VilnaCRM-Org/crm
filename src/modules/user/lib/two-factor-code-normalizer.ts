import type { TwoFactorCodeAcceptance } from '@/modules/user/types/two-factor/code';

export default class TwoFactorCodeNormalizer {
  private readonly totpCode = /^\d{6}$/;

  private readonly recoveryCode = /^[A-Za-z0-9]{4}-?[A-Za-z0-9]{4}$/;

  private readonly whitespace = /\s/g;

  private readonly recoveryGroupLength = 4;

  public normalize(raw: string, accept: TwoFactorCodeAcceptance): string | null {
    const compact = raw.replace(this.whitespace, '');
    if (accept !== 'recovery' && this.totpCode.test(compact)) return compact;
    if (accept === 'totp' || !this.recoveryCode.test(compact)) return null;
    const letters = compact.replace('-', '').toUpperCase();
    const group = this.recoveryGroupLength;
    return `${letters.slice(0, group)}-${letters.slice(group)}`;
  }
}
