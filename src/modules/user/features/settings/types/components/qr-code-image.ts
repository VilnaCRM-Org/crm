export interface QrCodeImageProps {
  readonly value: string;
  readonly label: string;
}

export interface QrModuleMatrix {
  readonly getModuleCount: () => number;
  readonly isDark: (row: number, col: number) => boolean;
}
