import type { SystemStyleObject, Theme } from '@mui/system';

import type { OfflineNoticeMode } from '@/components/types/ui-form';

import type { ProfileFormModel } from '../hooks/use-profile-form-model';
import type { ProfileFormRules } from '../hooks/use-profile-form-rules';
import type { ProfileEditContext, ProfileSave } from '../hooks/use-profile-save';
import type { ProfileField, ProfileFieldErrorSet } from '../user-profile/outcome';
import type { ProfileFormValues } from '../user-profile/profile-form-values';
import type { ProfileSection, RevealedProfileSection } from '../user-profile/profile-section';

export interface ProfileFormProps extends ProfileEditContext {
  readonly refocus: boolean;
}

export interface ProfileSectionFormProps {
  readonly context: ProfileEditContext;
  readonly section: ProfileSection;
}

export interface SaveHintProps {
  readonly id: string;
}

export type ReportSectionChange = (changed: boolean) => void;

export interface ProfileSectionFieldsProps {
  readonly context: ProfileEditContext;
  readonly section: ProfileSection;
  readonly rules: ProfileFormRules;
  readonly save: ProfileSave;
  readonly onChange: ReportSectionChange;
}

export interface RevealedSectionFieldsProps extends Omit<ProfileSectionFieldsProps, 'section'> {
  readonly section: RevealedProfileSection;
}

export interface SectionClearProps {
  readonly model: ProfileFormModel;
  readonly revealed: boolean;
}

export interface SectionForm {
  readonly model: ProfileFormModel;
  readonly revealed: boolean;
  readonly onChange: ReportSectionChange;
  readonly submitLabel: string;
  readonly submittingLabel: string;
  readonly submitSx: SystemStyleObject<Theme>;
  readonly offlineNotice: OfflineNoticeMode;
}

export interface FullNameFieldProps {
  readonly rules: ProfileFormRules;
  readonly busy: boolean;
}

export interface EmailFieldProps extends FullNameFieldProps {
  readonly context: ProfileEditContext;
}

export interface EmailStatusProps {
  readonly context: ProfileEditContext;
  readonly busy: boolean;
}

export interface SectionOfflineNotices {
  readonly clean: OfflineNoticeMode;
  readonly revealed: OfflineNoticeMode;
}

export interface SectionPasswordProps {
  readonly section: RevealedProfileSection;
  readonly rules: ProfileFormRules;
  readonly busy: boolean;
}

export interface SectionBodyProps {
  readonly context: ProfileEditContext;
  readonly section: ProfileSection;
  readonly model: ProfileFormModel;
  readonly onChange: ReportSectionChange;
}

export interface SectionErrorField {
  readonly error: ProfileField;
  readonly field: keyof ProfileFormValues;
}

export interface ClearButtonProps {
  readonly defaults: ProfileFormValues;
  readonly busy: boolean;
  readonly onClear: () => void;
}

export interface ServerFieldErrorsProps {
  readonly section: ProfileSection;
  readonly errors: ProfileFieldErrorSet;
  readonly occurrence: number;
}

export interface EmailStatusRowProps {
  readonly statusId: string;
  readonly busy: boolean;
  readonly onResend: () => void;
}
