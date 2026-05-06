import { Link } from '@mui/material';
import type { LinkProps } from '@mui/material/Link';

import renderWithTheme from '@/components/render-with-theme';
import Theme from '@/components/ui-link/theme';

export default function UILink(props: LinkProps): JSX.Element {
  return renderWithTheme(Theme, Link, props);
}
