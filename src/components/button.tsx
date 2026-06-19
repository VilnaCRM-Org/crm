import { ReactElement } from 'react';

import type { ButtonProps } from './button.types';

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
