# Test heuristics cheatsheet

A mental Rolodex to find ideas you'd otherwise miss. Walk through each list when designing tests for a non-trivial feature.

## Quality attributes (CRUSSPIC STMPL — Bach)

- **C**apability — does it do what's claimed?
- **R**eliability — does it keep doing it?
- **U**sability — can a human use it without help?
- **S**ecurity — does it protect data and access?
- **S**calability — does it hold under load?
- **P**erformance — fast enough?
- **I**nstallability — can it be deployed?
- **C**ompatibility — does it work with surrounding systems?
- **S**upportability, **T**estability, **M**aintainability, **P**ortability, **L**ocalisability.

## Risk dimensions (RIMGEA)

- **R**ecognise — is the risk visible at all?
- **I**nvestigate — what evidence reveals it?
- **M**inimise — how can the system contain it?
- **G**eneralise — where else could it hide?
- **E**scalate — who must know if it's real?
- **A**nticipate — what could trigger it next sprint?

## Test design techniques

| Technique                | Use when                                          |
| ------------------------ | ------------------------------------------------- |
| Equivalence partitioning | Inputs fall into groups treated identically       |
| Boundary value analysis  | Numeric / length thresholds                       |
| Decision table           | ≥2 conditions producing different outcomes        |
| State transition         | UI/entity has explicit states + transitions       |
| Pairwise (orthogonal)    | ≥3 categorical inputs; full matrix is impractical |
| Cause-effect graph       | Many inputs map to many outputs with overlap      |
| Error guessing           | Experience-driven; combine with all of the above  |
| Exploratory charters     | Risk too poorly defined for scripts               |

## Heuristic prompts (ask while reading the story)

- "What if the input is empty / max / one above max / exactly at boundary?"
- "What if the action is repeated quickly?"
- "What if the user has slow network / no network / 401 mid-flow?"
- "What if a different role attempts this?"
- "What if the upstream service returns a partial / malformed response?"
- "What if currency / locale / timezone / RTL?"
- "What if the data was created in a previous version?"
