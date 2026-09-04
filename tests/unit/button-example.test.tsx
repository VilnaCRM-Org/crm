import { fireEvent, screen } from '@testing-library/react';

import ButtonExample from '@/button-example';

import createLocaleI18n from './utils/create-locale-i18n';
import renderWithProviders from './utils/render-with-providers';

describe('ButtonExample', () => {
  it('labels the button from the English catalog', () => {
    renderWithProviders(<ButtonExample />);

    expect(screen.getByRole('button', { name: 'Example button' })).toBeInTheDocument();
  });

  it('labels the button from the Ukrainian catalog', () => {
    renderWithProviders(<ButtonExample />, { i18nMock: createLocaleI18n('uk') });

    expect(screen.getByRole('button', { name: 'Приклад кнопки' })).toBeInTheDocument();
  });

  it('never renders a raw translation key', () => {
    renderWithProviders(<ButtonExample />, { i18nMock: createLocaleI18n('uk') });

    expect(screen.queryByRole('button', { name: 'button_example.label' })).not.toBeInTheDocument();
  });

  it('renders a non-submitting button that carries a visible label', () => {
    renderWithProviders(<ButtonExample />);

    const button = screen.getByRole('button', { name: 'Example button' });

    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveTextContent('Example button');
  });

  it('stays inert when clicked', () => {
    renderWithProviders(<ButtonExample />, { i18nMock: createLocaleI18n('uk') });

    const button = screen.getByRole('button', { name: 'Приклад кнопки' });

    expect(() => fireEvent.click(button)).not.toThrow();
    expect(button).toBeInTheDocument();
  });
});
