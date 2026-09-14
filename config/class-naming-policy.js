/**
 * Issue #129 — class names in non-React source are `<DomainNoun…><RecognizedPatternSuffix>`.
 *
 * This module is the SINGLE SOURCE OF TRUTH for the convention. `eslint.config.mjs` builds its
 * `no-restricted-syntax` selectors from it, and `tests/unit/tooling/class-naming-gate.test.ts`
 * pins that the documented table in CLAUDE.md lists exactly these suffixes, so the docs an agent
 * reads and the gate the build runs cannot drift apart.
 *
 * Two tiers. The denylist bans the vague, role-hiding names (`Manager`, `Helper`, `Utils`, …)
 * and a domain-less bare `Service`. The allowlist requires every class to end in one of the
 * approved suffixes; each entry names the role and the pattern lineage the suffix comes from.
 * Introducing a class whose role none of them describes means adding a row here — with its
 * rationale — in the same change, never coining an undocumented suffix and never suppressing
 * the rule at the call site.
 */

/** Suffixes that hide a unit's role and license grab-bag responsibilities. */
const BANNED_SUFFIXES = [
  'Manager',
  'Helper',
  'Util',
  'Utils',
  'Data',
  'Info',
  'Common',
  'Misc',
  'Stuff',
  'Wrapper',
  'Object',
];

/** A `Service` with no domain noun, and its trivial app-less spellings. */
const BARE_SERVICE_NAMES = ['Service', 'AppService', 'MyService'];

/**
 * Approved role → suffix table. `role` is what a class carrying the suffix does; `lineage` is
 * where the vocabulary comes from (GoF, DDD, PoEAA, enterprise integration, React/Flux, or a
 * repository idiom that earlier issues established). Order is the documented table order.
 */
const APPROVED_SUFFIXES = [
  {
    suffix: 'Repository',
    role: 'persistence / API boundary of an aggregate',
    lineage: 'DDD / PoEAA',
  },
  { suffix: 'Service', role: 'domain-qualified operation', lineage: 'DDD domain service' },
  { suffix: 'Factory', role: 'encapsulated construction', lineage: 'GoF Factory' },
  { suffix: 'Builder', role: 'step-wise construction of an object', lineage: 'GoF Builder' },
  { suffix: 'Mapper', role: 'translation between representations', lineage: 'PoEAA Data Mapper' },
  { suffix: 'Adapter', role: 'conforms one interface to another', lineage: 'GoF Adapter' },
  { suffix: 'Strategy', role: 'interchangeable algorithm', lineage: 'GoF Strategy' },
  { suffix: 'Handler', role: 'processes a request or event', lineage: 'Chain of Responsibility' },
  {
    suffix: 'Guard',
    role: 'precondition: boolean, type, or throwing',
    lineage: 'type-guard idiom',
  },
  { suffix: 'Validator', role: 'validates input against rules', lineage: 'DDD Specification' },
  {
    suffix: 'Validators',
    role: 'catalog of validators, one singleton',
    lineage: 'repo idiom (form validations)',
  },
  {
    suffix: 'Normalizer',
    role: 'canonicalizes a value into one shape',
    lineage: 'enterprise Normalizer',
  },
  { suffix: 'Parser', role: 'parses a serialized form', lineage: 'parser idiom' },
  {
    suffix: 'Processor',
    role: 'transforms a payload in a pipeline',
    lineage: 'enterprise integration',
  },
  { suffix: 'Detector', role: 'classifies or recognizes a condition', lineage: 'recognizer idiom' },
  {
    suffix: 'Monitor',
    role: 'observes a rolling window of events',
    lineage: 'observer idiom (#159)',
  },
  {
    suffix: 'Reporter',
    role: 'emits telemetry or signals to a sink',
    lineage: 'observer idiom (#115, #159)',
  },
  {
    suffix: 'Signals',
    role: 'publishes one flow’s security signals',
    lineage: 'repo idiom (#159)',
  },
  { suffix: 'Scrubber', role: 'redacts sensitive fields', lineage: 'repo idiom (#115)' },
  {
    suffix: 'Selectors',
    role: 'read-only projections over state',
    lineage: 'Redux / Zustand selectors',
  },
  { suffix: 'Store', role: 'state container', lineage: 'Flux / Zustand' },
  { suffix: 'Actions', role: 'state transitions of a store', lineage: 'Flux' },
  { suffix: 'Var', role: 'container-free reactive state cell', lineage: 'Apollo makeVar idiom' },
  {
    suffix: 'State',
    role: 'listener bookkeeping of a reactive cell',
    lineage: 'repo idiom (auth render path)',
  },
  { suffix: 'Cache', role: 'memoized instances keyed by arguments', lineage: 'PoEAA Identity Map' },
  { suffix: 'Loader', role: 'loads a resource or module on demand', lineage: 'lazy-loading idiom' },
  { suffix: 'Client', role: 'outbound transport client', lineage: 'enterprise Gateway' },
  { suffix: 'API', role: 'typed façade over one remote API', lineage: 'enterprise Gateway' },
  { suffix: 'Provider', role: 'supplies a value or capability', lineage: 'provider idiom' },
  {
    suffix: 'Providers',
    role: 'catalog of providers, one singleton',
    lineage: 'provider idiom (OAuth)',
  },
  {
    suffix: 'Source',
    role: 'reads a value from where it is stored',
    lineage: 'data-source idiom (#145)',
  },
  {
    suffix: 'Seed',
    role: 'test-only preloaded value, compile-guarded',
    lineage: 'repo idiom (#158)',
  },
  {
    suffix: 'Registrar',
    role: 'DI composition root of one area',
    lineage: 'registry idiom (#109)',
  },
  {
    suffix: 'Core',
    role: 'container-free half of a two-layer boundary',
    lineage: 'repo idiom (#115, #155, #159)',
  },
  {
    suffix: 'Config',
    role: 'typed configuration value object',
    lineage: 'repo idiom (env / runtime config)',
  },
  { suffix: 'Env', role: 'raw environment reader', lineage: 'repo idiom (#112)' },
  { suffix: 'Url', role: 'URL value object', lineage: 'DDD Value Object' },
  {
    suffix: 'Target',
    role: 'resolved destination value object',
    lineage: 'DDD Value Object (#150)',
  },
  {
    suffix: 'Correlation',
    role: 'session-scoped correlation identifier',
    lineage: 'DDD Value Object (#159)',
  },
  { suffix: 'Navigator', role: 'adapter over browser navigation', lineage: 'GoF Adapter (window)' },
  { suffix: 'Controller', role: 'coordinates a UI interaction flow', lineage: 'MVC Controller' },
  { suffix: 'Error', role: 'thrown error class', lineage: 'JavaScript Error subclass' },
  { suffix: 'Errors', role: 'catalog of error constructors or codes', lineage: 'repo idiom' },
  {
    suffix: 'Signal',
    role: 'error subclass carrying one typed event',
    lineage: 'repo idiom (#159)',
  },
  { suffix: 'Styles', role: 'Emotion style object holder', lineage: 'repo idiom' },
  {
    suffix: 'Impl',
    role: 'concrete implementation of an interface',
    lineage: 'repo idiom (AuthRepositoryImpl)',
  },
];

