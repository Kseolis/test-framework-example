# Secret stores

Never commit secrets. Pull them at runtime from a real secret store.

## GitHub Actions

```yaml
- name: Run tests
  env:
    BASE_URL: ${{ vars.BASE_URL }}
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
  run: npx playwright test
```

## 1Password CLI (local)

```bash
# scripts/load-secrets.sh
op signin
op run --env-file=.env.staging.template -- npx playwright test --project=staging-chromium
```

`.env.staging.template`:

```
BASE_URL=https://staging.example.com
TEST_USER_EMAIL=op://Engineering/test-user/email
TEST_USER_PASSWORD=op://Engineering/test-user/password
```

## AWS Secrets Manager / Vault

```ts
// tests/infra/load-secrets.ts (worker setup project)
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
const client = new SecretsManagerClient({});
const { SecretString } = await client.send(new GetSecretValueCommand({ SecretId: 'qa/test-user' }));
process.env.TEST_USER_PASSWORD = JSON.parse(SecretString!).password;
```

## Hard rules

- `.env*` (except `.env.example` and `.env.*.template`) → `.gitignore`.
- A pre-commit hook scans staged files for `password|secret|token|apiKey|AKIA[0-9A-Z]{16}`.
- CI logs are scrubbed (`echo "::add-mask::$SECRET"` in GitHub Actions).
- No secret enters Claude Code context. Reference by env var name only.
