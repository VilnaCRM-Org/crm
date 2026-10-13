export interface Props {
  isClosing: boolean;
  onBack: () => void;
}

export interface SuccessTitleProps {
  title: string;
}

export interface SuccessLabelProps {
  label: string;
}

export interface SuccessActionButtonProps {
  buttonLabel: string;
  disabled: boolean;
  onBack: () => void;
}

export interface MessageContainerProps extends SuccessActionButtonProps {
  title: string;
  description: string;
}
