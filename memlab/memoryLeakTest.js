require('dotenv').config();

function url() {
  return `${process.env.REACT_APP_WEBSITE_URL}/authentication`;
}

async function action(page) {
  await page.click('button');
}

async function back(page) {
  await page.click('button');
}

module.exports = { action, back, url };
