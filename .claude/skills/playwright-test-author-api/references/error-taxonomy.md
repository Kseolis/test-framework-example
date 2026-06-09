# Error response taxonomy

A consistent error envelope makes contract tests trivial. The skill assumes the following shape (RFC 7807-flavoured):

```jsonc
{
  "code": "validation_error", // machine-readable, snake_case
  "message": "Items must not be empty.",
  "fields": ["items"], // optional, present for 4xx field errors
  "traceId": "...", // for cross-system debugging
}
```

## Canonical buckets

| Status | code namespace     | When                                    |
| ------ | ------------------ | --------------------------------------- |
| 400    | `bad_request`      | Malformed JSON, missing required header |
| 401    | `unauthenticated`  | No / invalid token                      |
| 403    | `forbidden`        | Token valid but role insufficient       |
| 404    | `not_found`        | Resource missing                        |
| 409    | `conflict`         | Duplicate, idempotency mismatch         |
| 422    | `validation_error` | Field-level violations                  |
| 429    | `rate_limited`     | Throttling hit                          |
| 500    | `internal_error`   | Server fault — should be rare           |

## Test rules

- Never assert on `message` string verbatim — copy changes constantly. Assert on `code`.
- Always assert on `fields` array for 422.
- Always check that `traceId` is non-empty (helps support).
- Reject 5xx outright in the test — if a 5xx is expected, the AC is broken.
