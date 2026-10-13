import type { JSX } from 'react';

import ErrorPage from '@/components/error-page';

export default function NotFound(): JSX.Element {
  return <ErrorPage variant="notFound" landmark="main" />;
}
