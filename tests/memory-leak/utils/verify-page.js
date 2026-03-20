async function verifyPage(page, route) {
  const currentUrl = new URL(page.url());
  const { pathname } = currentUrl;

  if (!pathname.startsWith(route) && pathname !== route) {
    throw new Error(`Page was not redirected to ${route}. Current URL: ${currentUrl}`);
  }
}

module.exports = verifyPage;
