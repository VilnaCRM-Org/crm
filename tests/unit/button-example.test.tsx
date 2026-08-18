import { render, screen } from '@testing-library/react';

import ButtonExample from '@/button-example';

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({ t: (key: string): string => key }),
}));

describe('ButtonExample', () => {
  it('labels the button with the hello translation key', () => {
    render(<ButtonExample />);

    expect(screen.getByRole('button', { name: 'hello' })).toBeInTheDocument();
  });

  it('renders a non-submitting button that carries a visible label', () => {
    render(<ButtonExample />);

    const button = screen.getByRole('button', { name: 'hello' });

    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveTextContent('hello');
  });
});
