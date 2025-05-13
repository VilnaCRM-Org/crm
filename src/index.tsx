import * as React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';


document.body.innerHTML = '<div id="root"></div>';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
} else {
  // eslint-disable-next-line no-console
  console.error('Root element not found');
}
