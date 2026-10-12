import { render } from '@testing-library/react';

import UICheckbox from '@/components/ui-checkbox';

const mockToolkitCheckbox = jest.fn((_props: unknown) => null);

jest.mock('@vilnacrm/ui-toolkit/ui-checkbox', () => ({
  __esModule: true,
  default: (props: unknown): null => mockToolkitCheckbox(props),
}));

describe('UICheckbox seam', () => {
  it('forwards label, checked, onChange and sx to the ui-toolkit checkbox', () => {
    const onChange = jest.fn();
    const sx = { marginTop: '7px' };

    render(<UICheckbox label="Remember me" checked onChange={onChange} sx={sx} />);

    expect(mockToolkitCheckbox).toHaveBeenCalledWith({
      label: 'Remember me',
      checked: true,
      onChange,
      sx,
    });
  });
});
