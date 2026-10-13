import { customColors } from '@/styles/colors';

const item = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
  fontFamily: 'Inter',
  fontSize: '0.875rem',
  lineHeight: '1.125rem',
};

export default {
  list: {
    listStyle: 'none',
    margin: '-0.5rem 0 1rem',
    padding: 0,
    display: 'grid',
    gap: '0.25rem',
  },
  met: { ...item, color: customColors.text.dark },
  unmet: { ...item, color: customColors.text.primary },
  icon: { fontSize: '1rem', flexShrink: 0 },
  visuallyHidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    margin: '-1px',
    padding: 0,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
    border: 0,
  },
};
