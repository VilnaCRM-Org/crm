type StyleRuleLike = { selectorText: string; style: CSSStyleDeclaration };
type MediaRuleLike = { media: { mediaText: string }; cssRules: CSSRuleList };

const isStyleRule = (rule: CSSRule): rule is CSSRule & StyleRuleLike =>
  typeof (rule as Partial<StyleRuleLike>).selectorText === 'string';

const isMediaRule = (rule: CSSRule): rule is CSSRule & MediaRuleLike => {
  const candidate = rule as Partial<MediaRuleLike>;
  return typeof candidate.media?.mediaText === 'string' && candidate.cssRules !== undefined;
};

const topLevelRules = (): CSSRule[] =>
  Array.from(document.styleSheets).flatMap((sheet) => Array.from(sheet.cssRules));

const compact = (value: string): string => value.replace(/\s+/g, '');

const selectorsFor = (element: Element, suffix: string): string[] =>
  Array.from(element.classList)
    .filter((token) => token.startsWith('css-'))
    .map((token) => `.${token}${suffix}`);

const declarationsIn = (
  rules: CSSRule[],
  element: Element,
  suffix: string
): CSSStyleDeclaration[] => {
  const selectors = selectorsFor(element, suffix).map(compact);
  return rules
    .filter(isStyleRule)
    .filter((rule) => selectors.includes(compact(rule.selectorText)))
    .map((rule) => rule.style);
};

const declarationIn = (
  rules: CSSRule[],
  element: Element,
  suffix: string
): CSSStyleDeclaration | undefined => declarationsIn(rules, element, suffix)[0];

const mediaRulesMatching = (mediaFragment: string): CSSRule[] =>
  topLevelRules()
    .filter(isMediaRule)
    .filter((rule) => compact(rule.media.mediaText).includes(compact(mediaFragment)))
    .flatMap((rule) => Array.from(rule.cssRules));

/**
 * The emotion declaration block generated for `element` (optionally for one of its
 * pseudo-element selectors, e.g. `'::after'`), read back from the parsed stylesheet.
 */
export const styleRuleFor = (element: Element, suffix = ''): CSSStyleDeclaration | undefined =>
  declarationIn(topLevelRules(), element, suffix);

/**
 * The emotion declaration block generated for `element` inside the media block whose
 * condition contains `mediaFragment` (whitespace-insensitive, e.g. `'min-width:768px'`).
 */
export const mediaStyleRuleFor = (
  element: Element,
  mediaFragment: string,
  suffix = ''
): CSSStyleDeclaration | undefined =>
  declarationIn(mediaRulesMatching(mediaFragment), element, suffix);

export const winningMediaValueFor = (
  element: Element,
  mediaFragment: string,
  property: string
): string | undefined =>
  declarationsIn(mediaRulesMatching(mediaFragment), element, '')
    .map((style) => style.getPropertyValue(property))
    .filter((value) => value !== '')
    .at(-1);
