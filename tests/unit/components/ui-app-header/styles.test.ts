import loadIsolated from '@tests/unit/utils/isolated-module';

type HeaderStyles = (typeof import('@/components/ui-app-header/styles'))['default'];

const loadStyles = (): Promise<HeaderStyles> =>
  loadIsolated(async () => (await import('@/components/ui-app-header/styles')).default);

const RING = { outline: '2px solid #1A1C1E', outlineOffset: '2px' };

describe('header styles', () => {
  it('draws the 64 px sticky banner of each frame: bordered on desktop only', async () => {
    const { header } = await loadStyles();

    expect(header.desktop).toMatchObject({
      position: 'sticky',
      top: 0,
      boxSizing: 'border-box',
      width: '100%',
      height: '64px',
      backgroundColor: '#FBFBFB',
      border: '1px solid #E1E7EA',
      padding: '7px 11px 0 31px',
    });
    expect(header.tablet).toMatchObject({ height: '64px', backgroundColor: '#FFFFFF' });
    expect(header.mobile).toMatchObject({ height: '64px', backgroundColor: '#FFFFFF' });
    expect(header.tablet).not.toHaveProperty('border');
    expect(header.mobile).not.toHaveProperty('border');
    expect(header.tablet.padding).toBe('0 12px');
    expect(header.mobile.padding).toBe('0 15px');
    expect(header.mobile['@media (max-width:374px)']).toEqual({ padding: '0 8px' });
  });

  it('keeps the header above the page content and below the modal drawer', async () => {
    const { header } = await loadStyles();

    expect(header.desktop.zIndex).toBe(1100);
    expect(header.desktop.display).toBe('flex');
    expect(header.desktop.justifyContent).toBe('space-between');
    expect(header.desktop.alignItems).toBe('flex-start');
    expect(header.desktop.flexShrink).toBe(0);
  });

  it('sizes the logo link and artwork to the Figma boxes', async () => {
    const { logoLink, logoImage } = await loadStyles();

    expect(logoLink.desktop).toMatchObject({ width: '143px', height: '48.125px' });
    expect(logoLink.tablet).toMatchObject({ width: '143px', height: '48.125px', marginTop: '8px' });
    expect(logoLink.mobile).toMatchObject({ width: '125px', height: '44px', marginTop: '6px' });
    expect(logoImage.desktop).toMatchObject({
      display: 'block',
      width: '143px',
      height: '48.125px',
    });
    expect(logoImage.tablet).toMatchObject({ width: '143px', height: '48.125px' });
    expect(logoImage.mobile).toMatchObject({ width: '125px', height: '42.067px' });
  });

  it('rings only a keyboard-focused logo with the repository treatment', async () => {
    const { logoLink } = await loadStyles();

    expect(logoLink.desktop['&:focus-visible']).toEqual(RING);
    expect(logoLink.desktop['&:focus:not(:focus-visible)']).toEqual({ outline: 'none' });
    expect(logoLink.desktop).toMatchObject({
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
    });
  });

  it('lays the control cluster out with the gaps and boxes of each frame', async () => {
    const { cluster } = await loadStyles();

    expect(cluster.desktop).toMatchObject({ display: 'flex', gap: '10px', flexShrink: 0 });
    expect(cluster.tablet).toMatchObject({ gap: '8px', marginTop: '6px' });
    expect(cluster.mobile).toMatchObject({
      gap: '16px',
      width: '160px',
      height: '40px',
      marginTop: '8px',
      alignItems: 'center',
    });
  });

  it('paints the disabled search #EAECEE with no border and the placeholder #969B9D', async () => {
    const { search, searchInput, magnifier } = await loadStyles();

    expect(search.desktop).toMatchObject({
      position: 'relative',
      width: '477px',
      height: '48px',
      borderRadius: '8px',
      backgroundColor: '#EAECEE',
      overflow: 'hidden',
    });
    expect(search.desktop).not.toHaveProperty('border');
    expect(search.tablet).toMatchObject({ width: '360px', height: '52px' });
    expect(searchInput.desktop).toMatchObject({
      paddingLeft: '44px',
      fontSize: '14px',
      fontWeight: 500,
      lineHeight: '18px',
      fontFamily: 'Inter, sans-serif',
      color: '#969B9D',
      WebkitTextFillColor: '#969B9D',
      cursor: 'default',
      backgroundColor: 'transparent',
      border: 0,
    });
    expect(searchInput.desktop['&::placeholder']).toEqual({ color: '#969B9D', opacity: 1 });
    expect(
      searchInput.desktop['&::-webkit-search-cancel-button, &::-webkit-search-decoration']
    ).toEqual({
      display: 'none',
    });
    expect(searchInput.tablet).toMatchObject({ paddingLeft: '48px', fontSize: '16px' });
    expect(magnifier.desktop).toMatchObject({ top: '14px', left: '14px', width: '20px' });
    expect(magnifier.tablet).toMatchObject({ top: '14px', left: '14px', width: '24px' });
    expect(magnifier.desktop.color).toBe('#969B9D');
  });

  it('paints the disabled round buttons #E1E7EA with a #D0D4D8 glyph and no border', async () => {
    const { iconButton, iconGlyph } = await loadStyles();

    expect(iconButton.desktop).toMatchObject({
      width: '48px',
      height: '48px',
      borderRadius: '42px',
      backgroundColor: '#E1E7EA',
      color: '#D0D4D8',
      border: 0,
      overflow: 'visible',
    });
    expect(iconButton.tablet).toMatchObject({ width: '52px', height: '52px' });
    expect(iconGlyph.desktop).toMatchObject({
      top: '14px',
      left: '14px',
      width: '20px',
      height: '20px',
    });
    expect(iconGlyph.tablet).toMatchObject({
      top: '14px',
      left: '14px',
      width: '24px',
      height: '24px',
    });
  });

  it('draws the mobile bell and list as bare #D0D4D8 glyphs without a container', async () => {
    const { iconButton, iconGlyph } = await loadStyles();

    expect(iconButton.mobile).toMatchObject({
      width: '24px',
      height: '24px',
      backgroundColor: 'transparent',
      color: '#D0D4D8',
      border: 0,
    });
    expect(iconButton.mobile).not.toHaveProperty('borderRadius');
    expect(iconGlyph.mobile).toEqual({ display: 'block', width: '24px', height: '24px' });
  });

  it("draws Figma's badge: 18 px, disabled #D0D4D8, white Inter 500 12/18 at 34,30", async () => {
    const { badge } = await loadStyles();

    expect(badge).toMatchObject({
      position: 'absolute',
      top: '30px',
      left: '34px',
      width: '18px',
      height: '18px',
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

    expect(search.drawer).toMatchObject({
      width: '293px',
      height: '48px',
      margin: '13px 10px 0',
      backgroundColor: '#EAECEE',
    });
    expect(searchInput.drawer).toMatchObject({ paddingLeft: '44px', fontSize: '14px' });
    expect(magnifier.drawer).toMatchObject({
      top: '14px',
      left: '14px',
      width: '20px',
      height: '20px',
    });
  });
});
