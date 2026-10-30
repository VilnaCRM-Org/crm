import { A11Y_EXCEPTIONS } from './axe-config';
import type { A11yException } from './axe-config';

interface ViolationNode {
  target: unknown[];
  xpath?: unknown[] | undefined;
}

interface Violation {
  id: string;
  nodes: ViolationNode[];
}

export interface AxeResultsLike<V extends Violation = Violation> {
  violations: V[];
}

/**
 * The element axe reported: its CSS `target`, which axe does not guarantee to be unique, and its
 * `xpath` when the scan ran with the `xpath` option, which addresses exactly that element.
 */
export interface AddressedNode {
  readonly target: string;
  readonly xpath: string | undefined;
}

/** Answers whether the element axe addressed matches an exception's `selector`. */
export type ElementMatcher = (node: AddressedNode, selector: string) => Promise<boolean> | boolean;

const elementAt = (root: ParentNode, node: AddressedNode): Element | null => {
  if (node.xpath === undefined) return root.querySelector(node.target);
  const owner = root.ownerDocument ?? document;
  const found = owner.evaluate(node.xpath, owner, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  return found.singleNodeValue instanceof Element ? found.singleNodeValue : null;
};

/** Matcher for a DOM available in-process (jsdom): resolves the reported element inside `root`. */
export const domElementMatcher =
  (root: ParentNode): ElementMatcher =>
  (node, selector) =>
    elementAt(root, node)?.matches(selector) ?? false;

const innermost = (path: unknown[] | undefined): string | undefined => {
  const last = path?.at(-1);
  return typeof last === 'string' ? last : undefined;
};

const addressOf = (node: ViolationNode): AddressedNode | undefined => {
  const target = innermost(node.target);
  return target === undefined ? undefined : { target, xpath: innermost(node.xpath) };
};

const isExcepted = async (
  violationId: string,
  node: ViolationNode,
  exceptions: readonly A11yException[],
  matches: ElementMatcher
): Promise<boolean> => {
  const address = addressOf(node);
  if (address === undefined) return false;
  const applicable = exceptions.filter(
    (exception) => exception.ruleId === violationId && exception.selector !== '*'
  );
  const verdicts = await Promise.all(
    applicable.map((exception) => matches(address, exception.selector))
  );
  return verdicts.some(Boolean);
};

/**
 * Drops violation nodes whose element matches an allowlisted exception for that rule and removes
 * violations that lose every node. Anything not matched by rule id and selector stays reported.
 */
export default async function applyA11yExceptions<R extends AxeResultsLike>(
  results: R,
  matches: ElementMatcher,
  exceptions: readonly A11yException[] = A11Y_EXCEPTIONS
): Promise<R> {
  const violations = await Promise.all(
    results.violations.map(async (violation) => {
      const kept = await Promise.all(
        violation.nodes.map(async (node) =>
          (await isExcepted(violation.id, node, exceptions, matches)) ? null : node
        )
      );
      return { ...violation, nodes: kept.filter((node) => node !== null) };
    })
  );

  return { ...results, violations: violations.filter((violation) => violation.nodes.length > 0) };
}
