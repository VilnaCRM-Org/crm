import useServerFieldError from '@auth/hooks/use-server-field-error';
import type { ServerFieldErrorProps } from '@auth/types/components/server-field-error';

export default function ServerFieldError(props: ServerFieldErrorProps): null {
  useServerFieldError(props);

  return null;
}
