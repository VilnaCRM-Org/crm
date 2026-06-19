export interface JsonWithMessage {
  message?: string;
}

export interface ExtractedBody {
  message: string | null;
  body: string | undefined;
}
