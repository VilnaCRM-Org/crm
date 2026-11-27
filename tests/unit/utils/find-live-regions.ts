const LIVE_REGIONS = '[aria-live], [role="status"], [role="alert"], [role="log"], output';

export default function findLiveRegions(root: ParentNode): Element[] {
  return [...root.querySelectorAll(LIVE_REGIONS)];
}
