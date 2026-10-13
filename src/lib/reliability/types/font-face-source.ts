export type FontFaceSource = Pick<FontFaceSet, 'load'>;

export type FontFaceQuery = string;

export interface FontFaceQueries {
  readonly items: readonly FontFaceQuery[];
}