/** Escapes a literal for embedding in an esquery regex. */
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const alternation = (values) => values.map(escape).join('|');

const bannedSuffixPattern = () => `/(?:${alternation(BANNED_SUFFIXES)})$/`;

const bareServicePattern = () => `/^(?:${alternation(BARE_SERVICE_NAMES)})$/`;

const approvedSuffixPattern = () =>
  `/.(?:${alternation(APPROVED_SUFFIXES.map((entry) => entry.suffix))})$/`;

const onClasses = (predicate) => `ClassDeclaration${predicate}, ClassExpression${predicate}`;

/**
 * The four `no-restricted-syntax` entries, in the order they are spread into the non-React
 * override blocks of eslint.config.mjs: unnamed classes, the banned suffixes, the bare `Service`,
 * and the approved-suffix allowlist. The allowlist demands at least one character before the
 * suffix, so a bare `Repository` or `Factory` is as unnamed as `Thing`. Abstract `Base*`
 * superclasses are the one allowlist carve-out: `BaseAPI` exists to be extended, so its leaf
 * name is the subclass's.
 */
const classNamingSelectors = () => [
  {
    selector: onClasses(':not([id.name])'),
    message:
      'Unnamed class — a class in non-React source needs a <DomainNoun…><Suffix> name so its ' +
      'role is visible to readers, reviewers and the DI token that mirrors it (issue #129).',
  },
  {
    selector: onClasses(`[id.name=${bannedSuffixPattern()}]`),
    message:
      'Vague class name — replace the role suffix with a recognized pattern suffix ' +
      '(Factory, Mapper, Repository, Guard, Validator, Parser, Processor, Detector, Builder, ' +
      'Handler, Strategy, Adapter, Selectors, Store, Client, Provider). See the role→suffix ' +
      'table in CLAUDE.md (issue #129).',
  },
  {
    selector: onClasses(`[id.name=${bareServicePattern()}]`),
    message:
      'Domain-less Service — qualify it with a domain noun and a role suffix ' +
      '(e.g. AuthErrorHandler), or pick a more specific pattern suffix. ' +
      'See CLAUDE.md (issue #129).',
  },
  {
    selector: onClasses(
      `[id.name]:not([id.name=${approvedSuffixPattern()}]):not([abstract=true][id.name=/^Base/])`
    ),
    message:
      'Class name lacks an approved pattern suffix — name it <DomainNoun…><Suffix> from the ' +
      'role→suffix table in CLAUDE.md, or add the new suffix to config/class-naming-policy.js ' +
      'with its rationale in the same change (issue #129).',
  },
];

module.exports = {
  APPROVED_SUFFIXES,
  BANNED_SUFFIXES,
  BARE_SERVICE_NAMES,
  approvedSuffixPattern,
  bannedSuffixPattern,
  bareServicePattern,
  classNamingSelectors,
};
