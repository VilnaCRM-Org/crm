export interface ShellBadgeCounts {
  readonly notifications?: number | null | undefined;
  readonly tasks?: number | null | undefined;
}

export type HeaderBadgeTone = 'muted' | 'alert';

export interface HeaderBadgeProps {
  readonly count?: number | null | undefined;
  readonly tone?: HeaderBadgeTone | undefined;
}
