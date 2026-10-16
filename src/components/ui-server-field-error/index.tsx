import type { ServerFieldErrorProps } from '@/components/types/ui-server-field-error';

import useServerFieldError from './use-server-field-error';

export default function UIServerFieldError(props: ServerFieldErrorProps): null {
  useServerFieldError(props);

  return null;
}
