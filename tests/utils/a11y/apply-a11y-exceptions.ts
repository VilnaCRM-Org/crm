import { A11Y_EXCEPTIONS } from './axe-config';
import type { A11yException } from './axe-config';

interface ViolationNode {
  target: unknown[];
}

interface Violation {
  id: string;
  nodes: ViolationNode[];
}

export interface AxeResultsLike<V extends Violation = Violation> {
  violations: V[];
}

/** Answers whether the element axe addressed by `target` matches an exception's `selector`. */
export type ElementMatcher = (target: string, selector: string) => Promise<boolean> | boolean;

/** Matcher for a DOM available in-process (jsdom): resolves axe's target inside `root`. */
export const domElementMatcher =
  (root: ParentNode): ElementMatcher =>
  (target, selector) =>
    root.querySelector(target)?.matches(selector) ?? false;

const innermostTarget = (node: ViolationNode): string | undefined => {
  const last = node.target.at(-1);
  return typeof last === 'string' ? last : undefined;
};

const isExcepted = async (
  violationId: string,
  node: ViolationNode,
  exceptions: readonly A11yException[],
  matches: ElementMatcher
): Promise<boolean> => {
  const target = innermostTarget(node);
  if (target === undefined) return false;
  const applicable = exceptions.filter(
    (exception) => exception.ruleId === violationId && exception.selector !== '*'
  );
  const verdicts = await Promise.all(
    applicable.map((exception) => matches(target, exception.selector))
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
