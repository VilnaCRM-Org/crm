async function verifyPage(page, route) {
  const currentUrl = new URL(page.url());
  const { pathname } = currentUrl;
  const matchesRoute = pathname === route || pathname.startsWith(`${route}/`);

  if (!matchesRoute) {
    throw new Error(`Page was not redirected to ${route} as expected. Current URL: ${currentUrl}`);
  }
}

module.exports = verifyPage;
