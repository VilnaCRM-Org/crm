export type ProfileSection = 'fullName' | 'email' | 'password';

export type RevealedProfileSection = Exclude<ProfileSection, 'password'>;
