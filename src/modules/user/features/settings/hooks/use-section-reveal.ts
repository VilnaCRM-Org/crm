import { useLayoutEffect } from 'react';
import { useWatch } from 'react-hook-form';

import type { SectionRevealOptions } from '../types/hooks/use-section-reveal';
import type { ProfileFormValues } from '../types/user-profile/profile-form-values';

export default function useSectionReveal({
  section,
  user,
  changes,
  onChange,
}: SectionRevealOptions): boolean {
  const value = useWatch<ProfileFormValues, typeof section>({ name: section });
  const changed =
    section === 'fullName' ? changes.nameChanged(user, value) : changes.emailChanged(user, value);

  useLayoutEffect(() => {
    onChange(changed);
  }, [changed, onChange]);

  return changed;
}
