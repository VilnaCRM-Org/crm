import { render } from '@testing-library/react';

import UITextLink from '@/components/ui-text-link';

const mockToolkitLink = jest.fn((_props: unknown) => null);

jest.mock('@vilnacrm/ui-toolkit/ui-link', () => ({
  __esModule: true,
  default: (props: unknown): null => mockToolkitLink(props),
}));

describe('UITextLink seam', () => {
  it('renders the ui-toolkit link as a brand text link with the given href and text', () => {
    render(<UITextLink href="/password-recovery">Forgot password?</UITextLink>);

    expect(mockToolkitLink).toHaveBeenCalledWith({
      href: '/password-recovery',
      appearance: 'text',
      tone: 'brand',
      sx: { '&:visited:not(:hover):not(:active)': { color: '#1EAEFF' } },
      children: 'Forgot password?',
    });
  });
});
