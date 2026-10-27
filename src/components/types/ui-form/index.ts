import type { Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';
import type { FocusEvent, ReactNode, RefCallback, RefObject } from 'react';
import type {
  SubmitErrorHandler,
  SubmitHandler,
  FieldValues,
  DefaultValues,
  UseFormProps,
  UseFormReturn,
} from 'react-hook-form';

export type UIFormOptions<T extends FieldValues> = Omit<UseFormProps<T>, 'defaultValues'>;

export type TitleHeadingComponent = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export type SubmitSpacing = 'default' | 'tight';

export interface UIFormErrorAction {
  label: string;
  onClick: () => void;
}

export interface UIFormProps<T extends FieldValues> {
  onSubmit: SubmitHandler<T>;
  onInvalid?: SubmitErrorHandler<T> | undefined;
  defaultValues: DefaultValues<T>;
  children: ReactNode;
  formOptions?: UIFormOptions<T>;
  isSubmitting?: boolean;
  error?: string | null | undefined;
  errorAction?: UIFormErrorAction | undefined;
  submitLabel: string;
  title: ReactNode;
  subtitle?: ReactNode;
  showTitle?: boolean;
  showSubtitle?: boolean;
  resetOnSuccess?: boolean | undefined;
  isSubmitDisabled?: boolean;
  submittingLabel: string;
  submittingAnnouncement?: boolean;
  titleComponent?: TitleHeadingComponent;
  titleRef?: RefCallback<HTMLElement> | undefined;
  notice?: ReactNode;
  submitSpacing?: SubmitSpacing | undefined;
  submitRef?: FocusReturnTarget | undefined;
  submitSx?: SystemStyleObject<Theme> | undefined;
  footer?: ReactNode;
}

export interface SubmitHandlerOptions<T extends FieldValues> {
  onSubmit: SubmitHandler<T>;
  methods: UseFormReturn<T>;
  defaultValues: DefaultValues<T>;
  resetOnSuccess: boolean;
}

export interface SubmitControlsProps {
  submitting: boolean;
  isSubmitDisabled: boolean;
  submitLabel: string;
  describedBy: string;
  buttonRef: RefObject<HTMLButtonElement | HTMLAnchorElement | null>;
  spacing?: SubmitSpacing | undefined;
  submitSx?: SystemStyleObject<Theme> | undefined;
}

export type FocusReturnTarget = RefObject<HTMLButtonElement | HTMLAnchorElement | null>;

export interface FocusReturnHandlers {
  onFocus: () => void;
  onBlur: (event: FocusEvent<HTMLElement>) => void;
}

export interface ErrorBannerProps {
  error?: string | null;
  action?: UIFormErrorAction | undefined;
  returnFocusRef: FocusReturnTarget;
}

export interface FormHeaderSectionProps {
  header: FormHeaderProps;
  bannerShown: boolean;
}

export interface FormHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  showTitle: boolean;
  showSubtitle: boolean;
  titleComponent?: TitleHeadingComponent | undefined;
  titleRef?: RefCallback<HTMLElement> | undefined;
}

export interface OfflineSubmit {
  online: boolean;
  noticeId: string;
  noticeRef: RefObject<HTMLSpanElement | null>;
  submitRef: RefObject<HTMLButtonElement | HTMLAnchorElement | null>;
}

export interface UseUIFormOptions<T extends FieldValues> {
  defaultValues: DefaultValues<T>;
  formOptions: UIFormOptions<T>;
  isSubmitting?: boolean | undefined;
}

export interface UseUIFormResult<T extends FieldValues> {
  methods: UseFormReturn<T>;
  submitting: boolean;
}

export interface FormLeadProps {
  error: string | null;
  errorAction?: UIFormErrorAction | undefined;
  notice?: ReactNode;
}

export interface FormLeadSectionProps {
  header: FormHeaderProps;
  lead: FormLeadProps;
  offline: OfflineSubmit;
}

export interface FormSubmitProps {
  submitLabel: string;
  submittingLabel: string;
  isSubmitDisabled: boolean;
  submitSpacing?: SubmitSpacing | undefined;
  submitRef?: FocusReturnTarget | undefined;
  submitSx?: SystemStyleObject<Theme> | undefined;
}

export interface FormBodyProps<T extends FieldValues> {
  header: FormHeaderProps;
  lead: FormLeadProps;
  submit: FormSubmitProps;
  announceSubmitting: boolean;
  handleSubmit: SubmitHandler<T>;
  onInvalid?: SubmitErrorHandler<T> | undefined;
  children: ReactNode;
  submitting: boolean;
  footer?: ReactNode;
}
