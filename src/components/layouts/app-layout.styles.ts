export default {
  main: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    // The landmark is focusable only so the post-login redirect can land on it. Suppress the ring
    // for that programmatic case, never for a keyboard user who tabs into it.
    '&:focus:not(:focus-visible)': { outline: 'none' },
  },
  footerSlot: { minHeight: '4.125rem' },
} as const;
