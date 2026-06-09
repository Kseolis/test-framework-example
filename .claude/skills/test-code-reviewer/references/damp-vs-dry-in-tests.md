# DAMP vs DRY in tests

## TL;DR

- **Production code**: DRY. Repetition is a maintenance liability.
- **Test code**: DAMP — Descriptive And Meaningful Phrases. Some repetition is acceptable when it makes the test readable in isolation.

## Why

A test fails at 03:00. The on-call engineer reads it. They have ~30 seconds to grasp:

- what was set up,
- what was done,
- what was expected.

If the test is layered behind 4 helpers, 2 inheritance levels, and a magic fixture, that reading takes 15 minutes. DAMP makes the reading instant.

## Rules of thumb

| Situation                                    | Prefer                              |
| -------------------------------------------- | ----------------------------------- |
| Same setup repeated in 5 tests of one file   | Background / `beforeEach` / fixture |
| Same setup repeated in 5 tests across files  | Fixture                             |
| Same locators in two pages                   | Component object                    |
| Same data shape with minor differences       | Factory + overrides                 |
| Same one-line action repeated                | Inline — DRY does not pay           |
| Same multi-step flow used in dozens of tests | Page-object method or step library  |

## Where DRY hurts tests

- `function expectLoggedIn(page)` that wraps three matchers — the abstraction hides what's actually checked.
- `function clickEverything()` — a god-helper that conceals state changes.
- "Test framework" growing inside `tests/utils/` until it has its own bugs.

## Litmus test

> "If I delete this helper, would the test become longer but more obvious?"

If the answer is yes, the helper is removing valuable signal. Inline it.
