import { renderHook } from '@testing-library/react';

import useEmailRow from '@/modules/user/features/settings/hooks/use-email-row';
import { buildUserEntity } from '@tests/builders';

const mockConnectivity = jest.fn<boolean, []>();
const mockEmailResend = jest.fn();

jest.mock('@/hooks/use-connectivity', () => ({
  __esModule: true,
  default: (): boolean => mockConnectivity(),
}));

jest.mock('@/modules/user/features/settings/hooks/use-email-resend', () => ({
  __esModule: true,
  default: (...args: unknown[]): unknown => mockEmailResend(...args),
}));

type Props = Parameters<typeof useEmailRow>[0];

const props = (confirmed: boolean): Props => ({
  user: buildUserEntity({ confirmed }),
  adoption: { adopt: jest.fn(), confirm: jest.fn() },
  toasts: {
    toasts: { items: [] },
    announcement: '',
    alert: '',
    show: jest.fn(),
    dismiss: jest.fn(),
  },
  saveRef: { current: null },
});

describe('useEmailRow', () => {
  const resend = jest.fn();

  beforeEach(() => {
    mockConnectivity.mockReset().mockReturnValue(true);
    mockEmailResend.mockReset().mockReturnValue({ isSubmitting: false, resend });
  });

  it('hands the entity, the adoption and the toast queue to the resend hook', () => {
    const input = props(false);

    renderHook(() => useEmailRow(input, false));

    expect(mockEmailResend).toHaveBeenCalledWith(input.user, input.adoption, input.toasts);
  });

  it('reports the confirmation and the resend action of an idle online row', () => {
    const { result } = renderHook(() => useEmailRow(props(true), false));

    expect(result.current).toStrictEqual({ confirmed: true, busy: false, resend });
  });

  it.each([
    ['a profile save is running', true, false, true],
    ['a resend is running', false, true, true],
    ['the browser is offline', false, false, false],
  ])('is busy while %s', (_name, saving, resending, online) => {
    mockEmailResend.mockReturnValue({ isSubmitting: resending, resend });
    mockConnectivity.mockReturnValue(online);

    const { result } = renderHook(() => useEmailRow(props(false), saving));

    expect(result.current).toStrictEqual({ confirmed: false, busy: true, resend });
  });
});
