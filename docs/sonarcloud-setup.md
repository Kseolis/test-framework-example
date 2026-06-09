# SonarCloud Setup Guide

This guide walks you through onboarding the `free-vpn-planet-test` repository to **SonarCloud** so that quality gates, code-smell counts, and duplication metrics show up as the badges in the project README.

> SonarCloud is **free for public repositories**. The setup below assumes the repo is public on GitHub. If it's private, switch to the paid plan or use a self-hosted SonarQube instance with the same `sonar-project.properties`.

---

## Prerequisites

- A GitHub account that owns (or has admin on) `Kseolis/free-vpn-planet-test`.
- The repo pushed to GitHub at least once (so the default branch is visible).
- `sonar-project.properties` already committed at the repo root (✅ done in this branch).
- `.github/workflows/tests.yml` already includes a Sonar-scan job (see step 5 below).

---

## Step 1 — Sign in to SonarCloud and import the organization

1. Open [https://sonarcloud.io/](https://sonarcloud.io/) and click **Log in → With GitHub**.
2. Authorize the SonarCloud GitHub App when prompted.
3. On the SonarCloud dashboard, click **+ → Analyze new project**.
4. Choose **Import an organization from GitHub** if `Kseolis` isn't yet on SonarCloud, otherwise select the existing `kseolis` organization.
5. Pick the **Free** plan when offered (sufficient for public repos).

The organization key on SonarCloud will be `kseolis` (lowercase) — it must match `sonar.organization` in `sonar-project.properties`.

---

## Step 2 — Create the project

1. From the organization page, click **Add project → GitHub** → select `free-vpn-planet-test`.
2. SonarCloud proposes a project key. **Override it to `Kseolis_free-vpn-planet-test`** so it matches the value already committed in `sonar-project.properties`.
3. Choose **GitHub Actions** as the analysis method.
4. SonarCloud generates a `SONAR_TOKEN`. **Copy it** — you'll need it for the GitHub secret in step 4.

---

## Step 3 — Configure the new-code definition

1. On the project page, go to **Administration → New Code**.
2. Set the new-code period to **Previous version** (recommended for a CI-driven project) or **30 days** (recommended for a slow-moving one).
3. Save.

This determines what the **Quality Gate** evaluates against.

---

## Step 4 — Add the `SONAR_TOKEN` secret to GitHub

1. In GitHub, navigate to `Settings → Secrets and variables → Actions → New repository secret`.
2. Name: `SONAR_TOKEN`.
3. Value: the token you copied in step 2.
4. Save.

The default `GITHUB_TOKEN` is provided by GitHub Actions automatically and does not need to be added.

---

## Step 5 — Confirm the Sonar job in CI

`.github/workflows/tests.yml` already contains a `sonar` job that runs after the test matrix. Skim it to confirm:

```yaml
sonar:
  name: SonarCloud
  needs: test
  runs-on: ubuntu-latest
  if: ${{ github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository }}
  steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0 # full history; required by Sonar for blame
    - uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: npm
    - name: Download Playwright JUnit XML
      uses: actions/download-artifact@v4
      with:
        pattern: playwright-report-*
        path: playwright-report-merged
        merge-multiple: true
    - name: Move junit.xml into the path Sonar expects
      run: |
        mkdir -p playwright-report
        find playwright-report-merged -name 'junit.xml' -print -exec cp {} playwright-report/junit.xml \; -quit
    - name: SonarCloud Scan
      uses: SonarSource/sonarqube-scan-action@v3
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

The job:

1. Waits for all three browser jobs to complete (`needs: test`).
2. Skips on **forked-PR** runs (those don't have access to `SONAR_TOKEN`, and SonarCloud rejects the scan anyway).
3. Pulls the JUnit XML produced by Playwright and places it where `sonar-project.properties` expects.
4. Runs the official SonarSource scanner action.

---

## Step 6 — Trigger the first scan

1. Push any commit to `main`, or open a PR. The workflow runs automatically.
2. Once it succeeds, go to the SonarCloud project page — the dashboard populates within ~30 seconds.
3. From the project page, copy the badge URLs and uncomment the badge block in `README.md` (lines marked "Optional SonarCloud badges"). Replace nothing else — the project key already matches.

---

## Step 7 — Quality Gate hardening (recommended)

By default SonarCloud uses the **Sonar way** quality gate (no new bugs, no new vulnerabilities, ≤ 3% duplications, etc.). For an E2E test repo this is overkill on coverage but still useful on:

- **Bugs** (`> 0`) — fail the PR
- **Vulnerabilities** (`> 0`) — fail the PR
- **Code Smells** on new code (`> 5`) — warn

Recommended override: **Administration → Quality Gates → Copy "Sonar way" → "Test-suite way"**, then **disable** the line-coverage and condition-coverage gates (we don't have unit-test coverage on E2E code), and apply to this project.

---

## Troubleshooting

| Symptom                                 | Likely cause                                                          | Fix                                                                                                                                     |
| --------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `Project key not found`                 | `sonar.projectKey` in properties doesn't match the SonarCloud project | edit `sonar-project.properties` to match                                                                                                |
| `You're not authorized to run analysis` | `SONAR_TOKEN` missing or expired                                      | re-issue token in SonarCloud → My Account → Security → Tokens                                                                           |
| Coverage shown as 0%                    | Sonar expects an LCov file                                            | leave `sonar.javascript.lcov.reportPaths` empty (default in this repo) — coverage simply won't appear, which is honest for an E2E suite |
| `junit.xml not found`                   | one of the matrix jobs failed before producing artefacts              | the `sonar` job will skip its scan; rerun after fixing the test failure                                                                 |
| PR from a fork shows no Sonar comment   | secrets are blocked on forked PRs                                     | use the `pull_request_target` event with stricter checkout, or accept the limitation                                                    |

---

## Local-only scan (optional)

To run SonarScanner locally before pushing:

```bash
# Install once
brew install sonar-scanner   # macOS
# or download from https://docs.sonarcloud.io/advanced-setup/ci-based-analysis/sonarscanner-cli/

# Run
SONAR_TOKEN=<your-token> sonar-scanner
```

The scan uses `sonar-project.properties` from the repo root.
