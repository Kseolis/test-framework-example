import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
import { SYNTHETIC_EMAIL_DOMAIN } from './_seed';

export interface User {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

const toEmailSlug = (value: string): string =>
  value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '.')
    .replaceAll(/(^\.|\.$)/g, '');

export const userFactory = Factory.define<User>(({ sequence }) => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const localPart = `${toEmailSlug(firstName)}.${toEmailSlug(lastName)}.${sequence}`;

  return {
    email: `${localPart}@${SYNTHETIC_EMAIL_DOMAIN}`,
    password: `${faker.internet.password({ length: 16, memorable: false })}A1!`,
    firstName,
    lastName,
  };
});
