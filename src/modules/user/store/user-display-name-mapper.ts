import { injectable } from 'tsyringe';

import type { UserDisplayName } from '@/modules/user/types/lib/user-display-name';

const FULL_PIB_WORDS = 3;

@injectable()
export default class UserDisplayNameMapper {
  public fromFullName(fullName: string): UserDisplayName {
    const displayName = this.displayNameOf(fullName);

    return { displayName, monogram: this.monogramOf(displayName) };
  }

  private displayNameOf(fullName: string): string {
    const words = fullName.trim().split(/\s+/u);

    return words.length < FULL_PIB_WORDS ? fullName : words.slice(0, 2).reverse().join(' ');
  }

  private monogramOf(displayName: string): string {
    return Array.from(displayName.matchAll(/(?<!\S)\S/gu), ([initial]) => initial)
      .join('')
      .toUpperCase();
  }
}
