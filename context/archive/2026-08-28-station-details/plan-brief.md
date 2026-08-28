# Station Details Improvements — Plan Brief

> Full plan: `context/changes/station-details/plan.md`
> Research: `context/changes/station-details/research.md`

## What & Why

Station details currently shows useful station metadata and slot rows, but selecting a slot immediately navigates and gives every selectable slot the same action label. This plan makes selection explicit, improves availability/status communication, and keeps the user’s view current after reservation conflicts.

## Starting Point

`app/station/[id].tsx` already owns loading/error/empty/success rendering and uses the existing `TimeSlot` model, shared UI primitives, and detail query. The reservation flow already detects stale slots with a typed conflict error, but returning to details does not explicitly refresh the query.

## Desired End State

Users see one clear chronological list with available, limited, selected, and full states. They select one slot, receive visual and screen-reader confirmation, and use Continue to open the existing reservation form. Returning from reservation refreshes detail availability.

## Key Decisions Made

| Decision              | Choice                                          | Why                                                                      | Source          |
| --------------------- | ----------------------------------------------- | ------------------------------------------------------------------------ | --------------- |
| Selection flow        | Explicit selection + Continue                   | Gives users a persistent, reviewable choice before reservation.          | Plan            |
| Slot organization     | One chronological list                          | Preserves the current scan path and limits scope.                        | Plan            |
| Conflict refresh      | Refetch on detail focus                         | Updates availability after back navigation with minimal coupling.        | Research / Plan |
| Accessibility         | Full contextual semantics                       | Makes date/time/status and selected state clear to assistive technology. | Plan            |
| Data model            | Keep existing `TimeSlot` contract               | Existing fields already support all required presentation states.        | Research        |
| Automated tests       | Detail integration + focused component coverage | Protects route, navigation, semantics, and lifecycle behavior.           | Plan            |
| No-selection behavior | Continue disabled                               | Prevents invalid navigation and makes the required step explicit.        | Plan            |

## Scope

**In scope:**

- Local selected-slot state and disabled-until-selected Continue action.
- Clear status styling and contextual accessibility labels.
- Flexible slot layout for narrow screens and larger text.
- Refetch on detail focus after reservation return.
- Detail-route tests, regression coverage, and Expo 54 quality gates.

**Out of scope:**

- Data-model/API changes, maps, location, filtering, date grouping, or new dependencies.
- Changes to reservation form, booking, or check-in behavior.
- Global state or end-to-end test infrastructure.

## Architecture / Approach

Keep selection local to the detail route and continue using the existing flow:

`useStation(id)` → detail screen → local selected slot → Continue → `/reserve` → focus refetch on return

The reservation API remains authoritative for final availability.

## Phases at a Glance

| Phase                         | What it delivers                                                       | Key risk                                                 |
| ----------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------- |
| 1. Selection and presentation | Explicit selection, status hierarchy, accessibility, responsive layout | Interaction changes must remain obvious and testable.    |
| 2. Return freshness           | Detail refetch after reservation navigation/conflict                   | Avoiding focus refetch loops or stale query assumptions. |
| 3. Coverage and validation    | Route tests, quality gates, and documentation alignment                | Expo/router test mocks must stay at public boundaries.   |

**Prerequisites:** Existing `station-details` research and Expo SDK 54 project setup.  
**Estimated effort:** ~2–3 implementation sessions across 3 phases.

## Open Risks & Assumptions

- The current Expo Router/React Navigation lifecycle exposes a stable focus hook usable from the detail route.
- Visual status colors must continue to meet the project’s existing contrast expectations.
- Manual screen-reader and compact-layout checks remain necessary because Jest cannot validate native rendering fully.

## Success Criteria (Summary)

- Users can select, change, and confirm a slot with clear visual and accessibility feedback.
- Full slots stay disabled, Continue cannot run without a selection, and reservation route params remain correct.
- Returning from a stale-slot conflict refreshes availability, with all tests, type checks, lint, formatting, and Expo validation passing.
