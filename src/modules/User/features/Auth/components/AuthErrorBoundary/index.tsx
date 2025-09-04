import React, { Component, ReactNode } from 'react';

interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}
interface AuthErrorBoundaryProps {
  children: React.ReactNode;
}

export default class AuthErrorBoundary extends Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, info: React.ErrorInfo): string {
    return `Caught by AuthErrorBoundary: ${error}, ${info}`;
  }

  public render(): ReactNode {
    const { children } = this.props;
    const { hasError } = this.state;

    if (hasError) {
      return <div>Something went wrong. Please try again later.</div>;
    }

    return children;
  }
}
