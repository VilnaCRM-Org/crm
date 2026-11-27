import { render } from '@testing-library/react';
import { createRef } from 'react';

import UIOutlinedSmallButton from '@/components/ui-outlined-small-button';

const mockToolkitButton = jest.fn((_props: unknown) => null);

jest.mock('@vilnacrm/ui-toolkit/ui-button', () => ({
  __esModule: true,
  default: (props: unknown): null => mockToolkitButton(props),
}));

describe('UIOutlinedSmallButton seam', () => {
  it('pins the outlined small ripple-free look and forwards exactly the caller props', () => {
    const ref = createRef<HTMLButtonElement>();
    const onClick = jest.fn();
    const sx = { minWidth: '2.75rem' };

    render(
      <UIOutlinedSmallButton
        ref={ref}
        aria-label="Unlink Google"
        aria-disabled
        onClick={onClick}
        sx={sx}
      >
        Unlink
      </UIOutlinedSmallButton>
    );

    expect(mockToolkitButton).toHaveBeenLastCalledWith({
      ref,
      variant: 'outlined',
      size: 'small',
      disableRipple: true,
      'aria-label': 'Unlink Google',
      'aria-disabled': true,
      onClick,
      sx,
      children: 'Unlink',
    });
  });

  it('keeps the pinned look when the caller passes only children', () => {
    render(<UIOutlinedSmallButton>Unlink</UIOutlinedSmallButton>);

    expect(mockToolkitButton).toHaveBeenLastCalledWith({
      variant: 'outlined',
      size: 'small',
      disableRipple: true,
      children: 'Unlink',
    });
  });
});
