import type { ChangeEvent, RefObject } from 'react';
import type { FieldValues } from 'react-hook-form';

import type { UIFormProps } from '@/components/types/ui-form';
import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';
import type { RecoveryCodeSet } from '@/modules/user/types/user/two-factor-settings-entity';

import type { TwoFactorSettingsViewState } from '../two-factor/settings-view';

export interface StepItemProps {
  readonly position: number;
  readonly text: string;
}

export interface KeyChipProps {
  readonly secret: string;
  readonly chipRef: RefObject<HTMLElement | null>;
}

export interface CopyButtonProps {
  readonly text: string;
  readonly targetRef: RefObject<HTMLElement | null>;
  readonly label: string;
  readonly copiedText: string;
  readonly failedText: string;
}

export interface ConfirmCodeFieldProps {
  readonly view: TwoFactorSettingsViewState;
  readonly disabled: boolean;
}

export type SetupFormProps = Omit<
  UIFormProps<TwoFactorDto>,
  'children' | 'isSubmitting' | 'titleComponent'
>;

export interface SetupGuideProps {
  readonly otpauthUri: string | null;
}

export interface KeyBlockProps {
  readonly secret: string | null;
}

export type CodesFormProps = Omit<
  UIFormProps<FieldValues>,
  'children' | 'isSubmitting' | 'titleComponent'
>;

export interface CodesBlockProps {
  readonly codes: RecoveryCodeSet;
}

export interface StatusHeadingProps {
  readonly text: string | null;
  readonly icon: boolean;
}

export interface SavedCheckboxProps {
  readonly checked: boolean;
  readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}
