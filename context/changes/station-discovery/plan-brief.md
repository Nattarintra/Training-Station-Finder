# Station Discovery Improvements — Plan Brief

> Full plan: `context/changes/station-discovery/plan.md`  
> Research: `context/changes/station-discovery/research.md`

## What & Why

Make every nearby-station discovery state deterministic, demonstrable, accessible, and behaviorally tested. The route already renders the right state branches, but the mock API cannot produce empty or failed results, retry lacks visible in-flight protection, and no screen tests protect the experience.

## Starting Point

The current fixture → mock API → TanStack Query → route flow is lean and appropriate. Shared buttons and state views already provide useful accessibility primitives; this change extends those contracts rather than introducing another architecture layer.

## Desired End State

Development reviewers can select normal, empty, or error scenarios and immediately observe correct discovery behavior. Retry/refresh is visibly busy and duplicate-safe, station cards tolerate constrained layouts, and automated tests protect every discovery branch and interaction.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Scenario access | Development-only controls | Makes states demonstrable without weakening production presentation | Plan |
| Retry UX | Keep context with busy button | Reuses accessible button behavior and avoids layout churn | Plan |
| Responsive scope | Adaptive card heading | Addresses the concrete narrow-screen risk without redesigning the app | Plan |
| Test boundary | Discovery behavior only | Preserves one-feature-per-change lifecycle | Plan |
| Architecture | Extend mock API boundary | Empty and error are simulated server outcomes | Research |
| List rendering | Keep current small list | Three mock stations do not justify virtualization | Research |

## Scope

**In scope:**

- Resettable success, empty, and error station-list scenarios
- Development-only scenario selector
- Busy/disabled retry and refresh behavior
- Adaptive station-card heading layout
- Home route and station-card behavior tests
- Coverage, CI formatting, and README alignment

**Out of scope:**

- Device location, maps, real backend, or persistence
- Station detail and reservation changes
- Random failure simulation
- Virtualized lists or application-wide accessibility redesign

## Architecture / Approach

The mock API owns a deterministic station-list scenario. The home route composes a `__DEV__`-guarded selector, refetches when selection changes, preserves failed-query context through a route-local retry guard, and uses query fetching state for empty refresh. Tests mock the feature hook and Router at public boundaries while API tests verify scenario behavior independently.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Deterministic scenarios | Mock outcomes and development selector | Demo behavior leaking into production |
| 2. Resilient UI | Busy retry/refresh and adaptive cards | Accessibility or layout regression |
| 3. Coverage and docs | Route/card tests and quality alignment | Brittle mocks or inaccurate documentation |

**Prerequisites:** Existing Expo SDK 54 app and passing baseline quality commands.  
**Estimated effort:** One focused implementation session across three checkpointed phases.

## Open Risks & Assumptions

- `__DEV__` prevents the scenario selector from rendering in production; static module exclusion is not required.
- Route tests can mock Expo Router and station hooks without requiring a full Router integration harness.
- Manual VoiceOver/TalkBack validation depends on available simulator or device support.

## Success Criteria Summary

- Reviewers can deliberately demonstrate loading, empty, error/retry, and successful station discovery in development.
- Retry and refresh visibly prevent duplicate attempts, and cards remain readable under constrained layouts.
- Discovery tests, repository quality checks, dependency validation, and static export all pass.
