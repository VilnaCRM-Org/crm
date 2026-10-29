const navigationControlStyle = {
  display: 'flex',
  alignItems: 'center',
  boxSizing: 'border-box',
  width: '100%',
  margin: 0,
  border: 0,
  background: 'transparent',
  textAlign: 'left',
  textDecoration: 'none',
  cursor: 'pointer',
  fontFamily: 'Inter, sans-serif',
  fontWeight: 500,
  whiteSpace: 'normal',
  overflowWrap: 'anywhere',
  color: '#404142',
  '& svg': {
    flexShrink: 0,
    fill: 'none',
    color: '#969B9D',
  },
  '&:visited': { color: '#404142' },
  '&:hover': {
    backgroundColor: '#F4F5F6',
    color: '#1A1C1E',
    '& svg': {
      color: '#404142',
    },
  },
  '&[aria-current="page"]': {
    backgroundColor: 'rgba(30, 174, 255, 0.1)',
    color: '#0399ED',
    '& svg': {
      color: '#0399ED',
    },
  },
  '&:focus-visible': {
    outline: '2px solid #1A1C1E',
    outlineOffset: '-2px',
  },
  '&:focus:not(:focus-visible)': {
    outline: 'none',
  },
} as const;

export default navigationControlStyle;
