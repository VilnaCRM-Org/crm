export default function waitForText(root: HTMLElement, text: string): Promise<void> {
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      settle();
    });
    function settle(): boolean {
      const found = root.textContent?.includes(text) === true;
      if (found) {
        observer.disconnect();
        resolve();
      }
      return found;
    }
    if (!settle()) observer.observe(root, { childList: true, subtree: true, characterData: true });
  });
}
