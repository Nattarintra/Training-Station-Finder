# Station Discovery Improvements Implementation Plan

## Overview

Make station discovery's loading, error/retry, empty, and success behavior deterministic, demonstrable, accessible, and covered by behavior-level tests. Preserve the existing fixture → mock API → TanStack Query → route architecture and avoid introducing production backend, location, or state-management complexity.

## Current State Analysis

The home route already branches cleanly over pending, error, empty, and successful query results (`app/index.tsx:42-68`). Shared controls provide appropriate touch targets, busy/disabled semantics, and live-region announcements (`src/components/Button.tsx:28-39`, `src/components/StateView.tsx:21-31`). Station cards expose useful composite accessibility labels (`src/features/stations/StationCard.tsx:18-24`).

The mock API always returns three stations after a delay (`src/api/mockApi.ts:15-20`), so error and empty UI cannot be demonstrated. Retry calls `refetch` without binding query progress to the action (`app/index.tsx:44-57`). The only discovery test verifies API sorting (`__tests__/mockApi.test.ts:12-16`); no route-level tests protect rendering, retry, refresh, navigation, or card accessibility.

## Desired End State

In development builds, a reviewer can deliberately select success, empty, or error station-list scenarios and observe deterministic UI behavior. Retry and refresh clearly communicate in-flight work and cannot be submitted repeatedly. Station cards remain readable on narrow screens and with larger text. Automated tests protect every discovery branch, primary interactions, and card semantics.

### Key Discoveries

- `getStations` is the correct scenario boundary because it already represents the simulated server (`src/api/mockApi.ts:15-20`).
- `Button` already owns loading, disabled, busy, and duplicate-press behavior, so the route only needs to supply query state (`src/components/Button.tsx:16-39`).
- The current test suite has no rendered discovery coverage despite README state-handling claims (`README.md:15`, `__tests__/mockApi.test.ts:12-16`).
- List virtualization is unnecessary for the current three-station mock dataset; the existing responsive screen container is sufficient (`src/components/Screen.tsx:16-35`).

## What We're NOT Doing

- Adding device location, permissions, maps, geospatial distance calculation, or location persistence.
- Changing station details, slot selection, reservation, confirmation, or check-in behavior.
- Adding random failures or environment variables.
- Adding a repository layer, global client store, backend, database, or new dependency.
- Replacing the small station list with a virtualized list.
- Performing a full application-wide Dynamic Type redesign.

## Implementation Approach

Extend the existing mock API with a small resettable station-list scenario contract whose default remains successful production-like behavior. Expose that contract through a development-only control composed by the home route. Scenario changes invalidate/refetch the existing station query. Preserve error context with a route-local retry guard, bind fetching state to empty refresh, adapt card heading layout under constrained width, and test route behavior by mocking the station query hook and Expo Router at stable public boundaries.

## Critical Implementation Details

The scenario control must not render in production and must be guarded through a static `__DEV__` branch, not merely hidden with runtime styling. Scenario changes must reset cleanly between tests so test order cannot leak state. The default API contract must remain unchanged for all existing consumers. TanStack Query returns a data-less failed query to pending status during refetch, so error retry presentation must be preserved by route-local state rather than inferred from `isError` alone.

## Phase 1: Deterministic Discovery Scenarios

### Overview

Create a minimal mock-server scenario capability and a development-only selector that lets reviewers deliberately reach success, empty, and error states.

### Changes Required

#### 1. Mock station-list scenarios

**File**: `src/api/mockApi.ts`

**Intent**: Add deterministic scenario behavior to the station-list endpoint while keeping normal successful sorting as the default. Provide an explicit reset for isolation and preserve typed, user-safe failures.

**Contract**: Export a `StationListScenario` union for `success | empty | error`, a setter used by development/test callers, and reset behavior that restores `success`. Extend `ApiError.code` with `STATIONS_UNAVAILABLE`; the error scenario rejects with that code, while `getStations()` otherwise returns sorted data or an empty array. Reservation state reset must continue to work.

#### 2. Development scenario selector

**File**: `src/features/stations/StationScenarioControl.tsx`

**Intent**: Give portfolio reviewers a compact, clearly labeled way to select a discovery response during development without making the production experience look like a demo harness.

