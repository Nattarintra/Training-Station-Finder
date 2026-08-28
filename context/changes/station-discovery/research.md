---
date: 2026-08-28T11:42:14+02:00
researcher: Natta
git_commit: 7c474c604809520e7163e2fc981657a21e301ff6
branch: master
repository: Training-Station-Finder
topic: 'Improve nearby station discovery and its loading, empty, and retry states'
tags: [research, codebase, station-discovery, tanstack-query, accessibility, testing]
status: complete
last_updated: 2026-08-28
last_updated_by: Natta
---

# Research: Improve nearby station discovery states

**Date**: 2026-08-28T11:42:14+02:00
**Researcher**: Natta
**Git Commit**: 7c474c604809520e7163e2fc981657a21e301ff6
**Branch**: master
**Repository**: Training-Station-Finder

## Research Question

How should the existing nearby-station discovery feature improve its loading, empty, error/retry, and success behavior while preserving the application's lean architecture and accessibility?

## Summary

Station discovery already has a clean fixture → mock API → TanStack Query hook → route/component flow. The home route renders explicit pending, error/retry, empty, and success branches, while cards provide generous touch targets and useful composite accessibility labels. The main weakness is behavioral rather than structural: the mock API always succeeds with three stations, making error and empty states impossible to demonstrate, and the retry action does not expose or guard its in-flight state.

Testing is the largest confidence gap. Existing coverage proves API sorting but does not render the home route, verify state transitions, exercise retry, assert navigation, or protect card availability/accessibility semantics. The recommended scope is to keep the current layering, add deterministic station-list scenarios at the mock boundary, give retry visible busy/disabled behavior, and add focused discovery integration tests. Station detail behavior and real device location should remain separate feature changes.

## Detailed Findings

### Discovery UI and accessibility

- The home route has distinct pending, error/retry, empty/refresh, and populated branches (`app/index.tsx:42-68`). This is a strong state-oriented rendering structure and should be preserved.
- The location disclosure explicitly says results use a sample location and are sorted by distance (`app/index.tsx:35-39`), avoiding an inaccurate device-location claim.
- `StationCard` exposes one descriptive button label containing the station name, distance, and available-time count, plus a navigation hint (`src/features/stations/StationCard.tsx:18-24`). Its 116-point minimum height comfortably exceeds mobile touch-target guidance (`src/features/stations/StationCard.tsx:41-55`).
- `StateView` announces asynchronous state changes through a polite accessibility live region (`src/components/StateView.tsx:21-31`). Shared buttons expose disabled and busy accessibility state and prevent presses while unavailable (`src/components/Button.tsx:28-39`).
- `Screen` provides scrolling, bottom safe-area handling, and a 720-point content cap suitable for phones and tablets (`src/components/Screen.tsx:16-35`).
- The card's name and distance share one horizontal row (`src/features/stations/StationCard.tsx:28-32`). Long localized names or large Dynamic Type can crowd this layout; a responsive wrap/stack behavior is worth protecting during implementation.
- The list maps cards inside a `ScrollView` (`app/index.tsx:59-67`). This is acceptable for three mock stations; virtualization would be unnecessary abstraction at current scale.

### Data flow and state reachability

- Station fixtures conform to a strict model with nested slots (`src/types/domain.ts:1-20`, `src/api/fixtures.ts:10-88`). `getStations` waits 350 ms, shallow-copies the fixture array, sorts by distance, and resolves (`src/api/mockApi.ts:15-20`).
- `useStations` owns the `['stations']` query (`src/features/stations/queries.ts:5-12`). The shared query client retries once and treats data as fresh for 30 seconds (`src/providers/AppProviders.tsx:5-13`).
- Loading is naturally reachable during the cold-query delay. Empty and error rendering are not reachable because `getStations` has no rejection or empty-result path and the fixture always contains three stations (`src/api/mockApi.ts:17-20`, `src/api/fixtures.ts:10-88`).
- Error UI appears only after the global automatic retry also fails. Manual retry directly calls `refetch`, but does not bind `isFetching` or `isRefetching` to the button (`app/index.tsx:44-50`). Repeated taps therefore lack visible progress and explicit duplicate-attempt prevention even though `Button` already supports a loading state.
- Both retry and empty refresh use `refetch` (`app/index.tsx:49-57`). A deterministic scenario control at the mock API boundary would make these states demonstrable and testable without random failures.
- `getStations` returns a new outer array but shared nested station/slot objects (`src/api/mockApi.ts:17-20`). This is adequate for read-only consumers, though immutable or cloned results would better enforce the API boundary.
- Fixture timestamps call `new Date()` per slot (`src/api/fixtures.ts:3-8`). Capturing one base time would eliminate midnight/DST edge inconsistency, but this is secondary to discovery state behavior.

### Test and delivery coverage

- The only discovery-specific assertion checks three stations sorted by distance (`__tests__/mockApi.test.ts:12-16`). No test renders the home route, card, state view, or station query hook.
- The highest-value test boundary is the home route with the station hook mocked: pending, error and retry, empty and refresh, then success card rendering and navigation. This directly protects the change intent without testing TanStack Query internals.
- A focused `StationCard` test should protect the non-unavailable slot count, singular/plural copy, accessible name, and press callback (`src/features/stations/StationCard.tsx:14-38`).
- Detail-slot state tests are valuable but belong to a later `station-details` lifecycle rather than broadening this change.
- Jest currently collects coverage only from `src/**`, excluding route files (`jest.config.js:5`). Tests can still cover routes behaviorally, but reported route coverage would remain invisible unless collection expands.
- CI runs clean install, type-check, lint, and tests (`.github/workflows/ci.yml:14-24`). Formatting is documented locally but not enforced in CI.

## Code References

- `app/index.tsx:12-68` - Query consumption and all discovery rendering branches.
- `src/features/stations/StationCard.tsx:14-38` - Availability count, accessibility label, and displayed card metadata.
- `src/api/mockApi.ts:15-20` - Fixed successful station-list request and distance sort.
- `src/api/fixtures.ts:3-88` - Relative timestamp generation and three non-empty fixtures.
- `src/features/stations/queries.ts:5-19` - Station list/detail query keys and hooks.
- `src/providers/AppProviders.tsx:5-13` - Global retry and freshness defaults.
- `src/components/Button.tsx:28-39` - Busy/disabled semantics and press prevention.
- `src/components/StateView.tsx:21-31` - Polite state announcements and reusable action.
- `__tests__/mockApi.test.ts:12-16` - Existing station discovery sorting test.
- `jest.config.js:1-6` - Coverage scope excludes Expo Router screens.

## Architecture Insights

The present architecture is appropriately small: domain fixtures feed an asynchronous API-shaped module, TanStack Query represents server state, and routes compose reusable state and card components. A repository/service layer or global client-side store would add indirection without solving a current problem.

Deterministic scenario injection belongs at the mock API boundary because empty and failed responses are properties of the simulated server, not the screen. The route should remain a pure consumer of query state. Behavior-level route tests should mock the feature hook, while API tests should independently verify scenario transitions and reset behavior.

## Historical Context (from prior changes)

No prior change research or archived decisions exist. `context/changes/station-discovery/change.md` is the first active 10x change, and `context/archive/` contains no completed changes.

## Related Research

No related research artifacts exist yet.

## Open Questions

- Should non-success scenarios be accessible only to tests, or also through a development-only demo control for portfolio reviewers?
- Should the retry keep the error message visible with an in-button spinner, or replace the state content with a new loading presentation?
- Should route files be included in Jest coverage collection now, or deferred until several route-level test suites exist?
