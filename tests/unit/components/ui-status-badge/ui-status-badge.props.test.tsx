import { render } from '@testing-library/react';

import UIStatusBadge from '@/components/ui-status-badge';

const mockToolkitBadge = jest.fn((_props: unknown) => null);

jest.mock('@vilnacrm/ui-toolkit/ui-status-badge', () => ({
  __esModule: true,
  default: (props: unknown): null => mockToolkitBadge(props),
}));

describe('UIStatusBadge seam', () => {
  it('forwards label, active and sx to the ui-toolkit status badge and wires no toggle', () => {
    const sx = { marginLeft: '7px' };

    render(<UIStatusBadge label="Linked" active sx={sx} />);

    expect(mockToolkitBadge).toHaveBeenLastCalledWith({ label: 'Linked', active: true, sx });
    expect(mockToolkitBadge.mock.lastCall?.[0]).not.toHaveProperty('onToggle');
  });

  it('forwards an inactive state as active false', () => {
    render(<UIStatusBadge label="Not linked" active={false} />);

    expect(mockToolkitBadge).toHaveBeenLastCalledWith({ label: 'Not linked', active: false });
  });
});
