import type { ConsoleAllowlistEntry } from './types/console-allowlist-entry';

const CONSOLE_ALLOWLIST: ConsoleAllowlistEntry[] = [
  {
    pattern: /^Warning: `ReactDOMTestUtils\.act` is deprecated in favor of `React\.act`\./,
    reason: [
      '@testing-library/react 13.4 renders through the deprecated react-dom/test-utils act(),',
      'so React 18.3 emits this once per spec that renders a component.',
      'Nothing here can stop it; @testing-library/react 16 renders through React.act instead.',
    ].join(' '),
    expiresWith: { packageName: '@testing-library/react', removedInMajor: 16 },
  },
];

export default CONSOLE_ALLOWLIST;
