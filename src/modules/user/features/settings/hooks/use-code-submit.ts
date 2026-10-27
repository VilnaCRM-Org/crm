import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';

import type { CodeEntry, CodeSubmit, SettledSubmitOptions } from '../types/hooks/two-factor-submit';

import useSettledSubmit from './use-settled-submit';

export default function useCodeSubmit(
  entry: CodeEntry,
  options: SettledSubmitOptions<TwoFactorDto>
): CodeSubmit {
  const { normalizer, accept, refusal, refuse } = entry;
  const submit = useSettledSubmit(options);

  const send = async (dto: TwoFactorDto): Promise<void> => {
    const twoFactorCode = normalizer.normalize(dto.twoFactorCode, accept);
    if (twoFactorCode === null) return refuse(refusal);
    return submit.send({ twoFactorCode });
  };

  return { isSubmitting: submit.isSubmitting, send, resend: submit.resend };
}
