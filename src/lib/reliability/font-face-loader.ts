import type { FontFaceSource } from './types/font-face-source';
import type { ModuleLoader } from './types/module-loader';

export default class FontFaceLoader implements ModuleLoader<unknown[]> {
  constructor(
    private readonly fonts: FontFaceSource,
    private readonly faces: readonly string[]
  ) {}

  public async load(): Promise<unknown[]> {
    return Promise.all(this.faces.map((face) => this.fonts.load(face)));
  }
}