**Contract**: Render accessible touch controls for normal, empty, and error outcomes and report selection through a typed callback. Use existing tokens and minimum touch-target conventions. The component itself remains reusable and unaware of TanStack Query.

#### 3. Home-screen scenario integration

**File**: `app/index.tsx`

**Intent**: Compose the selector only in development, update the mock scenario, and refetch discovery so the selected state appears immediately.

**Contract**: Guard the entire selector rendering branch with `__DEV__`. Scenario changes must trigger a station-list refetch through the existing query result and must not alter normal navigation or the production success path. The production guarantee is that controls and copy are not rendered; static module exclusion is not assumed.

### Success Criteria

#### Automated Verification

- Mock API tests prove success sorting, deterministic empty results, deterministic typed errors, and reset isolation: `npm test -- __tests__/mockApi.test.ts`
- Strict types pass after adding the scenario contract: `npm run typecheck`
- Lint passes for the new API and component: `npm run lint`

#### Manual Verification

- In an Expo development build, selecting normal, empty, and error displays the corresponding discovery state.
- In a production-mode app/export, no scenario selector copy or controls are rendered.

**Implementation Note**: Pause after automated verification for manual confirmation before proceeding to Phase 2.

---

## Phase 2: Resilient Discovery UI

### Overview

Improve retry feedback and card adaptability while preserving current content hierarchy and accessibility.

### Changes Required

#### 1. Retry and refresh progress

**File**: `app/index.tsx`

**Intent**: Keep the current error or empty explanation visible during recovery while clearly communicating that a new request is running and preventing duplicate retry attempts.

**Contract**: Use a route-local retry-in-progress guard that is set before invoking `refetch`, blocks duplicate handler entry synchronously, preserves the last error presentation while retry runs, and clears in a `finally` path after success or failure. Error uses “Trying again…” while guarded; empty uses query fetching state and “Refreshing…”. Both actions become busy and disabled through the shared button contract.

#### 2. State action loading support

**File**: `src/components/StateView.tsx`

**Intent**: Let reusable asynchronous states opt into the existing button loading behavior instead of duplicating controls in the route.

**Contract**: Add optional action-loading state and forward it to `Button`. Existing callers remain source-compatible and unchanged by default.

#### 3. Adaptive station-card heading

**File**: `src/features/stations/StationCard.tsx`

**Intent**: Prevent long station names, localization, and larger text from crowding the distance value on narrow screens.

**Contract**: Allow the heading area to wrap or stack while retaining the consolidated accessible label, station metadata, full-card touch target, and existing visual tokens.

### Success Criteria

#### Automated Verification

- Discovery route tests prove retry and refresh become busy/disabled and invoke refetch once: `npm test -- __tests__/HomeScreen.test.tsx`
- Station card tests prove accessibility name, availability count, press handling, and constrained-layout semantics: `npm test -- __tests__/StationCard.test.tsx`
- Full type-check and lint pass: `npm run typecheck && npm run lint`

#### Manual Verification

- On a compact iOS or Android viewport, long station names and large text remain readable without overlapping the distance or chevron.
- During retry and refresh, explanatory copy remains visible and the action visibly enters a busy state.

**Implementation Note**: Pause after automated verification for manual confirmation before proceeding to Phase 3.

---

## Phase 3: Behavior Coverage and Documentation

### Overview

Complete discovery-level behavior coverage, align quality documentation, and run the repository-wide verification gate.

### Changes Required

#### 1. Home-screen behavior tests

**File**: `__tests__/HomeScreen.test.tsx`

**Intent**: Protect the user-visible discovery contract without coupling tests to TanStack Query internals.

**Contract**: Mock `useStations` and Expo Router at their public boundaries. Cover pending, error/retry with preserved context and synchronous duplicate blocking, empty/refresh, success card content/order, station navigation, and development scenario selection. Each test starts from isolated mock state.

#### 2. Station-card behavior tests

**File**: `__tests__/StationCard.test.tsx`

**Intent**: Protect the card's availability semantics and accessible interaction contract independently of the route.

**Contract**: Cover available plus limited versus unavailable slot counting, singular/plural presentation, descriptive button name, accessibility hint, and press callback.

#### 3. Coverage scope and delivery documentation

