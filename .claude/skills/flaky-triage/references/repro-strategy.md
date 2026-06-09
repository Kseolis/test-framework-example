# Reproducing flakes

The single most useful trick is to make the flake reliably reproducible.

## Step ladder

1. **Repeat-each**: `npx playwright test path/spec --repeat-each=20`. Catches simple races.
2. **Shuffle**: `npx playwright test --shuffle`. Catches order-dependent leaks.
3. **Workers=1 + repeat-each=20**: isolates from parallelism.
4. **Workers=4 + repeat-each=20**: surfaces parallelism issues.
5. **Slow CI sim**: `--use-args slowMo=200` and `CPU=2` (`taskset -c 0,1`) to mimic constrained CI agents.
6. **Different timezone**: `TZ=America/Los_Angeles npx playwright test`.
7. **Different locale**: `LANG=de_DE.UTF-8 LANGUAGE=de`.
8. **Throttled network**: per-context `await context.route('**', route => /* delay */)` or use Chrome DevTools throttling profile.
9. **Different browser engine**: rerun on firefox + webkit.

## Capture maximum data on first reliable repro

```bash
npx playwright test path/spec \
  --workers=1 \
  --repeat-each=20 \
  --trace=on \
  --video=on \
  --reporter=list,html,json
```

## When you cannot reproduce

Don't fight it. Quarantine, file an issue with the failing trace, and move on. Reproducible flakes get fixed; irreproducible "haunted" tests get deleted after 2 sprints — the cost of looking flaky outweighs the small probability of catching a real bug.
