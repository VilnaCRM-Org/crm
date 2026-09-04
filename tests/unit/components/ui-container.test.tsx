import { render, screen } from '@testing-library/react';

import UIContainer from '@/components/ui-container';
import containerStyles from '@/components/ui-container/styles';

describe('UIContainer', () => {
  it('renders its children', () => {
    render(
      <UIContainer>
        <button type="button">Inside the container</button>
      </UIContainer>
    );

    expect(screen.getByRole('button', { name: 'Inside the container' })).toBeInTheDocument();
  });

  it('exposes no accessible name of its own, being a layout wrapper', () => {
    render(
      <UIContainer>
        <button type="button">Inside the container</button>
      </UIContainer>
    );

    expect(screen.queryByLabelText(/container/i)).not.toBeInTheDocument();
  });

  it('centres its content and applies the shared page gutters', () => {
    expect(containerStyles.container).toMatchObject({
      width: '100%',
      margin: '0 auto',
      paddingLeft: '0.9375rem',
      paddingRight: '0.9375rem',
    });
  });
});
