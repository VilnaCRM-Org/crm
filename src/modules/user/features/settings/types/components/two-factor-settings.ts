import type { ChangeEvent, ReactNode, RefObject } from 'react';
import type { FieldValues } from 'react-hook-form';

import type { UIFormProps } from '@/components/types/ui-form';
import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';
import type { RecoveryCodeSet } from '@/modules/user/types/user/two-factor-settings-entity';

import type {
  TwoFactorSettingsView,
  TwoFactorSettingsViewState,
} from '../two-factor/settings-view';

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

export type SetupFormProps = ConfirmationFormProps<TwoFactorDto>;

export interface SetupGuideProps {
  readonly otpauthUri: string | null;
}

export interface KeyBlockProps {
  readonly secret: string | null;
}

export type CodesFormProps = ConfirmationFormProps<FieldValues>;

export interface CodesBlockProps {
  readonly codes: RecoveryCodeSet;
}

export interface StatusHeadingProps {
  readonly text: string | null;
  readonly icon: boolean;
  readonly focus: boolean;
}

export interface SavedCheckboxProps {
  readonly checked: boolean;
  readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export type ConfirmationFormProps<T extends FieldValues> = Omit<
  UIFormProps<T>,
  'children' | 'isSubmitting' | 'titleComponent' | 'footer'
>;

export type DisableFormProps = ConfirmationFormProps<TwoFactorDto>;

export type RegenerateFormProps = ConfirmationFormProps<FieldValues>;

export interface ConfirmationFormViewProps<T extends FieldValues> {
  readonly form: ConfirmationFormProps<T>;
  readonly isSubmitting: boolean;
  readonly footer?: ReactNode;
  readonly children: ReactNode;
}

export interface OnActionsProps {
  readonly onDisable: () => void;
  readonly onRegenerate: () => void;
  readonly returnTo: TwoFactorSettingsView | null;
}

export interface CancelButtonProps {
  readonly onCancel: () => void;
}

export interface DisableCodeFieldProps {
  readonly view: TwoFactorSettingsViewState;
}
