import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import ChallengeNote from '@auth/components/two-factor/challenge-note';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

describe('ChallengeNote', () => {
  it('renders the text as a muted paragraph', () => {
    render(<ChallengeNote text="Код можна ввести протягом 5 хвилин після входу." />);

    const note = screen.getByText('Код можна ввести протягом 5 хвилин після входу.');
    expect(note.tagName).toBe('P');
    expect(note).toHaveStyle({ color: '#57595B' });
  });

  it('has no accessibility violation', async () => {
    const { container } = render(
      <main>
        <ChallengeNote text="Код можна ввести протягом 5 хвилин після входу." />
      </main>
    );

    await expectNoA11yViolations(container);
  });
});
