import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';

import CreateNewPassword from '@auth/routes/create-new-password';
import ResetPassword from '@auth/routes/reset-password';

jest.mock(
  '@auth/components/recovery-page-layout',
  () => jest.requireActual('@tests/unit/utils/recovery-route-harness').recoveryPageLayoutModule
);

jest.mock('@auth/routes/reset-password/form-section-loader', () =>
  jest
    .requireActual('@tests/unit/utils/recovery-route-harness')
    .stubSectionLoader('request section')
);

jest.mock('@auth/routes/create-new-password/form-section-loader', () =>
  jest
    .requireActual('@tests/unit/utils/recovery-route-harness')
    .stubSectionLoader('confirm section')
);

describe('password-recovery route pages', () => {
  it.each<[string, ComponentType, string, string]>([
    ['ResetPassword', ResetPassword, 'request section', 'password_recovery.title'],
    ['CreateNewPassword', CreateNewPassword, 'confirm section', 'password_reset.title'],
  ])(
    '%s renders its lazy section inside the recovery layout under its own title',
    async (_, Page, sectionText, titleKey) => {
      render(<Page />);

      const section = await screen.findByText(sectionText);

      expect(screen.getByRole('main', { name: titleKey })).toContainElement(section);
    }
  );
});
