import { renderHook } from '@testing-library/react';

import useProfileFormModel from '@/modules/user/features/settings/hooks/use-profile-form-model';
import { buildUserEntity } from '@tests/builders';

const mockSave = jest.fn();
const mockRules = jest.fn();

jest.mock('@/modules/user/features/settings/hooks/use-profile-save', () => ({
  __esModule: true,
  default: (...args: unknown[]): unknown => mockSave(...args),
}));

jest.mock('@/modules/user/features/settings/hooks/use-profile-form-rules', () => ({
  __esModule: true,
  default: (...args: unknown[]): unknown => mockRules(...args),
}));

type Props = Parameters<typeof useProfileFormModel>[0];

describe('useProfileFormModel', () => {
  const user = buildUserEntity({ fullName: 'Олена Петренко', email: 'olena@example.com' });
  const props: Props = {
    user,
    adoption: {
      adopt: jest.fn(),
      confirm: jest.fn(),
      isCurrent: (): boolean => true,
      revision: (): number => 0,
    },
    toasts: {
      toasts: { items: [] },
      announcement: '',
      alert: '',
      show: jest.fn(),
      dismiss: jest.fn(),
    },
    saveRef: { current: null },
    headingRef: { current: null },
  };
  const save = { isSubmitting: true, changes: { detect: jest.fn() } };
  const rules = { email: {} };

  beforeEach(() => {
    mockSave.mockReset().mockReturnValue(save);
    mockRules.mockReset().mockReturnValue(rules);
  });

  it('starts from the loaded name and e-mail with every password empty', () => {
    const { result } = renderHook(() => useProfileFormModel(props, 'password'));

    expect(result.current.defaults).toStrictEqual({
      fullName: 'Олена Петренко',
      email: 'olena@example.com',
      fullNamePassword: '',
      emailPassword: '',
      currentPassword: '',
      newPassword: '',
    });
  });

  it('wires the save and the rules for the section it was given', () => {
    const { result } = renderHook(() => useProfileFormModel(props, 'email'));

    expect(mockSave).toHaveBeenCalledWith(props, 'email');
    expect(mockRules).toHaveBeenCalledWith(user, save.changes);
    expect(result.current.save).toBe(save);
    expect(result.current.rules).toBe(rules);
  });
});
