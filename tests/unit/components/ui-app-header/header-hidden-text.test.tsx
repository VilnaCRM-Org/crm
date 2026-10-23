import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import HeaderHiddenText from '@/components/ui-app-header/header-hidden-text';

describe('HeaderHiddenText', () => {
  it('renders its text under the given id with the clip pattern and no live region role', () => {
    render(<HeaderHiddenText id="status-1">Not available yet</HeaderHiddenText>);

    const text = screen.getByText('Not available yet');

    expect(text).toHaveAttribute('id', 'status-1');
    expect(text.tagName).toBe('SPAN');
    expect(text).not.toHaveAttribute('role');
    expect(text).toHaveStyle({ position: 'absolute', width: '1px', height: '1px' });
  });
});
