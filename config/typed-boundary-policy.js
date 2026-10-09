/**
 * Issue #332 (ADR-022) — TB-1, typed boundaries: every value that crosses a layer carries a
 * named type, never an anonymous object, tuple, bare array, catch-all or inline derivation.
 *
 * This module is the SINGLE SOURCE OF TRUTH for the two `no-restricted-syntax` selector arrays.
 * `eslint.config.mjs` spreads them into every `src` block that sets the rule, and
 * `scripts/ci/eslint-gate-fixtures.mjs` derives the fixture selector strings from it, so the
 * gate the build runs and the strings the rot guard pins cannot drift apart.
 *
 * The gate is syntactic. It reads declared annotations at the signature positions of code files
 * (return type, parameters, non-private class properties) and the exported shapes of type-only
 * files; shapes outside those positions stay review items (see CLAUDE.md, "Typed boundaries").
 */

const NON_PRIVATE = ":not([accessibility='private']):not([key.type='PrivateIdentifier'])";
const METHOD = `MethodDefinition${NON_PRIVATE} > FunctionExpression`;
const EXPORTED_FUNCTIONS = [
  'ExportNamedDeclaration > FunctionDeclaration',
  'ExportDefaultDeclaration > FunctionDeclaration',
  'ExportDefaultDeclaration > ArrowFunctionExpression',
  'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression',
  'Program > FunctionDeclaration',
  'Program > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression',
  `PropertyDefinition${NON_PRIVATE} > ArrowFunctionExpression`,
];
const FUNCTIONS = [METHOD, ...EXPORTED_FUNCTIONS];

const CONSTRUCTOR = `MethodDefinition[kind='constructor'] > FunctionExpression`;

const returnPosition = (fn) => `${fn} > TSTypeAnnotation`;
const PATTERNS = ['Identifier', 'ObjectPattern', 'ArrayPattern'];
const parameterPositions = (fn) => [
  ...PATTERNS.map((pattern) => `${fn} > ${pattern} > TSTypeAnnotation`),
  ...PATTERNS.map((pattern) => `${fn} > AssignmentPattern > ${pattern} > TSTypeAnnotation`),
  `${fn} > RestElement > TSTypeAnnotation`,
];
const PARAMETER_PROPERTY_POSITIONS = [
  `${CONSTRUCTOR} > TSParameterProperty > Identifier > TSTypeAnnotation`,
  `${CONSTRUCTOR} > TSParameterProperty > AssignmentPattern > Identifier > TSTypeAnnotation`,
];
const PROPERTY_POSITION = `PropertyDefinition${NON_PRIVATE} > TSTypeAnnotation`;

const UNKNOWN_POSITIONS = [
  ...FUNCTIONS.map(returnPosition),
  `PropertyDefinition${NON_PRIVATE}:not([key.name=/^(error|cause)$/]) > TSTypeAnnotation`,
];
const ALL_POSITIONS = [
  ...FUNCTIONS.flatMap((fn) => [returnPosition(fn), ...parameterPositions(fn)]),
  ...PARAMETER_PROPERTY_POSITIONS,
  PROPERTY_POSITION,
];

const ARRAY_REFERENCE = 'TSTypeReference[typeName.name=/^(Array|ReadonlyArray)$/]';
const RECORD_REFERENCE = "TSTypeReference[typeName.name='Record']";
const DERIVED_REFERENCE = 'TSTypeReference[typeName.name=/^(Partial|Pick|Omit|Required)$/]';
const CATCH_ALL_MAP = 'TSMappedType[constraint.type=/^TS(String|Number|Symbol)Keyword$/]';

const TYPE_FILE_ROOTS = [
  'Program > ExportNamedDeclaration',
  'Program > ExportDefaultDeclaration',
  'Program > TSInterfaceDeclaration',
  'Program > TSTypeAliasDeclaration',
];

const over = (positions, nodes) =>
  positions.flatMap((position) => nodes.map((node) => `${position} ${node}`)).join(', ');

const rootedPart = (root, part) => {
  const declaration = root.slice(root.lastIndexOf(' ') + 1);

  return part.startsWith(`${declaration} `)
    ? `${root.slice(0, -declaration.length)}${part}`
    : `${root} ${part}`;
};

const underTypeFileRoots = (parts) =>
  TYPE_FILE_ROOTS.flatMap((root) => parts.map((part) => rootedPart(root, part))).join(', ');

