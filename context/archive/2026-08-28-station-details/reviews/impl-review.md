<!-- IMPL-REVIEW-REPORT -->

# Implementation Review: Station Details Improvements

- **Plan**: `context/changes/station-details/plan.md`
- **Scope**: Phases 1–3 of 3
- **Date**: 2026-08-28
- **Verdict**: NEEDS ATTENTION
- **Findings**: 0 critical, 3 warnings, 1 observation

## Verdicts

| Dimension           | Verdict |
| ------------------- | ------- |
| Plan Adherence      | WARNING |
| Scope Discipline    | WARNING |
| Safety & Quality    | WARNING |
| Architecture        | PASS    |
| Pattern Consistency | PASS    |
| Success Criteria    | WARNING |

## Verification

- `npm test -- --runInBand` — PASS (6 suites, 27 tests).
- `npm run typecheck` — PASS.
- `npm run lint` — PASS.
- Station-details scoped Prettier check — PASS.
- `npm run format:check` — WARNING: one unrelated pre-existing file remains unformatted: `context/changes/station-discovery/reviews/impl-review.md`.
- `npx expo install --check` — PASS using the local Expo SDK 54 dependency map; network access was unavailable.
- `npx expo export --platform web --output-dir /tmp/training-station-finder-web-review` — PASS; 7 static routes exported.

## Findings

### F1 — Detail route branch coverage is incomplete

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence / Success Criteria
- **Location**: `__tests__/StationDetailScreen.test.tsx:50-118`
- **Detail**: The plan’s Phase 3 test contract calls for pending, error/retry, metadata/amenities, and no-slots coverage in addition to slot selection/status/navigation. Current tests cover selection, full/limited copy, Back, Continue, and focus refetch, but not those route branches even though they exist at `app/station/[id].tsx:106-123` and `:150-167`.
- **Fix**: Add focused route tests for loading, error/retry, station metadata/amenities, and empty slots.
  - **Strength**: Aligns the test suite with the explicit Phase 3 contract and protects existing user-visible branches.
  - **Tradeoff**: Adds a small amount of mock setup and maintenance.
  - **Confidence**: HIGH — the route already exposes stable public boundaries for these states.
  - **Blind spot**: Native visual layout remains outside Jest’s coverage.
- **Decision**: PENDING

### F2 — Capacity persistence is not represented in the approved plan

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: `src/api/mockApi.ts:15-39,65-85`
- **Detail**: Successful reservations now decrement capacity, transition slots to full, and reject further bookings. This was a valid user-requested follow-up, but it was added after the written Phase 3 Changes Required section and is not described as an implementation addendum.
- **Fix**: Add a short plan addendum documenting reserved-place bookkeeping, zero clamping, and the regression test.
- **Decision**: PENDING

### F3 — Zero-capacity UI relies on an implicit API invariant

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `app/station/[id].tsx:24,61-63,95-104`
- **Detail**: The UI derives `unavailable` only from `slot.availability === 'unavailable'`. If an inconsistent response reports `placesLeft <= 0` with `available` or `limited`, the Select button could remain enabled and show zero capacity. The current mock API normalizes this, but the screen can defensively enforce the same invariant.
- **Fix**: Derive unavailable from the availability value or `placesLeft <= 0`, reuse that predicate for selected-state cleanup, and add an inconsistent zero-capacity regression test.
- **Decision**: PENDING

### F4 — Explicit Back button is an undocumented scope addition

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: `app/station/[id].tsx:128-135`
- **Detail**: The Back button was added in response to manual user feedback and is harmless/user-authorized, but it was not present in the original plan’s Changes Required sections.
- **Fix**: Add a short plan addendum documenting the accessible Back control, or leave as an explicitly accepted user-requested adjustment.
- **Decision**: PENDING

## Summary

No critical security, data-loss, performance, resource-leak, or architecture violations were found. The implementation follows the existing fixture → mock API → TanStack Query → Expo Router layering, preserves the reservation contract, and passes the available automated checks. The main follow-up is completing the planned branch coverage and documenting the two user-driven scope additions.
