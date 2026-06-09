# Faker determinism

## Why determinism matters

Tests with random data are flaky-by-design: a green run today, a red run tomorrow on the same code. We make Faker deterministic by seeding it once.

## Strategy

```ts
// tests/factories/_seed.ts
import { faker } from '@faker-js/faker';
const seed = process.env.SEED ? Number(process.env.SEED) : 1234;
faker.seed(seed);
export const FAKER_SEED = seed;
```

Import this module at the top of every factory file:

```ts
import './_seed';
```

ESM ensures the seeding happens before any factory call.

## CI vs local

- Local: SEED unset → fixed default (1234). Same data every run.
- CI: SEED is the build number for variance OR a fixed value committed in `.env.ci` to keep snapshots stable.

## What to do when a test really needs randomness

Some tests intentionally want randomized inputs (fuzz-style). Mark them:

```ts
test('@fuzz handles arbitrary names', async ({}) => {
  faker.seed(); // reset to randomness
  // ...
});
```

A custom reporter aggregates `@fuzz` failures separately.
