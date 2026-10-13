import type { FontFaceQueries, FontFaceSource } from './types/font-face-source';
import type { ModuleLoader } from './types/module-loader';

export default class FontFaceLoader implements ModuleLoader<void> {
  constructor(
    private readonly fonts: FontFaceSource,
    private readonly faces: FontFaceQueries
  ) {}

  public async load(): Promise<void> {
    await Promise.all(this.faces.items.map((face) => this.fonts.load(face)));
  }
}
