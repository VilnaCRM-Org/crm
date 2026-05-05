// @jest-environment jsdom
/* eslint-disable testing-library/prefer-screen-queries */

import '../../../../utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

import Authentication from '@/modules/User/features/Auth';

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

jest.mock('@/assets/icons/arrows/back-arrow.svg', () => ({
  __esModule: true,
  default: 'back-arrow-mock.svg',
}));

jest.mock('@/assets/icons/logo/vilna-logo.svg', () => ({
  __esModule: true,
  ReactComponent: 'svg',
}));

jest.mock('@/modules/User/features/Auth/components/form-section', () => {
  const pendingFormSectionPromise = new Promise<void>(() => {});

  return {
    __esModule: true,
    default: (): null => {
      throw pendingFormSectionPromise;
    },
  };
});

describe('Authentication shell', () => {
  it('renders the shell chrome and loading fallback on initial mount', () => {
    const view = render(<Authentication />);

    expect(view.getByLabelText('Back')).toBeInTheDocument();
    expect(view.getByRole('main')).toBeInTheDocument();
    expect(view.getByLabelText('auth.loadingForm')).toBeInTheDocument();
    expect(view.getByLabelText('footer.privacy')).toBeInTheDocument();
    expect(view.getByLabelText('footer.usage_policy')).toBeInTheDocument();

    view.unmount();
  });
});
