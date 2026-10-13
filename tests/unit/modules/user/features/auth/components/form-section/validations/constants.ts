import type { SignUpDto } from '@/modules/user';

const emptyUser: SignUpDto = {} as SignUpDto;

/** The absent values a required field must reject, labelled for `it.each`. */
export const EMPTY_FIELD_VALUES: ReadonlyArray<readonly [string, string]> = [
  ['an empty string', ''],
  ['undefined', undefined as unknown as string],
  ['null', null as unknown as string],
];

export default emptyUser;
