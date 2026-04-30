import { readFileSync } from 'fs';
import path from 'path';

import Ajv from 'ajv';

const repoRoot = path.resolve(__dirname, '../../..');
const schemaPath = path.join(repoRoot, 'config/metrics-policy.schema.json');
const policyPath = path.join(repoRoot, 'config/metrics-policy.json');

const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
const policy = JSON.parse(readFileSync(policyPath, 'utf8'));

const expectReviewRangePairOrder = (
  review: (typeof policy)['review'] | undefined,
  minKey:
    | 'cloc_ratio_min'
    | 'blank_ratio_min'
    | 'halstead_purity_ratio_function_min'
    | 'halstead_purity_ratio_file_min',
  maxKey:
    | 'cloc_ratio_max'
    | 'blank_ratio_max'
    | 'halstead_purity_ratio_function_max'
    | 'halstead_purity_ratio_file_max'
) => {
  if (!review) {
    return;
  }

  const min = review[minKey];
  const max = review[maxKey];

  expect(min).toBeDefined();
  expect(max).toBeDefined();

  if (min === undefined || max === undefined) {
    return;
  }

  expect(min).toBeLessThanOrEqual(max);
};

describe('metrics policy schema', () => {
  it('validates the committed policy document as a complete schema instance', () => {
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(schema);

    expect(validate(policy)).toBe(true);
  });

  it('allows omitting the optional review block while still validating the hard policy', () => {
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(schema);
    const { review, ...hardOnlyPolicy } = policy;

    expect(validate(hardOnlyPolicy)).toBe(true);
  });

  it('keeps every configured review min/max pair in a valid order', () => {
    expectReviewRangePairOrder(policy.review, 'cloc_ratio_min', 'cloc_ratio_max');
    expectReviewRangePairOrder(policy.review, 'blank_ratio_min', 'blank_ratio_max');
    expectReviewRangePairOrder(
      policy.review,
      'halstead_purity_ratio_function_min',
      'halstead_purity_ratio_function_max'
    );
    expectReviewRangePairOrder(
      policy.review,
      'halstead_purity_ratio_file_min',
      'halstead_purity_ratio_file_max'
    );
  });

  it('does not dereference review thresholds when the review block is omitted', () => {
    expect(() => {
      expectReviewRangePairOrder(undefined, 'cloc_ratio_min', 'cloc_ratio_max');
      expectReviewRangePairOrder(undefined, 'blank_ratio_min', 'blank_ratio_max');
      expectReviewRangePairOrder(
        undefined,
        'halstead_purity_ratio_function_min',
        'halstead_purity_ratio_function_max'
      );
      expectReviewRangePairOrder(
        undefined,
        'halstead_purity_ratio_file_min',
        'halstead_purity_ratio_file_max'
      );
    }).not.toThrow();
  });
});
