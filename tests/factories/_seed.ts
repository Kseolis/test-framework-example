import { faker } from '@faker-js/faker';

/**
 * Determinism contract — see docs/CONSTRAINTS.md §2.4.
 * Default SEED=1234. Seed is applied once at import time.
 * Import this module at the top of every *.factory.ts file.
 */
const seed = process.env.SEED ? Number(process.env.SEED) : 1234;
faker.seed(seed);

export const FAKER_SEED = seed;

/**
 * Synthetic-only email domain. Default = `yopmail.com` (well-known disposable
 * mail provider with valid MX, accepts any local-part, no real inbox concern).
 *
 * Reason: planetconfig.com / personal.freevpnplanet.com perform server-side
 * MX validation and reject `example.test` / `example.com` / non-existent
 * domains by routing the order to `/payment/failed/`. See docs/ux-findings.md
 * (B-payment-validation) and docs/CONSTRAINTS.md §2.4.
 *
 * Override with the SYNTHETIC_EMAIL_DOMAIN env var if needed.
 */
export const SYNTHETIC_EMAIL_DOMAIN = process.env.SYNTHETIC_EMAIL_DOMAIN ?? 'yopmail.com';
