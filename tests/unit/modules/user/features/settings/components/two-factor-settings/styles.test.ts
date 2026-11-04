import loadIsolated from '@tests/unit/utils/isolated-module';

const RING = { outline: '2px solid #1A1C1E', outlineOffset: '2px' };
const PILL = {
  minWidth: 0,
  maxHeight: 'none',
  margin: 0,
  padding: '0 1.5rem',
  borderRadius: '3.5625rem',
  fontFamily: 'Golos',
  fontWeight: 500,
  fontSize: '0.9375rem',
  lineHeight: '1.125rem',
  letterSpacing: 0,
  textTransform: 'none',
  '&:focus-visible': RING,
};
const OUTLINED = {
  height: '2.5rem',
  border: '1px solid #80878A',
  backgroundColor: '#FFFFFF',
  '&:hover': { backgroundColor: '#F4F5F6' },
  '&:focus-visible': RING,
};
const CARD = {
  marginInline: '-0.4375rem',
  backgroundColor: '#FFFFFF',
  border: '1px solid #E1E7EA',
  borderRadius: '0.75rem',
  fontFamily: 'Golos',
  color: '#404142',
  minWidth: 0,
  '& .MuiTextField-root': { minWidth: 0 },
};
const INTER_NOTE = {
  fontFamily: 'Inter',
  fontWeight: 400,
  fontSize: '0.875rem',
  lineHeight: '1rem',
  color: '#404142',
};

