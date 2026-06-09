import 'dotenv/config';
import { z } from 'zod';

/**
 * Strict, validated env access for all tests.
 * Import as `import { env } from '@infra/env';` — never read process.env directly.
 *
 * Defaults are the public production URLs of the three sites under test, so
 * the suite runs without an .env.local file. Override per environment via
 * .env.local or CI secrets when targeting staging or alternate hosts.
 */
const schema = z.object({
  BASE_URL_FREEVPN: z.string().url().default('https://freevpnplanet.com/'),
  BASE_URL_ACCOUNT: z.string().url().default('https://account.freevpnplanet.com/'),
  BASE_URL_PERSONAL: z.string().url().default('https://personal.freevpnplanet.com/'),
  BASE_URL_PLANETCONFIG: z.string().url().default('https://planetconfig.com/'),
  SEED: z.coerce.number().int().nonnegative().default(1234),
  // Synthetic-only email domain for factories. Default yopmail.com — disposable
  // with valid MX, so the RU/EN sites' server-side validation accepts it.
  // See docs/CONSTRAINTS.md §2.4.
  SYNTHETIC_EMAIL_DOMAIN: z.string().min(1).default('yopmail.com'),
  CI: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment:', parsed.error.format());
  process.exit(2);
}

export const env = parsed.data;
