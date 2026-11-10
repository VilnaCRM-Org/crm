import type { UserMenuState } from '@/modules/user/features/settings/types/hooks/use-user-menu';

const buildUserMenuState = (overrides: Partial<UserMenuState> = {}): UserMenuState => ({
  open: false,
  chip: { current: null },
  show: jest.fn(),
  close: jest.fn(),
  dismiss: jest.fn(),
  chipKeyDown: jest.fn(),
  menuKeyDown: jest.fn(),
  ...overrides,
});

export default buildUserMenuState;
