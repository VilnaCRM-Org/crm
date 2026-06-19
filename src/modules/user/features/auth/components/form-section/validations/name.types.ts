export type ValidationFunction = (value: string) => boolean;
export type ValidationKeys = 'isLettersOnly' | 'isFormatted' | 'isEmpty';

export type NameRule = { check: (value: string) => boolean; messageKey: string };
