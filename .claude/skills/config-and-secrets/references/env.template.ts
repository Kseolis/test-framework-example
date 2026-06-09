/**
 * tests/infra/env.ts — strict, validated env access.
 * Import as `import { env } from '@infra/env';` everywhere instead of `process.env.X`.
 */
import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('test'),
  BASE_URL: z.string().url(),
  API_BASE_URL: z.string().url(),
  TEST_USER_EMAIL: z.string().email(),
  TEST_USER_PASSWORD: z.string().min(1),
  TEST_ADMIN_EMAIL: z.string().email().optional(),
  TEST_ADMIN_PASSWORD: z.string().min(1).optional(),
  SEED: z.coerce.number().int().nonnegative().optional(),
  CI: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Hard fail at import — better than running 1000 broken tests
  console.error('Invalid environment:', parsed.error.format());
  process.exit(2);
}

export const env = parsed.data;
