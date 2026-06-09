import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  BASE_URL_FREEVPN: z.string().url().default('https://freevpnplanet.com/'),
  BASE_URL_ACCOUNT: z.string().url().default('https://account.freevpnplanet.com/'),
  BASE_URL_PERSONAL: z.string().url().default('https://personal.freevpnplanet.com/'),
  BASE_URL_PLANETCONFIG: z.string().url().default('https://planetconfig.com/'),
  SEED: z.coerce.number().int().nonnegative().default(1234),
  SYNTHETIC_EMAIL_DOMAIN: z.string().min(1).default('yopmail.com'),
  CI: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment:', parsed.error.format());
  process.exit(2);
}

export const env = parsed.data;
