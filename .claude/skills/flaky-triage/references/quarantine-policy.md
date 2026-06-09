# Quarantine policy

Quarantine is a last resort, not a coping mechanism.

## Tag

```ts
test('quarantine candidate @quarantine #PROJ-1234', async ({}) => {
  /* ... */
});
```

## Rules

1. Every `@quarantine` MUST have an open issue link in the title or annotation.
2. CI runs quarantined tests but does NOT fail the build on them. Failures are reported separately.
3. Maximum age: **2 sprints**. After that, the test is either fixed or deleted.
4. Quarantine cap per repo: **2%** of total tests. If exceeded, all engineering work pauses on new features until under cap.

## Enforcement

`scripts/check-quarantine-age.sh` runs in CI:

- Greps for `@quarantine` tags.
- Cross-references with the issue tracker via `GH_TOKEN` and the issue id parsed from the title.
- Fails the build if any quarantined test is older than 2 sprints (configurable in days).

## Ownership

A quarantined test has an owner (the SDET who tagged it). The owner gets a weekly reminder until the test is removed from quarantine or the team explicitly accepts the cost.

## Anti-pattern

`test.describe.skip(...)` mass-disabling — the worst version of quarantine because it disappears from reports. Prefer the tag.
