import { faker } from '@faker-js/faker';
import { env } from '@infra/env';

faker.seed(env.SEED);

export const FAKER_SEED = env.SEED;
export const SYNTHETIC_EMAIL_DOMAIN = env.SYNTHETIC_EMAIL_DOMAIN;
