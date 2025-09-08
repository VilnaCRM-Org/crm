import { render, screen, fireEvent } from '@testing-library/react';

import { Button } from '../../../src/components/Button';

describe('Button component', () => {
  it('renders with label', () => {
    render(<Button label="Click me" variant="primary" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button label="Click" variant="secondary" onClick={handleClick} />);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
