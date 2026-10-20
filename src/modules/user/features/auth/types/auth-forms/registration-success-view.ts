export interface Props {
  isClosing: boolean;
  onBack: () => void;
  title: string;
  description: string;
  buttonLabel: string;
}

export interface SuccessDescriptionProps {
  description: string;
}

export interface SuccessTitleProps {
  title: string;
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
