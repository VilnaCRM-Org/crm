import { render, screen, fireEvent } from '@testing-library/react';

import { Button } from '../../../src/components/Button';

function noop(): void {}

describe('Button component', () => {
  it('renders with label', () => {
    render(<Button label="Click me" variant="primary" onClick={noop} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button label="Click" variant="secondary" onClick={handleClick} />);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('falls back to default label and variant when omitted', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} />);

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Button');
    expect(button).toHaveClass('btn-primary');
  });
});
