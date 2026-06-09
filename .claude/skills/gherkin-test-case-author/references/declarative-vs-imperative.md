# Declarative vs imperative Gherkin

## Imperative (avoid)

Reads like a UI script. Brittle, ages poorly, hides intent.

```gherkin
Scenario: Login
  Given I open "https://app.example.com/login"
  When I type "user@example.com" into the field with id "email"
  And I type "Pa$$w0rd" into the field with id "password"
  And I click the button with class "btn-primary"
  Then I see the text "Welcome" on the page
```

## Declarative (prefer)

Describes user intent in domain language; details live in step definitions.

```gherkin
Scenario: Authenticated user reaches the dashboard
  Given a registered user
  When the user signs in with valid credentials
  Then the dashboard is displayed
```

## How to choose verbs

- Domain verbs ("submits", "approves", "cancels") rather than UI verbs ("clicks", "types").
- Reference roles ("the user", "an admin"), not selectors.
- Talk about outcomes ("the order is rejected"), not implementation ("the API returns 422").

## Where the detail goes

- Step definitions translate intent to API/UI actions.
- Page objects encapsulate selectors.
- Factories provide data ("a registered user" → `userFactory.build()` + API seed).

## Smell triggers

| Smell                                  | Fix                                   |
| -------------------------------------- | ------------------------------------- |
| `id "..."` / `class "..."` in scenario | Move to step definition / page object |
| `wait 2 seconds`                       | Use web-first assertions inside step  |
| Multi-paragraph `Then`                 | Split scenario                        |
| Same `Given` in 5+ scenarios           | Promote to `Background` or fixture    |
