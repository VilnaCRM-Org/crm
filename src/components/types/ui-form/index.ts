import type { ReactNode } from 'react';
import type {
  SubmitHandler,
  FieldValues,
  DefaultValues,
  UseFormProps,
  UseFormReturn,
} from 'react-hook-form';

export type TitleHeadingComponent = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface UIFormProps<T extends FieldValues> {
  onSubmit: SubmitHandler<T>;
  defaultValues: DefaultValues<T>;
  children: ReactNode;
  formOptions?: Omit<UseFormProps<T>, 'defaultValues'>;
  isSubmitting?: boolean;
  error?: string | null;
  submitLabel: string;
  title: ReactNode;
  subtitle?: ReactNode;
  showTitle?: boolean;
  showSubtitle?: boolean;
  resetOnSuccess?: boolean;
  isSubmitDisabled?: boolean;
  submittingLabel: string;
  submittingAnnouncement?: boolean;
  titleComponent?: TitleHeadingComponent;
}

export type SubmitHandlerOptions<T extends FieldValues> = {
  onSubmit: SubmitHandler<T>;
  methods: UseFormReturn<T>;
  defaultValues: DefaultValues<T>;
  resetOnSuccess: boolean;
};

export type SubmitControlsProps = {
  submitting: boolean;
  isSubmitDisabled: boolean;
  submitLabel: string;
};

export interface UseUIFormOptions<T extends FieldValues> {
  defaultValues: DefaultValues<T>;
  formOptions: Omit<UseFormProps<T>, 'defaultValues'>;
  isSubmitting?: boolean;
}

export interface UseUIFormResult<T extends FieldValues> {
  methods: UseFormReturn<T>;
  submitting: boolean;
}

export type FormBodyProps<T extends FieldValues> = {
  submittingLabel: string;
  announceSubmitting: boolean;
  handleSubmit: SubmitHandler<T>;
  children: ReactNode;
  error?: string | null;
  title: ReactNode;
  subtitle?: ReactNode;
  showTitle: boolean;
  showSubtitle: boolean;
  submitting: boolean;
  isSubmitDisabled: boolean;
  submitLabel: string;
  titleComponent?: TitleHeadingComponent;
};
