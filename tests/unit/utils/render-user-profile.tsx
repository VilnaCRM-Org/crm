import { render, type RenderResult } from '@testing-library/react';
import type { i18n as I18n } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import UserProfile from '@/modules/user/features/settings/routes/user-profile';

import SessionOutlet from './session-outlet';

const renderUserProfile = (i18n: I18n): RenderResult =>
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <SessionOutlet>
          <UserProfile />
        </SessionOutlet>
      </MemoryRouter>
    </I18nextProvider>
  );

export default renderUserProfile;
