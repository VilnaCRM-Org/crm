import { ReactElement } from 'react';

export interface ButtonProps {
  label: string;
  variant: 'primary' | 'secondary';
  onClick: () => void;
}

export function Button({
  label = 'Button',
  variant = 'primary',
  onClick,
}: ButtonProps): ReactElement {
  return (
    <button type="button" className={`btn btn-${variant}`} onClick={onClick}>
      {label}
    </button>
  );
}
