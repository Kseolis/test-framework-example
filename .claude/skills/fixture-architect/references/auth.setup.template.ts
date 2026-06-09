/**
 * tests/fixtures/auth.setup.ts — runs once per project (referenced by `dependencies: ['setup']`)
 * to populate tests/.auth/<role>.json. Other tests load this file via storageState in playwright.config.ts.
 *
 * Why this pattern:
 *  - One UI/API login per worker, not per test. ~10x perf for E2E suites.
 *  - storageState is a pure JSON snapshot — safe to share read-only across workers.
 *  - Failures in setup mark the whole project as broken instead of producing 1000 cryptic test fails.
 */
import { test as setup, expect } from '@playwright/test';
import path from 'node:path';

const userAuthFile = path.join(__dirname, '../.auth/user.json');
const adminAuthFile = path.join(__dirname, '../.auth/admin.json');

setup('authenticate as user', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
  await page.context().storageState({ path: userAuthFile });
});

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.TEST_ADMIN_EMAIL!);
  await page.getByLabel('Password').fill(process.env.TEST_ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('navigation', { name: /admin/i })).toBeVisible();
  await page.context().storageState({ path: adminAuthFile });
});
