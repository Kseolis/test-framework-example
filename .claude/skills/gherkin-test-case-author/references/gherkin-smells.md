# Gherkin smells

A non-exhaustive list flagged by the reviewer.

## Structure smells

- **And-abuse**: `When ... And ... And ... And ...` — collapse to one declarative step or split scenarios.
- **Conjunction step**: `Given the user is logged in and has 3 items in cart` — split with `And`.
- **Outline-as-data-dump**: `Examples:` table with 50 rows — move to a unit/contract test.
- **Background bloat**: `Background` containing setup specific to one scenario.
- **Tag soup**: 7+ tags on a single scenario — usually a sign two scenarios are conflated.

## Language smells

- **Imperative verbs**: clicks, types, scrolls — replace with domain verbs.
- **UI selectors leaking**: `#submit`, `.btn-primary` — never in a feature file.
- **Implementation leaking**: "the database row is updated" — talk about outcomes the user observes.
- **Vague verbs**: "checks", "verifies", "ensures" — say what is observed.
- **Plural assertions**: "Then the user sees the dashboard and the welcome banner and the menu" — split.

## Scope smells

- A single scenario covering happy path + edge case + error.
- Two scenarios that differ only by environment (lift to projects/tags instead).
- Scenario outline whose logic actually differs across rows.

## Maintainability smells

- Step definitions duplicated across feature files — promote to a shared step library.
- A step that takes 6+ parameters — wrap parameters in a builder/factory call.
