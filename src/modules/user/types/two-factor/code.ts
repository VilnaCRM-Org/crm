export type TwoFactorCodeKind = 'totp' | 'recovery';

export type TwoFactorCodeAcceptance = 'totp' | 'recovery' | 'any';

export type TwoFactorFieldError = 'incomplete' | 'format' | 'invalid_code';

export type TwoFactorBannerCode = 'rate_limited' | 'transient';
