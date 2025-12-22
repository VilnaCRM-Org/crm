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

  it('renders with default props', () => {
    const handleClick = jest.fn();
    render(<Button label="Button" variant="primary" onClick={handleClick} />);

    expect(screen.getByText('Button')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveClass('btn-primary');
  });

  it('falls back to default label and variant when omitted', () => {
    const handleClick = jest.fn();
    // @ts-expect-error Deliberately omit props to exercise runtime defaults
    render(<Button onClick={handleClick} />);

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Button');
    expect(button).toHaveClass('btn-primary');
  });
});
