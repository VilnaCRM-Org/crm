import loadIsolated from '@tests/unit/utils/isolated-module';

type HeaderStyles = (typeof import('@/components/ui-app-header/styles'))['default'];

const loadStyles = (): Promise<HeaderStyles> =>
  loadIsolated(async () => (await import('@/components/ui-app-header/styles')).default);

const RING = { outline: '2px solid #1A1C1E', outlineOffset: '2px' };

const HEADER = {
  position: 'sticky',
  top: 0,
  zIndex: 1100,
  boxSizing: 'border-box',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  width: '100%',
  height: '64px',
  flexShrink: 0,
  backgroundColor: '#FFFFFF',
};

const LOGO_LINK = {
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  '&:focus-visible': RING,
  '&:focus:not(:focus-visible)': { outline: 'none' },
};

const LOGO_BOX = { width: '143px', height: '48.125px' };

const CLUSTER = { display: 'flex', alignItems: 'flex-start', flexShrink: 0 };

const SEARCH_BOX = {
  position: 'relative',
  flexShrink: 0,
  overflow: 'hidden',
  borderRadius: '8px',
  backgroundColor: '#EAECEE',
};

const SEARCH_INPUT = {
  position: 'absolute',
  inset: 0,
  boxSizing: 'border-box',
  width: '100%',
  height: '100%',
  margin: 0,
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  border: 0,
  outline: 'none',
  backgroundColor: 'transparent',
  appearance: 'none',
  cursor: 'default',
  fontFamily: 'Inter, sans-serif',
  fontWeight: 500,
  lineHeight: '18px',
  color: '#969B9D',
  WebkitTextFillColor: '#969B9D',
  '&::placeholder': { color: '#969B9D', opacity: 1 },
  '&::-webkit-search-cancel-button, &::-webkit-search-decoration': { display: 'none' },
};

const MAGNIFIER = { position: 'absolute', top: '14px', left: '14px', color: '#969B9D' };

const ICON_BUTTON = {
  position: 'relative',
  display: 'block',
  flexShrink: 0,
  padding: 0,
  border: 0,
  borderRadius: '42px',
  overflow: 'visible',
  cursor: 'default',
  fontFamily: 'Inter, sans-serif',
  backgroundColor: '#E1E7EA',
  color: '#D0D4D8',
};

const ICON_GLYPH = { position: 'absolute', top: '14px', left: '14px' };

