import { faker } from '@faker-js/faker';
import { env } from '@infra/env';

/**
 * Determinism contract — see docs/CONSTRAINTS.md §2.4.
 * Default SEED=1234 (validated in tests/infra/env.ts). Applied once at import
 * time. Import this module at the top of every *.factory.ts file.
 */
const seed = env.SEED;
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
 * Sourced from the validated env loader (override via SYNTHETIC_EMAIL_DOMAIN).
 */
export const SYNTHETIC_EMAIL_DOMAIN = env.SYNTHETIC_EMAIL_DOMAIN;
