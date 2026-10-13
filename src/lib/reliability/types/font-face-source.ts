export type FontFaceSource = Pick<FontFaceSet, 'load'>;

export interface FontFaceQuery {
  readonly descriptor: string;
}

export interface FontFaceQueries {
  readonly items: readonly FontFaceQuery[];
}
