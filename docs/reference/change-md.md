# `change.md` reference

Each 10x change has one identity file at `context/changes/<change-id>/change.md`. When the lifecycle is complete, the entire folder moves to `context/archive/<created-date>-<change-id>/`.

## Schema

```yaml
---
change_id: kebab-case-identifier
title: Human-readable sentence-case title
status: new
created: YYYY-MM-DD
updated: YYYY-MM-DD
archived_at: null
---
```

The frontmatter is followed by a `## Notes` section for links, seed intent, and decisions that do not belong in research or planning artifacts.

## Status lifecycle

The standard lifecycle is:

```text
new → preparing → planned → plan_reviewed → implementing → implemented → impl_reviewed → archived
```

- `new`: the change identity exists.
- `preparing`: research or framing is underway or complete.
- `planned`: an implementation plan has been written.
- `plan_reviewed`: the plan has been reviewed.
- `implementing`: plan execution has started.
- `implemented`: all planned implementation phases are complete.
- `impl_reviewed`: implementation has been reviewed against the plan.
- `archived`: the completed folder has moved under `context/archive/`.

`archived_at` remains `null` until archival, when it becomes the archive date. `created` never changes; `updated` advances whenever a lifecycle artifact changes the record.

## Intentional exclusions

Do not put research findings, implementation phases, execution checkboxes, review findings, commit SHAs, or test logs in `change.md`. Those belong in `research.md`, `plan.md`, `reviews/`, and the plan's canonical `## Progress` section.
