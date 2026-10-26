import { renderHook } from '@testing-library/react';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import useDisplayName from '@/modules/user/features/settings/hooks/use-display-name';
import UserDisplayNameMapper from '@/modules/user/store/user-display-name-mapper';

const mockUseService = jest.fn();

jest.mock('@/providers/di', () => ({
  __esModule: true,
  useService: (token: symbol): unknown => mockUseService(token),
}));

describe('useDisplayName', () => {
  beforeEach(() => {
    mockUseService.mockReturnValue(new UserDisplayNameMapper());
  });

  it('resolves the mapper by its token', () => {
    renderHook(() => useDisplayName('Олена Петренко'));

    expect(mockUseService).toHaveBeenCalledWith(AUTH_TOKENS.UserDisplayNameMapper);
  });

  it('returns the display name and monogram of the full name', () => {
    const { result } = renderHook(() => useDisplayName('Петренко Олена Іванівна'));

    expect(result.current).toEqual({ displayName: 'Олена Петренко', monogram: 'ОП' });
  });

  it('keeps the same result while the name is unchanged and recomputes when it changes', () => {
    const { result, rerender } = renderHook(({ name }) => useDisplayName(name), {
      initialProps: { name: 'Анна Коваль' },
    });
    const first = result.current;

    rerender({ name: 'Анна Коваль' });
    expect(result.current).toBe(first);

    rerender({ name: 'Ігор Шевченко' });
    expect(result.current).toEqual({ displayName: 'Ігор Шевченко', monogram: 'ІШ' });
  });
});