describe('two-factor settings styles', () => {
  it('pins every token, with the inherited minimum widths reset inside the card', async () => {
    const { default: styles } = await loadIsolated(
      () => import('@/modules/user/features/settings/components/two-factor-settings/styles')
    );

    expect(styles).toEqual({
      card: {
        ...CARD,
        padding: '1.0625rem 1rem 2.1875rem 1.0625rem',
        '@media (min-width:768px)': { marginInline: 0, padding: '1.9375rem' },
        '@media (min-width:1025px)': { padding: '1.4375rem 1.9375rem 1.875rem' },
      },
      cardConnected: {
        ...CARD,
        padding: '0.9375rem 1.0625rem',
        '@media (min-width:768px)': { marginInline: 0, padding: '1.9375rem' },
        '@media (min-width:1025px)': { padding: '1.6875rem 1.9375rem' },
      },
      submit: { '&&': { minWidth: 0 } },
      copyButton: { '&&': { ...PILL, ...OUTLINED, color: '#1B2327' } },
      actionButton: {
        '&&': {
          ...PILL,
          ...OUTLINED,
          color: '#1B2327',
          height: '2.75rem',
          '@media (min-width:768px)': {
            height: '3.875rem',
            padding: '0 2rem',
            fontWeight: 600,
            fontSize: '1.125rem',
          },
          '@media (min-width:1025px)': {
            height: '2.625rem',
            padding: '0 1.5rem',
            fontWeight: 500,
            fontSize: '0.9375rem',
          },
        },
      },
      codeList: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '0.5rem',
        margin: '0 0 1rem',
        padding: 0,
        listStyle: 'none',
      },
      codeItem: {
        padding: '0.5rem 0.875rem',
        overflowWrap: 'anywhere',
        backgroundColor: '#EAECEE',
        borderRadius: '0.25rem',
        fontFamily: 'Golos',
        fontWeight: 600,
        fontSize: '1rem',
        lineHeight: 'normal',
        color: '#1A1C1E',
      },
      savedRow: { margin: '1.25rem 0 0' },
      statusHeading: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        margin: '0 0 1.25rem',
        fontFamily: 'Golos',
        fontWeight: 600,
        fontSize: '1.125rem',
        lineHeight: 'normal',
        color: '#1A1C1E',
        outline: 'none',
        '&:focus-visible': RING,
      },
      actions: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '0.75rem',
        marginTop: '0.4375rem',
        marginLeft: '3.25rem',
        '@media (min-width:768px)': { marginTop: '1rem', marginLeft: '5.8125rem' },
        '@media (min-width:1025px)': { marginTop: '0.3125rem' },
      },
      footerButton: { '&&': { ...PILL, ...OUTLINED, marginTop: '0.75rem', color: '#1B2327' } },
      reauthMessage: {
        margin: '0 0 1rem',
        fontFamily: 'Inter',
        fontWeight: 400,
        fontSize: '1rem',
        lineHeight: '1.5rem',
        color: '#1A1C1E',
        outline: 'none',
        '&:focus-visible': RING,
      },
      reauthButton: { '&&': { ...PILL, ...OUTLINED, color: '#1A1C1E' } },
      note: { margin: '1rem 0 0', ...INTER_NOTE },
    });
  });

  it('pins the card header tokens across the three frames', async () => {
    const { default: styles } = await loadIsolated(
      () =>
        import('@/modules/user/features/settings/components/two-factor-settings/card-header-styles')
    );
    const row = {
      display: 'flex',
      gap: '0.75rem',
      marginInline: '-1.0625rem -1rem',
      paddingInline: '1.0625rem 1rem',
      '@media (min-width:768px)': {
        gap: '1.25rem',
        marginInline: '-1.9375rem',
        paddingInline: '1.9375rem',
      },
    };

    expect(styles).toEqual({
      divided: {
        ...row,
        alignItems: 'center',
        marginBottom: '1.4375rem',
        '@media (min-width:768px)': {
          gap: '1.25rem',
          marginInline: '-1.9375rem',
          paddingInline: '1.9375rem',
          marginBottom: '2.75rem',
        },
        '@media (min-width:1025px)': {
          marginBottom: '1.25rem',
          paddingBottom: '1.8125rem',
          borderBottom: '1px solid #E1E7EA',
        },
      },
      plain: { ...row, alignItems: 'flex-start' },
      logo: {
        flexShrink: 0,
        width: '2.5rem',
        height: '2.5rem',
        '@media (min-width:768px)': { width: '4.5625rem', height: '4.5625rem' },
      },
      text: { display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 },
      title: {
        margin: 0,
        fontFamily: 'Golos',
        fontWeight: 600,
        fontSize: '1.125rem',
        lineHeight: '1.375rem',
        color: '#1A1C1E',
        outline: 'none',
        '&:focus-visible': RING,
        '@media (min-width:768px)': {
          fontWeight: 700,
          fontSize: '1.75rem',
          lineHeight: '2.125rem',
        },
        '@media (min-width:1025px)': { fontSize: '1.375rem', lineHeight: '1.625rem' },
      },
      subtitle: {
        margin: 0,
        maxWidth: '19.8125rem',
        ...INTER_NOTE,
        '@media (min-width:768px)': { fontSize: '1rem', lineHeight: '1.125rem' },
        '@media (min-width:1025px)': { fontSize: '0.875rem', lineHeight: '1rem' },
      },
    });
  });

  it('pins the setup step tokens across the three frames', async () => {
    const { default: styles } = await loadIsolated(
      () =>
        import('@/modules/user/features/settings/components/two-factor-settings/setup-steps-styles')
    );
    const textTablet = {
      maxWidth: '20.125rem',
      fontFamily: 'Golos',
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: '1.375rem',
    };
    const textDesktop = { maxWidth: '18.8125rem', fontSize: '1rem', lineHeight: '1.1875rem' };
    const text = {
      margin: 0,
      maxWidth: '15.6875rem',
      fontFamily: 'Inter',
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: '1.125rem',
      color: '#404142',
      '@media (min-width:768px)': textTablet,
      '@media (min-width:1025px)': textDesktop,
    };
    const stepRow = { display: 'flex', alignItems: 'flex-start', gap: '1rem' };

    expect(styles).toEqual({
      steps: {
        margin: '0 0 1.25rem',
        padding: '0 0 0 0.125rem',
        listStyle: 'none',
        '@media (min-width:768px)': { paddingLeft: '0.25rem' },
        '@media (min-width:1025px)': { paddingLeft: 0 },
      },
      step: {
        position: 'relative',
        marginBottom: '1.0625rem',
        '&:last-of-type': { marginBottom: 0 },
        '@media (min-width:768px)': { marginBottom: '1.8125rem' },
        '@media (min-width:1025px)': { marginBottom: '1.3125rem' },
      },
      stepRow,
      stepRowWithInfo: { ...stepRow, '@media (min-width:768px)': { alignItems: 'center' } },
      stepBody: {
        paddingTop: '0.5625rem',
        paddingLeft: '2.625rem',
        '@media (min-width:768px)': { paddingTop: '0.75rem', paddingLeft: '3rem' },
        '@media (min-width:1025px)': { paddingTop: '0.625rem', paddingLeft: '2.5rem' },
      },
      badge: {
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '1.625rem',
        height: '1.625rem',
        borderRadius: '2.0625rem',
        backgroundColor: '#E1E7EA',
        fontFamily: 'Inter',
        fontWeight: 500,
        fontSize: '1rem',
        lineHeight: '1.125rem',
        color: '#57595B',
        '@media (min-width:768px)': { width: '2rem', height: '2rem' },
        '@media (min-width:1025px)': { width: '1.5rem', height: '1.5rem' },
      },
      stepText: text,
      stepTextBeforeInfo: {
        ...text,
        maxWidth: '12.5625rem',
        '@media (min-width:768px)': { ...textTablet, maxWidth: '15.875rem' },
        '@media (min-width:1025px)': { ...textDesktop, maxWidth: '14rem' },
      },
      qrFrame: {
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '13.125rem',
        padding: '1.3125rem',
        marginTop: '0.3125rem',
        marginBottom: '0.5625rem',
        backgroundColor: '#FBFBFB',
        borderRadius: '0.75rem',
        '@media (min-width:768px)': {
          maxWidth: '18.5625rem',
          padding: '1.85625rem',
          marginTop: '0.5rem',
        },
        '@media (min-width:1025px)': {
          maxWidth: '15.625rem',
          padding: '1.5625rem',
          marginTop: '1.3125rem',
          marginBottom: '0.5rem',
        },
      },
      keyChip: {
        boxSizing: 'border-box',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        maxWidth: '100%',
        padding: '0.5rem 0.875rem',
        backgroundColor: '#EAECEE',
        borderRadius: '0.25rem',
      },
      keyCode: {
        minWidth: 0,
        overflowWrap: 'anywhere',
        fontFamily: 'Golos',
        fontWeight: 600,
        fontSize: '1rem',
        lineHeight: 'normal',
        color: '#57595B',
      },
      copyIconButton: {
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '1.75rem',
        height: '1.75rem',
        margin: '-0.25rem',
        padding: 0,
        border: 0,
        borderRadius: '0.25rem',
        backgroundColor: 'transparent',
        color: '#57595B',
        cursor: 'pointer',
        '&:focus-visible': RING,
      },
      copyIcon: { display: 'block', width: '1.25rem', height: '1.25rem', fill: 'none' },
      copyFailed: { margin: '0.5rem 0 0', ...INTER_NOTE },
      hint: {
        maxWidth: '15.125rem',
        margin: '0.5625rem 0 0',
        ...INTER_NOTE,
        '@media (min-width:768px)': { maxWidth: '19.8125rem', marginTop: '0.75rem' },
        '@media (min-width:1025px)': { marginTop: '0.6875rem' },
      },
    });
  });

  it('pins the key info tooltip tokens and its open and closed visibility', async () => {
    const { default: styles } = await loadIsolated(
      () =>
        import('@/modules/user/features/settings/components/two-factor-settings/key-info-styles')
    );
    const positioner = {
      position: 'absolute',
      zIndex: 2,
      left: 0,
      right: 0,
      bottom: '100%',
      '@media (min-width:768px)': {
        left: '8.9375rem',
        right: 'auto',
        width: '23.3125rem',
        bottom: 'calc(100% - 0.625rem)',
        paddingBottom: '0.4375rem',
      },
      '@media (min-width:1025px)': {
        left: 'auto',
        right: 0,
        width: 'min(20.875rem, 100%)',
        bottom: 'calc(100% - 0.5625rem)',
        paddingBottom: '0.5625rem',
      },
      '@media (min-width:1440px)': { left: '7.6875rem', right: 'auto', width: '20.875rem' },
    };

    expect(styles).toEqual({
      anchor: { flexShrink: 0, display: 'inline-flex' },
      button: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '1.5rem',
        height: '1.5rem',
        padding: 0,
        border: 0,
        borderRadius: '50%',
        backgroundColor: 'transparent',
        color: '#57595B',
        cursor: 'pointer',
        '&:focus-visible': RING,
      },
      icon: {
        display: 'block',
        width: '1.5rem',
        height: '1.5rem',
        fill: 'none',
        '@media (min-width:1025px)': { width: '1.25rem', height: '1.25rem' },
      },
      open: { ...positioner, visibility: 'visible' },
      closed: { ...positioner, visibility: 'hidden' },
      body: {
        boxSizing: 'border-box',
        padding: '0.75rem 1rem',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E1E7EA',
        borderRadius: '0.5rem',
        boxShadow: '0 7px 6px rgba(201, 206, 208, 0.41)',
        ...INTER_NOTE,
        '@media (min-width:768px)': { fontSize: '1rem', lineHeight: '1.125rem' },
        '@media (min-width:1025px)': { fontSize: '0.875rem', lineHeight: '1rem' },
      },
      arrow: {
        display: 'none',
        width: 0,
        height: 0,
        marginTop: '-1px',
        borderTop: '5px solid #FFFFFF',
        borderInline: '10px solid transparent',
        '@media (min-width:768px)': { display: 'block', marginLeft: '11.0625rem' },
        '@media (min-width:1025px)': { display: 'none' },
        '@media (min-width:1440px)': { display: 'block', marginLeft: '9.8125rem' },
      },
    });
  });
});
