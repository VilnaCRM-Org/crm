export type AuthSkeletonProps = {
  disableAnimation?: boolean;
};

export type Wrap = <T extends object>(
  baseSx: T
) => (T | { readonly animation: 'none'; readonly backgroundSize: '100% 100%' })[];
