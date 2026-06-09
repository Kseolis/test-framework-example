# Builder vs Factory in test data

| Aspect   | Factory (Fishery)                          | Builder (manual)                                   |
| -------- | ------------------------------------------ | -------------------------------------------------- |
| Purpose  | Produce realistic, valid instances quickly | Step-by-step construction with explicit invariants |
| When     | 90% of test data needs                     | Complex aggregates, multi-step lifecycles          |
| API      | `factory.build(overrides)`                 | `new XBuilder().withY(...).build()`                |
| Drawback | Easy to over-customise via overrides       | Verbose; requires more code                        |

## Rule of thumb

Use a **factory** by default. Switch to a **builder** only when:

- The aggregate has more than ~7 mutable fields and many tests configure 3+ at a time.
- There are multiple incompatible "states" (e.g. `Order` in `draft`, `submitted`, `paid`, `cancelled`) and conditional invariants.
- You want to leverage a fluent DSL for readability in spec files.

## Hybrid pattern

Wrap a factory in a thin builder when call-site readability suffers:

```ts
class OrderScenario {
  private overrides: Partial<Order> = {};

  withUser(user: User) {
    this.overrides.userId = user.id;
    return this;
  }
  withItems(n: number) {
    this.overrides.items = itemFactory.buildList(n);
    return this;
  }
  paid() {
    this.overrides.status = 'paid';
    return this;
  }

  build() {
    return orderFactory.build(this.overrides);
  }
}
```

Builders compose; factories provide defaults. Together they keep specs DAMP and readable.
