import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
import { SYNTHETIC_EMAIL_DOMAIN } from './_seed';

export interface User {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UserTransient {
  /** Force a deliberately invalid email for negative-path tests. */
  invalidEmail?: boolean;
  /** Force a too-short password for negative-path tests (assumed min length 8 — see test designs §9). */
  weakPassword?: boolean;
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '.')
    .replaceAll(/(^\.|\.$)/g, '');

export const userFactory = Factory.define<User, UserTransient>(({ sequence, transientParams }) => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const localPart = `${slug(firstName)}.${slug(lastName)}.${sequence}`;

  const email = transientParams.invalidEmail
    ? `not-an-email-${sequence}`
    : `${localPart}@${SYNTHETIC_EMAIL_DOMAIN}`;

  const password = transientParams.weakPassword
    ? '123'
    : `${faker.internet.password({ length: 16, memorable: false })}A1!`;

  return { email, password, firstName, lastName };
});
