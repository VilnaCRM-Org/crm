import type { JSX } from 'react';

import ErrorPage from '@/components/error-page';

export default function ServerError(): JSX.Element {
  return <ErrorPage variant="serverError" landmark="main" />;
}
