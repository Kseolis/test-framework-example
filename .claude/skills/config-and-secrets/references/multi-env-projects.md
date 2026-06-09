# Multi-environment via Playwright projects

## Pattern

A single `playwright.config.ts` declares all environments. Run a specific one with `--project=staging-chromium`.

```ts
const baseUseFor = (env: 'local' | 'staging' | 'prod') => ({
  baseURL: {
    local: 'http://localhost:3000',
    staging: 'https://staging.example.com',
    prod: 'https://example.com',
  }[env],
});

export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'local-chromium',
      use: { ...devices['Desktop Chrome'], ...baseUseFor('local') },
      dependencies: ['setup'],
    },
    {
      name: 'staging-chromium',
      use: { ...devices['Desktop Chrome'], ...baseUseFor('staging') },
      dependencies: ['setup'],
    },
    {
      name: 'prod-smoke',
      use: { ...devices['Desktop Chrome'], ...baseUseFor('prod') },
      grep: /@smoke/,
    },
  ],
});
```

## Secrets per env

`.env` files layered by `dotenv-flow`:

- `.env` — committed defaults (no secrets)
- `.env.local` — local-only (gitignored)
- `.env.staging` — pulled via `load-secrets.sh`
- `.env.production` — pulled via `load-secrets.sh`, never written to disk in CI; injected directly

## Tagging strategy

- `@smoke` — runs against every env, including prod
- `@regression`— runs against staging
- `@dangerous` — never runs against prod (a CI gate enforces this)

Prefer `grep:`/`grepInvert:` in projects over `test.skip()` to avoid 1000 skipped lines in reports.
