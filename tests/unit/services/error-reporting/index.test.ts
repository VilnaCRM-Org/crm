import * as barrel from '@/services/error-reporting';
import boundaryErrorReporter, {
  BoundaryErrorReporter,
} from '@/services/error-reporting/boundary-error-reporter';

describe('error-reporting barrel', () => {
  it('re-exports the BoundaryErrorReporter class', () => {
    expect(barrel.BoundaryErrorReporter).toBe(BoundaryErrorReporter);
  });

  it('re-exports the boundary reporter singleton the shell passes by prop', () => {
    expect(barrel.boundaryErrorReporter).toBe(boundaryErrorReporter);
    expect(barrel.boundaryErrorReporter).toBeInstanceOf(BoundaryErrorReporter);
  });

  it('exposes only the boundary reporter at runtime — the noop reporter is gone', () => {
    expect(Object.keys(barrel).sort()).toEqual(['BoundaryErrorReporter', 'boundaryErrorReporter']);
  });
});
