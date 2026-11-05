import { renderHook } from '@testing-library/react';

import useUserAdoption from '@/modules/user/features/settings/hooks/use-user-adoption';
import { buildEmail, buildUserEntity } from '@tests/builders';

describe('useUserAdoption', () => {
  it('treats every e-mail as current until a user is adopted', () => {
    const { result } = renderHook(() => useUserAdoption(jest.fn()));

    expect(result.current.isCurrent(buildEmail())).toBe(true);
    expect(result.current.revision()).toBe(0);
  });

  it('records the adopted e-mail and revision before it dispatches', () => {
    const dispatch = jest.fn();
    const user = buildUserEntity();
    const { result } = renderHook(() => useUserAdoption(dispatch));

    result.current.adopt(user);

    expect(result.current.isCurrent(user.email)).toBe(true);
    expect(result.current.isCurrent(buildEmail())).toBe(false);
    expect(result.current.revision()).toBe(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'adopt', user });
  });

  it('dispatches a confirmation without moving the revision', () => {
    const dispatch = jest.fn();
    const email = buildEmail();
    const { result } = renderHook(() => useUserAdoption(dispatch));

    result.current.confirm(email, true);

    expect(dispatch).toHaveBeenCalledWith({ type: 'confirm', email, confirmed: true });
    expect(result.current.revision()).toBe(0);
  });
});
