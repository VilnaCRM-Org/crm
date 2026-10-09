export interface FontFaceSource {
  load(font: string): Promise<unknown>;
}
