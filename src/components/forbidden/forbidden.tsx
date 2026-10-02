import type { JSX } from 'react';

import ErrorPage from '@/components/error-page';

export default function Forbidden(): JSX.Element {
  return <ErrorPage variant="forbidden" landmark="main" />;
}
