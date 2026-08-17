import { fireEvent, screen } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ButtonExample from '@/button-example';
import localization from '@/i18n/localization.json';

import renderWithProviders from './utils/render-with-providers';

const createUkrainianI18n = (): ReturnType<typeof i18n.createInstance> => {
  const instance = i18n.createInstance();
  instance.use(initReactI18next).init({
    lng: 'uk',
    fallbackLng: 'uk',
    resources: { uk: { translation: localization.uk.translation } },
    interpolation: { escapeValue: false },
    initImmediate: false,
  });

  return instance;
};

describe('ButtonExample', () => {
  it('labels the button from the English catalog', () => {
    renderWithProviders(<ButtonExample />);

    expect(screen.getByRole('button', { name: 'Example button' })).toBeInTheDocument();
  });

  it('labels the button from the Ukrainian catalog', () => {
    renderWithProviders(<ButtonExample />, { i18nMock: createUkrainianI18n() });

    expect(screen.getByRole('button', { name: 'Приклад кнопки' })).toBeInTheDocument();
  });

  it('never renders a raw translation key', () => {
    renderWithProviders(<ButtonExample />, { i18nMock: createUkrainianI18n() });

    expect(screen.queryByRole('button', { name: 'button_example.label' })).not.toBeInTheDocument();
  });

  it('stays inert when clicked', () => {
    renderWithProviders(<ButtonExample />, { i18nMock: createUkrainianI18n() });

    const button = screen.getByRole('button', { name: 'Приклад кнопки' });
    fireEvent.click(button);

    expect(button).toBeInTheDocument();
  });
});
