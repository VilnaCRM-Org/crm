import { renderHook } from '@testing-library/react';

import useProfileFormModel from '@/modules/user/features/settings/hooks/use-profile-form-model';
import { buildUserEntity } from '@tests/builders';

const mockSave = jest.fn();
const mockRules = jest.fn();
const mockEmailRow = jest.fn();

jest.mock('@/modules/user/features/settings/hooks/use-profile-save', () => ({
  __esModule: true,
  default: (...args: unknown[]): unknown => mockSave(...args),
}));

jest.mock('@/modules/user/features/settings/hooks/use-profile-form-rules', () => ({
  __esModule: true,
  default: (...args: unknown[]): unknown => mockRules(...args),
}));

jest.mock('@/modules/user/features/settings/hooks/use-email-row', () => ({
  __esModule: true,
  default: (...args: unknown[]): unknown => mockEmailRow(...args),
}));

type Props = Parameters<typeof useProfileFormModel>[0];

describe('useProfileFormModel', () => {
  const user = buildUserEntity({ fullName: 'Олена Петренко', email: 'olena@example.com' });
  const props: Props = {
    user,
    adoption: { adopt: jest.fn(), confirm: jest.fn() },
    toasts: {
      toasts: { items: [] },
      announcement: '',
      alert: '',
      show: jest.fn(),
      dismiss: jest.fn(),
    },
    saveRef: { current: null },
  };
  const save = { isSubmitting: true, changes: { detect: jest.fn() } };
  const rules = { email: {} };
  const emailRow = { confirmed: true, busy: false, resend: jest.fn() };

  beforeEach(() => {
    mockSave.mockReset().mockReturnValue(save);
    mockRules.mockReset().mockReturnValue(rules);
    mockEmailRow.mockReset().mockReturnValue(emailRow);
  });

  it('starts from the loaded name and e-mail with both passwords empty', () => {
    const { result } = renderHook(() => useProfileFormModel(props));

    expect(result.current.defaults).toStrictEqual({
      fullName: 'Олена Петренко',
      email: 'olena@example.com',
      currentPassword: '',
      newPassword: '',
    });
  });

  it('wires the save, the rules and the e-mail row from the same props', () => {
    const { result } = renderHook(() => useProfileFormModel(props));

    expect(mockSave).toHaveBeenCalledWith(props);
    expect(mockRules).toHaveBeenCalledWith(user, save.changes);
    expect(mockEmailRow).toHaveBeenCalledWith(props, true);
    expect(result.current.save).toBe(save);
    expect(result.current.rules).toBe(rules);
    expect(result.current.emailRow).toBe(emailRow);
  });
});
