# Composing fixtures

Compose using `base.extend<TestFixtures, WorkerFixtures>()` and split per concern. Aggregate in `tests/fixtures/index.ts`.

## Pattern

```ts
// tests/fixtures/pages.ts
import { test as base } from '@playwright/test';
import { LoginPage, DashboardPage } from '@pages';

type PageFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
};

export const pagesTest = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
});
```

```ts
// tests/fixtures/api.ts
import { test as base } from '@playwright/test';
import { OrdersClient } from '@api/clients/ordersClient';

type ApiFixtures = {
  ordersClient: OrdersClient;
};

export const apiTest = base.extend<ApiFixtures>({
  ordersClient: async ({ request }, use) => {
    await use(new OrdersClient(request));
  },
});
```

```ts
// tests/fixtures/data.ts — manages lifecycle: create + cleanup
import { test as base } from '@playwright/test';
import { userFactory } from '@factories/user.factory';

type DataFixtures = {
  seededUser: { id: string; email: string };
};

export const dataTest = base.extend<DataFixtures>({
  seededUser: async ({ ordersClient: _ }, use, testInfo) => {
    const draft = userFactory.build();
    // const user = await usersClient.create(draft);
    const user = { id: draft.id, email: draft.email };
    await use(user);
    // teardown — guaranteed even on failure
    // await usersClient.delete(user.id);
  },
});
```

```ts
// tests/fixtures/index.ts
import { mergeTests } from '@playwright/test';
import { pagesTest } from './pages';
import { apiTest } from './api';
import { dataTest } from './data';

export const test = mergeTests(pagesTest, apiTest, dataTest);
export { expect } from '@playwright/test';
```

## Rules

- Files in `fixtures/` ≤ 250 LOC.
- One concern per file (pages / api / data / mocks / auth).
- Aggregate via `mergeTests`, never manually re-extend.
- A fixture body always uses `await use(value)` — even when teardown is empty.