**Files**: `jest.config.js`, `.github/workflows/ci.yml`, `README.md`

**Intent**: Make route coverage visible, enforce the documented formatting check in CI, and keep test/demo documentation accurate after discovery coverage expands.

**Contract**: Include `app/**/*.{ts,tsx}` in coverage collection while excluding route layout/type-only files as needed. CI runs `npm run format:check`. README describes the development scenario selector and avoids a brittle exact test count.

### Success Criteria

#### Automated Verification

- All discovery and existing tests pass: `npm test`
- Formatting, strict TypeScript, and ESLint all pass: `npm run format:check && npm run typecheck && npm run lint`
- Expo dependency validation succeeds from the local SDK map: `npx expo install --check`
- Static web export completes without route errors: `npx expo export --platform web --output-dir /tmp/training-station-finder-web`

#### Manual Verification

- Complete the normal home → station navigation flow on one common iOS and one common Android viewport.
- Verify loading, error/retry, empty/refresh, and success announcements and controls with VoiceOver or TalkBack where available.
- Confirm the production-mode experience contains no development scenario controls.

**Implementation Note**: Pause after automated verification for final manual confirmation before implementation review.

## Testing Strategy

### Unit Tests

- Mock API scenario selection, typed failure, success ordering, and reset isolation.
- Station card availability calculation, copy, accessible name/hint, and action callback.

### Integration Tests

- Home route pending, error/retry, empty/refresh, and success rendering.
- Retry/refresh in-flight state and duplicate-press prevention.
- Success navigation with the correct station route.
- Development scenario selection and refetch integration.

### Manual Testing Steps

1. Start Expo in development and cycle through normal, empty, and error scenarios.
2. Retry from error and refresh from empty; confirm visible busy state and only one request action per tap.
3. Return to normal and open a station card.
4. Test a compact phone viewport with larger text enabled.
5. Produce a production-mode app/export and confirm demo controls are not rendered.

## Performance Considerations

The mock list remains three items and does not justify virtualization. Scenario controls are not rendered in production; their small statically imported module may remain in Metro's dependency graph. Existing 30-second query freshness and one automatic retry remain unchanged.

## Migration Notes

No data migration or compatibility layer is required. The default mock API behavior remains successful and sorted, so existing app flows and tests continue to operate unless they explicitly select another scenario.

## References

- Related research: `context/changes/station-discovery/research.md`
- Discovery route: `app/index.tsx:12-68`
- Mock station API: `src/api/mockApi.ts:15-20`
- Station card: `src/features/stations/StationCard.tsx:14-55`
- Shared loading button: `src/components/Button.tsx:16-39`
- Existing station API test: `__tests__/mockApi.test.ts:12-16`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Deterministic Discovery Scenarios

#### Automated

- [x] 1.1 Mock API scenario tests pass — c99ee93
- [x] 1.2 Strict types pass for the scenario contract — c99ee93
- [x] 1.3 Lint passes for scenario implementation — c99ee93

#### Manual

- [x] 1.4 Development scenarios display corresponding discovery states — c99ee93
- [x] 1.5 Production UI omits scenario controls — c99ee93

### Phase 2: Resilient Discovery UI

#### Automated

- [x] 2.1 Discovery retry and refresh behavior tests pass — 68fe072
- [x] 2.2 Station card accessibility and layout tests pass — 68fe072
- [x] 2.3 Full type-check and lint pass — 68fe072

#### Manual

- [x] 2.4 Compact viewport and large-text card layout remains readable — 68fe072
- [x] 2.5 Retry and refresh retain context with visible busy state — 68fe072

### Phase 3: Behavior Coverage and Documentation

#### Automated

- [x] 3.1 Full test suite passes — 4af6f1e
- [x] 3.2 Formatting, strict types, and lint pass — 4af6f1e
- [x] 3.3 Expo dependency validation succeeds — 4af6f1e
- [x] 3.4 Static web export succeeds — 4af6f1e

#### Manual

- [x] 3.5 Normal discovery navigation works on iOS and Android viewports — 4af6f1e
- [x] 3.6 Discovery states are accessible with mobile assistive technology — 4af6f1e
- [x] 3.7 Production experience contains no development controls — 4af6f1e
