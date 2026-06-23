export interface JsonWithMessage {
  message?: string;
}

export type BodyMeta = { bodyPreview: string; bodyLength: number };

export type ErrorMeta = { message?: string; bodyMeta?: BodyMeta };
