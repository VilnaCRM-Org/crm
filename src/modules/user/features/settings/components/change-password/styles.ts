export const NEW_PASSWORD_HINT_ID = 'new-password-hint';

export const NEW_PASSWORD_RULES_ID = 'new-password-rules';

export const RULES_COLLAPSE_DELAY_MS = 200;

const VISUALLY_HIDDEN = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export default {
  hint: VISUALLY_HIDDEN,
  newPassword: {
    position: 'relative',
    [`&[data-empty="true"]:not(:focus-within):not([data-held="true"]) #${NEW_PASSWORD_RULES_ID}`]:
      VISUALLY_HIDDEN,
  },
};
