import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import HeaderSearch from '@/components/ui-app-header/header-search';
import renderShell from '@tests/unit/utils/render-shell';

describe('HeaderSearch', () => {
  it.each(['desktop', 'tablet'] as const)(
    'renders a natively disabled search input named Search at %s',
    (layout) => {
      renderShell(<HeaderSearch layout={layout} />);

      const input = screen.getByRole('searchbox', { name: 'Search' });

      expect(input).toBeDisabled();
      expect(input).toHaveAccessibleDescription('Not available yet');
      expect(input).toHaveAttribute('placeholder', 'Looking for something?');
    }
  );

  it('speaks the label, placeholder and status in uk', () => {
    renderShell(<HeaderSearch layout="desktop" />, { locale: 'uk' });

    const input = screen.getByRole('searchbox', { name: 'Пошук' });

    expect(input).toHaveAccessibleDescription('Ще недоступно');
    expect(input).toHaveAttribute('placeholder', 'Щось шукаєте?');
  });

  it('stays empty when clicked or typed into and opens no dropdown', async () => {
    const user = userEvent.setup();
    renderShell(<HeaderSearch layout="desktop" />);
    const input = screen.getByRole('searchbox', { name: 'Search' });

    await user.click(input);
    await user.type(input, 'boards');

    expect(input).toHaveValue('');
    expect(input).not.toHaveFocus();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('is skipped by Tab', async () => {
    const user = userEvent.setup();
    renderShell(<HeaderSearch layout="tablet" />);

    await user.tab();

    expect(document.body).toHaveFocus();
  });

  it('hides the magnifier from assistive technology', () => {
    const { container } = renderShell(<HeaderSearch layout="desktop" />);

    expect(container).toContainHTML('aria-hidden="true"');
  });

  it('sends no request when it is used', async () => {
    const user = userEvent.setup();
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response());
    renderShell(<HeaderSearch layout="desktop" />);

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'x');

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
