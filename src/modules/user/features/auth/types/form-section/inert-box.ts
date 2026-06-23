import { type ReactNode } from 'react';

export interface InertBoxProps {
  id: string;
  inert: boolean;
  children: ReactNode;
}
