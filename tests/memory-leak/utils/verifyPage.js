/**
 * Verifies the page is on a specific route by checking the current URL.
 * Note: This function does not wait for navigation; ensure navigation is complete before calling.
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
