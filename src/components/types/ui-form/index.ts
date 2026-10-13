import type { ReactNode, RefCallback, RefObject } from 'react';
import type {
  SubmitHandler,
  FieldValues,
  DefaultValues,
  UseFormProps,
  UseFormReturn,
} from 'react-hook-form';

export type UIFormOptions<T extends FieldValues> = Omit<UseFormProps<T>, 'defaultValues'>;

export interface FormErrorAction {
  readonly label: string;
  readonly onClick: () => void;
}

export type TitleHeadingComponent = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface UIFormProps<T extends FieldValues> {
  onSubmit: SubmitHandler<T>;
  defaultValues: DefaultValues<T>;
  children: ReactNode;
  formOptions?: UIFormOptions<T>;
  isSubmitting?: boolean;
  error?: string | null | undefined;
  errorAction?: FormErrorAction | undefined;
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
}

export interface ErrorBannerProps {
  error?: string | null;
  action?: FormErrorAction | undefined;
}

export interface FormHeaderSectionProps {
  header: FormHeaderProps;
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

export interface FormBodyProps<T extends FieldValues> {
  header: FormHeaderProps;
  submittingLabel: string;
  announceSubmitting: boolean;
  handleSubmit: SubmitHandler<T>;
  children: ReactNode;
  error: string | null;
  errorAction?: FormErrorAction | undefined;
  submitting: boolean;
  isSubmitDisabled: boolean;
  submitLabel: string;
}