const NAME_IT =
  'Declare the named type in a type-only file (ADR-022, CLAUDE.md "Typed boundaries").';

/** @returns {{selector: string, message: string}[]} TB-1 entries (a) to (e) for code files */
function typedBoundarySelectors() {
  return [
    {
      selector: over(ALL_POSITIONS, ['TSTypeLiteral']),
      message: `TB-1 (a): no anonymous object type at a boundary. ${NAME_IT}`,
    },
    {
      selector: over(ALL_POSITIONS, ['TSTupleType']),
      message: `TB-1 (b): no tuple at a boundary. ${NAME_IT}`,
    },
    {
      selector: over(ALL_POSITIONS, ['TSArrayType', ARRAY_REFERENCE]),
      message:
        'TB-1 (c): no bare array at a boundary; cross a named collection interface. ' + NAME_IT,
    },
    {
      selector: [
        over(ALL_POSITIONS, ['TSAnyKeyword', 'TSObjectKeyword', RECORD_REFERENCE, CATCH_ALL_MAP]),
        over(UNKNOWN_POSITIONS, ['TSUnknownKeyword']),
      ].join(', '),
      message:
        'TB-1 (d): no any, object, Record, string-keyed map or unknown payload at a boundary ' +
        `(unknown only narrows a caught error parameter). ${NAME_IT}`,
    },
    {
      selector: over(ALL_POSITIONS, [DERIVED_REFERENCE]),
      message:
        'TB-1 (e): no inline Partial, Pick, Omit or Required at a boundary; ' +
        'name the derivation once in a type-only file and use the name (ADR-022).',
    },
  ];
}

/** @returns {{selector: string, message: string}[]} TB-1 entries (a) to (e) for type-only files */
function typedBoundaryTypeFileSelectors() {
  return [
    {
      selector: underTypeFileRoots([
        'TSTypeLiteral TSTypeLiteral',
        'TSInterfaceBody TSTypeLiteral',
        'TSTypeAliasDeclaration > :not(TSTypeLiteral) TSTypeLiteral',
      ]),
      message:
        'TB-1 (a): no nested object literal in an exported shape; ' +
        'name each variant as an interface (ADR-022).',
    },
    {
      selector: underTypeFileRoots(['TSTupleType']),
      message: 'TB-1 (b): no tuple in an exported shape; name an interface (ADR-022).',
    },
    {
      selector: underTypeFileRoots([
        "TSArrayType[elementType.type!='TSTypeReference']",
        'TSArrayType TSArrayType',
        'TSMethodSignature TSArrayType',
        'TSCallSignatureDeclaration TSArrayType',
        'TSFunctionType TSArrayType',
        'TSTypeAliasDeclaration TSArrayType',
        ARRAY_REFERENCE,
      ]),
      message:
        'TB-1 (c): an array is a property of a named collection interface ' +
        'whose element type is a named interface or class (ADR-022).',
    },
    {
      selector: underTypeFileRoots([
        'TSAnyKeyword',
        'TSObjectKeyword',
        RECORD_REFERENCE,
        'TSIndexSignature',
        CATCH_ALL_MAP,
        'TSPropertySignature:not([key.name=/^(error|cause)$/]) > TSTypeAnnotation TSUnknownKeyword',
        'TSMethodSignature > TSTypeAnnotation TSUnknownKeyword',
        'TSCallSignatureDeclaration > TSTypeAnnotation TSUnknownKeyword',
      ]),
      message:
        'TB-1 (d): no any, object, Record, index signature, string-keyed map or unknown member ' +
        '(unknown only as `error` / `cause`); name the shape (ADR-022).',
    },
    {
      selector: underTypeFileRoots([
        `TSInterfaceBody ${DERIVED_REFERENCE}`,
        `TSTypeAliasDeclaration > :not(TSTypeReference) ${DERIVED_REFERENCE}`,
      ]),
      message:
        'TB-1 (e): no inline Partial, Pick, Omit or Required inside an interface; ' +
        'name the derivation once as an alias (ADR-022).',
    },
  ];
}

module.exports = {
  typedBoundarySelectors,
  typedBoundaryTypeFileSelectors,
  TB_FUNCTION_HOLDERS: FUNCTIONS,
  TB_CODE_POSITIONS: ALL_POSITIONS,
  TB_TYPE_FILE_ROOTS: TYPE_FILE_ROOTS,
};