describe('header styles', () => {
  it('draws the 64 px sticky banner of each frame: bordered on desktop only', async () => {
    const { header } = await loadStyles();

    expect(header).toEqual({
      desktop: {
        ...HEADER,
        backgroundColor: '#FBFBFB',
        border: '1px solid #E1E7EA',
        padding: '7px 11px 0 31px',
      },
      tablet: { ...HEADER, padding: '0 12px' },
      mobile: { ...HEADER, padding: '0 15px', '@media (max-width:374px)': { padding: '0 8px' } },
    });
  });

  it('keeps the header above the page content and below the modal drawer', async () => {
    const { header } = await loadStyles();

    expect(header.desktop.zIndex).toBe(1100);
    expect(header.tablet.zIndex).toBe(1100);
    expect(header.mobile.zIndex).toBe(1100);
  });

  it('sizes the logo link and artwork to the Figma boxes', async () => {
    const { logoLink, logoImage } = await loadStyles();

    expect(logoLink).toEqual({
      desktop: { ...LOGO_LINK, ...LOGO_BOX },
      tablet: { ...LOGO_LINK, ...LOGO_BOX, marginTop: '8px' },
      mobile: { ...LOGO_LINK, width: '125px', height: '44px', marginTop: '6px' },
    });
    expect(logoImage).toEqual({
      desktop: { display: 'block', ...LOGO_BOX },
      tablet: { display: 'block', ...LOGO_BOX },
      mobile: { display: 'block', width: '125px', height: '42.067px' },
    });
  });

  it('rings only a keyboard-focused logo with the repository treatment', async () => {
    const { logoLink } = await loadStyles();

    expect(logoLink.desktop['&:focus-visible']).toEqual(RING);
    expect(logoLink.tablet['&:focus-visible']).toEqual(RING);
    expect(logoLink.mobile['&:focus-visible']).toEqual(RING);
    expect(logoLink.mobile['&:focus:not(:focus-visible)']).toEqual({ outline: 'none' });
  });

  it('lays the control cluster out with the gaps and boxes of each frame', async () => {
    const { cluster } = await loadStyles();

    expect(cluster).toEqual({
      desktop: { ...CLUSTER, gap: '10px' },
      tablet: { ...CLUSTER, gap: '8px', marginTop: '6px' },
      mobile: {
        ...CLUSTER,
        alignItems: 'center',
        gap: '16px',
        width: '160px',
        height: '40px',
        marginTop: '8px',
      },
    });
  });

  it('paints the disabled search #EAECEE with no border and the placeholder #969B9D', async () => {
    const { search, searchInput, magnifier } = await loadStyles();

    expect(search.desktop).toEqual({ ...SEARCH_BOX, width: '477px', height: '48px' });
    expect(search.tablet).toEqual({ ...SEARCH_BOX, width: '360px', height: '52px' });
    expect(searchInput.desktop).toEqual({ ...SEARCH_INPUT, paddingLeft: '44px', fontSize: '14px' });
    expect(searchInput.tablet).toEqual({ ...SEARCH_INPUT, paddingLeft: '48px', fontSize: '16px' });
    expect(magnifier.desktop).toEqual({ ...MAGNIFIER, width: '20px', height: '20px' });
    expect(magnifier.tablet).toEqual({ ...MAGNIFIER, width: '24px', height: '24px' });
  });

  it('paints the disabled round buttons #E1E7EA with a #D0D4D8 glyph and no border', async () => {
    const { iconButton, iconGlyph } = await loadStyles();

    expect(iconButton.desktop).toEqual({ ...ICON_BUTTON, width: '48px', height: '48px' });
    expect(iconButton.tablet).toEqual({ ...ICON_BUTTON, width: '52px', height: '52px' });
    expect(iconGlyph.desktop).toEqual({ ...ICON_GLYPH, width: '20px', height: '20px' });
    expect(iconGlyph.tablet).toEqual({ ...ICON_GLYPH, width: '24px', height: '24px' });
  });

  it('draws the mobile bell and list as bare #D0D4D8 glyphs without a container', async () => {
    const { iconButton, iconGlyph } = await loadStyles();

    expect(iconButton.mobile).toEqual({
      display: 'block',
      flexShrink: 0,
      width: '24px',
      height: '24px',
      padding: 0,
      border: 0,
      cursor: 'default',
      backgroundColor: 'transparent',
      color: '#D0D4D8',
    });
    expect(iconGlyph.mobile).toEqual({ display: 'block', width: '24px', height: '24px' });
  });

  it("draws Figma's badge: 18 px, disabled #D0D4D8, white Inter 500 12/18 at 34,30", async () => {
    const { badge } = await loadStyles();

    expect(badge).toEqual({
      position: 'absolute',
      top: '30px',
      left: '34px',
      boxSizing: 'border-box',
      minWidth: '18px',
      height: '18px',
      padding: '0 1px',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      borderRadius: '45px',
      backgroundColor: '#D0D4D8',
      color: '#FFFFFF',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 500,
      fontSize: '12px',
      lineHeight: '18px',
      textAlign: 'center',
    });
  });

  it("reserves the chip's border box in the user slot", async () => {
    const { slot, slotPlaceholder } = await loadStyles();

    expect(slot.desktop).toEqual({
      flexShrink: 0,
      width: 'max-content',
      minWidth: '225px',
      height: '48px',
    });
    expect(slot.tablet).toEqual({
      flexShrink: 0,
      width: 'max-content',
      minWidth: '253px',
      height: '52px',
    });
    expect(slot.mobile).toEqual({ flexShrink: 0, width: '40px', height: '40px' });
    expect(slotPlaceholder).toEqual({ width: '100%', height: '100%' });
  });

  it('hides the status text with the clip pattern and no live region role', async () => {
    const { hidden } = await loadStyles();

    expect(hidden).toEqual({
      border: 0,
      clip: 'rect(0 0 0 0)',
      height: '1px',
      margin: '-1px',
      overflow: 'hidden',
      padding: 0,
      position: 'absolute',
      whiteSpace: 'nowrap',
      width: '1px',
    });
  });

  it('places the drawer search in the panel at 10,13 with the mobile disabled look', async () => {
    const { search, searchInput, magnifier } = await loadStyles();

    expect(search.drawer).toEqual({
      ...SEARCH_BOX,
      width: '293px',
      height: '48px',
      margin: '13px 10px 0',
    });
    expect(searchInput.drawer).toEqual({ ...SEARCH_INPUT, paddingLeft: '44px', fontSize: '14px' });
    expect(magnifier.drawer).toEqual({ ...MAGNIFIER, width: '20px', height: '20px' });
  });
});
