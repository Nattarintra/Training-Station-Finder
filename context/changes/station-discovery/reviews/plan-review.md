<!-- PLAN-REVIEW-REPORT -->

# Plan Review: Station Discovery Improvements Implementation Plan

- **Plan**: `context/changes/station-discovery/plan.md`
- **Mode**: Deep
- **Date**: 2026-08-28
- **Verdict**: SOUND
- **Findings**: 1 critical, 2 warnings, 0 observations

## Verdicts

| Dimension             | Verdict |
| --------------------- | ------- |
| End-State Alignment   | PASS    |
| Lean Execution        | PASS    |
| Architectural Fitness | PASS    |
| Blind Spots           | PASS    |
| Plan Completeness     | PASS    |

## Grounding

Grounding: 8/8 existing paths ✓, 5/5 existing symbols ✓, 2 planned-new paths identified ✓, Progress↔Phase contract ✓, brief↔plan ✓

## Findings

### F1 — Error retry loses the promised error context

- **Severity**: ❌ CRITICAL
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: End-State Alignment
- **Location**: Phase 2 — Retry and refresh progress
- **Detail**: The route evaluates `isPending` before `isError` (`app/index.tsx:42-50`). TanStack Query v5 returns a data-less failed query to pending status when refetch begins, so the error `StateView` and its proposed busy action disappear behind the initial loading view. Empty refresh retains data and can show its action. The current contract therefore cannot achieve the selected “keep message and show busy button” behavior.
- **Fix A ⭐ Recommended**: Add a route-local retry-in-progress guard that preserves the last error presentation while awaiting refetch, drives the button's busy state, and blocks duplicate handler entry synchronously.
  - Strength: Delivers the explicitly selected UX without changing global query behavior and keeps the change local to discovery.
  - Tradeoff: Adds a small piece of UI state alongside TanStack Query state.
  - Confidence: HIGH — Query v5 source confirms the pending transition and the route owns presentation state.
  - Blind spot: The local guard must clear in a `finally` path for both successful and failed retries.
- **Fix B**: Accept replacement by the initial loading state during error retry and keep busy action behavior only for empty refresh.
  - Strength: Uses TanStack Query state directly with less route state.
  - Tradeoff: Reverses the user's selected retry experience and removes error context during recovery.
  - Confidence: HIGH — this is current Query v5 behavior.
  - Blind spot: Layout movement may be more noticeable on small screens.
- **Decision**: FIXED via Fix A — route-local retry guard with preserved error context and `finally` cleanup

### F2 — `__DEV__` does not prove module removal from production bundles

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details, Phase 1, Performance Considerations
- **Detail**: A static import remains in Metro's dependency graph even when rendering is guarded by `__DEV__`. The plan can reliably promise that controls are absent from production UI/export, but not that the selector module is removed from the bundle or has literally zero bundle cost without bundle analysis or conditional loading.
- **Fix**: Reword the plan and verification contract to require that development controls are not rendered or present in production UI/export; remove unsupported module-exclusion and zero-cost claims.
- **Decision**: FIXED — production contract narrowed to rendered UI absence

### F3 — Typed discovery error contract is incomplete

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 1 — Mock station-list scenarios
- **Detail**: The plan promises a typed station-list failure, but `ApiError.code` is a closed union that does not include a discovery failure code (`src/api/mockApi.ts:4-8`). The implementer would have to invent the contract.
- **Fix**: Name `STATIONS_UNAVAILABLE` as the new `ApiError.code` member and require the error scenario to reject with that typed code.
- **Decision**: FIXED — added explicit `STATIONS_UNAVAILABLE` contract
