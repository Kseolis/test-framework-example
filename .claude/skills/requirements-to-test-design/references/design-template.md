# Test design — <FEATURE_NAME>

> Source: link to PRD / Jira / RFC.
> Author: <name>, <date>.
> Status: draft / reviewed / approved.

## 1. Summary

One paragraph: what is being built and why. Capture the user value in plain language.

## 2. Risks & Quality attributes

| Attribute   | Risk | Likelihood | Impact | Priority |
| ----------- | ---- | ---------- | ------ | -------- |
| Capability  | …    | M          | H      | P0       |
| Security    | …    | L          | H      | P1       |
| Performance | …    | M          | M      | P2       |

## 3. Equivalence classes

| Input | Class          | Example | Expected                       |
| ----- | -------------- | ------- | ------------------------------ |
| email | valid          | a@b.com | accepted                       |
| email | invalid (no @) | abc.com | rejected with specific message |

## 4. Boundary values

| Field           | Boundary | Just-below | At         | Just-above   |
| --------------- | -------- | ---------- | ---------- | ------------ |
| password length | min 8    | 7 → reject | 8 → accept | 9 → accept   |
| order items     | max 100  | 99 → ok    | 100 → ok   | 101 → reject |

## 5. Decision table (if applicable)

| Condition  | C1       | C2            | C3             | C4             |
| ---------- | -------- | ------------- | -------------- | -------------- |
| Logged in  | T        | T             | F              | F              |
| Has items  | T        | F             | T              | F              |
| **Action** | checkout | redirect-cart | redirect-login | redirect-login |

## 6. State transitions (if applicable)

```
draft → submitted → approved → paid → fulfilled
           ↓
        rejected
```

| From → To         | Trigger  | Guard     |
| ----------------- | -------- | --------- |
| draft → submitted | submit() | items > 0 |

## 7. Pairwise

Use `references/pairwise-tool` (or AllPairs) when 3+ categorical inputs.

## 8. Negative & error paths

- Network 5xx mid-action.
- Concurrent edit (optimistic locking).
- Invalid token / expired session.
- Wrong role.

## 9. Out of scope

- Performance-loadtest (handled by perf team, separate plan).

## 10. Test placement

| Idea                     | Layer       | Skill to author            |
| ------------------------ | ----------- | -------------------------- |
| email regex              | unit        | dev                        |
| schema match for /signup | contract    | playwright-test-author-api |
| signup happy path        | UI          | playwright-test-author-ui  |
| concurrent edit          | integration | playwright-test-author-api |

## 11. Open questions

- AC silent on what happens for emails with `+` aliases — confirm with PM.
