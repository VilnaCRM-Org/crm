import { faker } from '@faker-js/faker';

export const DEFAULT_FAKER_SEED = 20260624;

export function resolveFakerSeed(): number {
  const raw = process.env.FAKER_SEED;
  const parsed = raw === undefined || raw.trim() === '' ? Number.NaN : Number(raw);
  return Number.isInteger(parsed) ? parsed : DEFAULT_FAKER_SEED;
}

export function seedFaker(seed: number = resolveFakerSeed()): number {
  faker.seed(seed);
  if (!process.env.FAKER_SEED_REPORTED) {
    process.env.FAKER_SEED_REPORTED = '1';
    console.warn(`[faker] deterministic seed=${seed} (override with FAKER_SEED=<integer>)`);
  }
  return seed;
}
