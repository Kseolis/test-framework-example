import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
// import type { components } from '@api/generated/schema';

// Use OpenAPI-derived types instead of hand-written ones.
// type User = components['schemas']['User'];

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'user' | 'admin';
  createdAt: string;
}

interface UserTransient {
  admin?: boolean;
}

if (process.env.SEED) faker.seed(Number(process.env.SEED));

export const userFactory = Factory.define<User, UserTransient>(({ sequence, transientParams }) => ({
  id: `user-${sequence}`,
  email: faker.internet.email().toLowerCase(),
  fullName: faker.person.fullName(),
  role: transientParams.admin ? 'admin' : 'user',
  createdAt: faker.date.recent({ days: 30 }).toISOString(),
}));

// Usage:
//   userFactory.build()                              -> deterministic user
//   userFactory.build({ email: 'a@b.com' })          -> override fields
//   userFactory.build({}, { transient: { admin: true } })
//   userFactory.buildList(5)                         -> array
