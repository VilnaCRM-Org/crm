import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import Status from '@/modules/user/features/settings/components/two-factor-settings/status-heading';

const TEXT = 'Двофакторну автентифікацію ввімкнено';

describe('StatusHeading', () => {
  it('renders nothing without text', () => {
    render(<Status text={null} focus={false} />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('is a level-3 heading that is focusable by script only', () => {
    render(<Status text={TEXT} focus={false} />);

    const heading = screen.getByRole('heading', { level: 3, name: TEXT });
    expect(heading).toHaveAttribute('tabindex', '-1');
    expect(heading).not.toHaveFocus();
  });

  it('takes focus on mount when asked', () => {
    render(<Status text={TEXT} focus />);

    expect(screen.getByRole('heading', { level: 3, name: TEXT })).toHaveFocus();
  });
});
