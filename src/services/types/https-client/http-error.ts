export interface HttpErrorJson {
  name: string;
  message: string;
  status: number;
  cause?: unknown;
}

export interface HttpErrorParams {
  status: number;
  message: string;
  cause?: unknown;
}
