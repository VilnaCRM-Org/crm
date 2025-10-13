/**
 * Waits for page navigation to a specific route and verifies the URL.
 *
 * @param {Object} page - Puppeteer page instance
 * @param {string} route - The expected route (path) that the page should include, e.g., '/authentication'
 * @throws {Error} If page is not on the expected route
 */
async function verifyPage(page, route) {
  const currentUrl = page.url();

  if (!currentUrl.includes(`${route}`)) {
    throw new Error(`Page was not redirected to ${route} as expected. Current URL: ${currentUrl}`);
  }
}

module.exports = verifyPage;
