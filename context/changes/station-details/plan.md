# Station Details Improvements Implementation Plan

## Overview

Improve the station detail experience by making time-slot selection explicit, presenting availability more clearly, and keeping the layout and accessibility semantics robust across devices. Preserve the existing Expo Router, TanStack Query, mock API, domain model, and reservation route contracts.

## Current State Analysis

`app/station/[id].tsx` already handles station loading, errors, metadata, amenities, empty slots, and populated slots. `SlotRow` is a plain horizontal `View`; its `Select` button immediately navigates to `/reserve`, while full slots are disabled. There is no selected-slot state, selected styling, Continue action, or contextual action label.

The slot model is already sufficient: `TimeSlot` provides IDs, localized-format inputs, availability, and places left (`src/types/domain.ts:1-9`). The reservation API remains authoritative and can reject a previously selectable slot with `SLOT_UNAVAILABLE` (`src/api/mockApi.ts:45-55`). The reserve screen currently returns with `router.back()` after that conflict, without explicitly refreshing the detail query.

The app has reusable `Button`, `Screen`, `StateView`, theme tokens, and date/time formatters. Tests use React Native Testing Library and accessibility roles, but there is no detail-route or slot-row test coverage.

## Desired End State

The detail screen presents one chronological list with distinct available, limited, and full states. A user can select one selectable slot, see persistent visual and accessibility feedback, and use a disabled-until-selected Continue action to open the existing reservation form.

Every slot action has contextual date/time and availability semantics. The layout remains readable with long names, localized text, and larger text settings. When the user returns from reservation, the detail query refetches so conflict-driven availability changes are visible. Automated tests cover the route, component semantics, navigation, and focus refresh behavior.

### Key Discoveries

- Detail rendering and `SlotRow` are co-located in `app/station/[id].tsx:13-109`.
- The existing `TimeSlot` contract already models all required availability states (`src/types/domain.ts:1-9`); no data-model change is needed.
- `Button` owns minimum touch targets and disabled/busy accessibility semantics (`src/components/Button.tsx:28-41`, `src/components/Button.tsx:57-77`).
- Reservation conflicts are intentionally simulated by `createReservation` and must remain server-authoritative (`src/api/mockApi.ts:45-55`).
- Prior station-discovery work established the fixture → mock API → TanStack Query → Expo Router layering and kept detail selection out of scope (`context/changes/station-discovery/plan.md`).

## What We're NOT Doing

- Changing the `Station` or `TimeSlot` data model, fixture schema, or reservation API contract.
- Adding date grouping, filtering, sorting controls, maps, location permissions, or a new backend.
- Replacing the existing reservation form or changing booking/check-in flows.
- Introducing a global selection store or a new list/virtualization abstraction.
- Hiding full slots from the list; all slots remain visible with clear disabled status.
- Adding device-level end-to-end infrastructure beyond the current Jest/React Native Testing Library conventions.

## Implementation Approach

Keep selection state local to `StationDetailScreen`, pass selected state and selection callbacks into `SlotRow`, and reserve navigation for the Continue action. Derive visible and accessible status copy from the existing slot fields and formatters. Use flexible row layout and shared theme/button primitives. Trigger a detail refetch when the screen regains focus, while leaving final availability validation in `createReservation`.

## Critical Implementation Details

Selection must be updated before Continue is enabled, and Continue must synchronously guard against missing selection. The detail screen should refetch on route focus/return so the existing query instance refreshes after `router.back()`; do not introduce a second source of truth for slot availability. Full slots remain non-selectable, and contextual labels must include enough date/time/status information to distinguish otherwise identical actions.

## Phase 1: Explicit Selection and Slot Presentation

### Overview

Introduce local selection state and update the slot list so availability, selection, and actions are clear and accessible while preserving the current chronological ordering and domain contract.

### Changes Required:

#### 1. Detail screen selection state

**File**: `app/station/[id].tsx`

**Intent**: Let users select one available or limited slot without navigating immediately, and expose a Continue action that opens the existing reservation route only after a valid selection.

**Contract**: The screen owns a nullable selected slot ID; unavailable slots cannot select; Continue is disabled until a selectable slot is selected and passes the same `stationId`/`slotId` params currently consumed by `/reserve`.

#### 2. Slot row component semantics and status presentation

**File**: `app/station/[id].tsx`

**Intent**: Make each slot understandable at a glance and distinguish available, limited, selected, and full states using existing colors, spacing, borders, and shared button behavior.

**Contract**: `SlotRow` receives selected state and an `onSelect` callback, preserves full-slot disabling, renders a contextual accessibility label/hint containing formatted date/time and availability, and exposes selected state to assistive technology.

#### 3. Responsive slot layout

**File**: `app/station/[id].tsx`

**Intent**: Prevent date/time/capacity text and actions from colliding on narrow screens, localized strings, or larger text settings.

**Contract**: Replace fixed-width assumptions with flexible wrapping/stacking while retaining the minimum touch target and the existing chronological list.

### Success Criteria:

#### Automated Verification:

- Detail tests prove selectable slots can be selected and that selection styling/semantics update.
- Detail tests prove full slots remain disabled and cannot become selected.
- Tests prove Continue is disabled without a selection and navigates with the correct route params after selection.
- TypeScript and lint pass for the updated route.

#### Manual Verification:

- On a compact phone viewport, long station/slot text remains readable and the action remains usable.
- Selecting different available or limited slots visibly moves the selected state and leaves full slots disabled.
- A screen reader can distinguish slots by date/time/status and understands the selected state and Continue availability.

**Implementation Note**: After automated verification passes, pause for manual confirmation of selection, accessibility, and compact-layout behavior before Phase 2.

## Phase 2: Reservation Return Freshness

### Overview

Ensure the detail screen reflects current availability after leaving the reservation flow, especially when submission reports a stale-slot conflict.

### Changes Required:

#### 1. Refetch on detail focus

**File**: `app/station/[id].tsx`

**Intent**: Refresh the existing station detail query whenever the route regains focus so returning from `/reserve` cannot leave the user looking at stale availability.

**Contract**: Use the Expo/React Navigation focus lifecycle already available through the route environment; refetch the existing `useStation` query without changing its key, cache policy, or API response shape. Avoid refetch loops while the screen is continuously focused.

#### 2. Preserve conflict recovery contract

**Files**: `app/reserve.tsx`, `src/api/mockApi.ts`

**Intent**: Keep the typed `SLOT_UNAVAILABLE` error and “Choose another time” back navigation intact while ensuring the detail screen responds to the return.

**Contract**: No change to reservation input/output or conflict copy is required unless needed to make the focus-refresh testable; the route continues to pass `stationId` and `slotId` unchanged.

### Success Criteria:

#### Automated Verification:

- Tests prove the detail query refetches when the screen receives focus after navigation return.
- Tests preserve the existing reservation conflict behavior and back-navigation path.
- Full typecheck and lint pass.

#### Manual Verification:

- Attempt the fixture’s race/conflict slot, return with “Choose another time”, and confirm the detail view refreshes its availability.
- Navigate away and back without a conflict and confirm refresh does not produce duplicate navigation or visible instability.

**Implementation Note**: After automated verification passes, pause for manual confirmation of conflict recovery and normal focus-return behavior before Phase 3.

## Phase 3: Coverage, Expo Validation, and Documentation

### Overview

Add durable behavior coverage and complete repository verification using the project’s Expo SDK 54-compatible commands.

### Changes Required:

#### 1. Detail route and slot tests

**File**: `__tests__/StationDetailScreen.test.tsx` (new)

**Intent**: Protect the user-visible detail contract at the route boundary without coupling tests to TanStack Query internals.

**Contract**: Mock `useStation`, Expo Router params/router, and the focus lifecycle at public boundaries. Cover pending, error/retry, station metadata/amenities, no slots, all availability states, contextual accessibility semantics, selection switching, disabled Continue, correct Continue navigation, and focus-triggered refetch.

#### 2. Existing test updates

**Files**: `__tests__/mockApi.test.ts`, `__tests__/HomeScreen.test.tsx`, `__tests__/StationCard.test.tsx` (only if required)

**Intent**: Keep existing API, discovery, and card assertions aligned with any shared component or query-lifecycle changes.

**Contract**: Preserve current sorting, navigation, availability-count, and accessibility expectations; add only regression assertions required by changed shared behavior.

#### 3. Repository quality gates and docs

**Files**: `README.md` (only if user-facing behavior documentation needs updating), `jest.config.js` (only if route coverage is not already collected)

**Intent**: Make the new behavior discoverable and ensure route coverage and formatting remain visible to CI.

**Contract**: Do not broaden tooling or add dependencies; use existing scripts and Expo SDK 54 validation.

### Success Criteria:

#### Automated Verification:

- `npm test` passes with detail-route and existing suites.
- `npm run format:check` passes.
- `npm run typecheck` passes.
- `npm run lint` passes.
- `npx expo install --check` succeeds against the Expo 54 dependency map.
- `npx expo export --platform web --output-dir /tmp/training-station-finder-web` completes without route errors.

#### Manual Verification:

- Complete home → station → slot selection → reservation navigation on iOS and Android-sized viewports.
- Verify available, limited, full, selected, no-slot, retry, and conflict-return states with VoiceOver or TalkBack where available.
- Confirm the production-mode experience contains no unintended development-only controls.

## Testing Strategy

### Unit Tests:

- Keep mock API and domain-contract tests unchanged unless shared behavior requires a regression assertion.
- Test slot status copy, contextual labels, selected state, and disabled full-slot behavior through the detail route’s rendered boundary.

### Integration Tests:

- Mock `useStation` and Expo Router public APIs to test route rendering and Continue navigation.
- Simulate focus events to verify detail refetch after returning from reservation.
- Cover stale conflict recovery without testing TanStack Query internals or Expo implementation details.

### Manual Testing Steps:

1. Open a station with available, limited, and full slots.
2. Select each selectable slot, switch selection, and verify Continue follows the selected ID.
3. Confirm full slots cannot be selected and Continue remains disabled until a valid selection exists.
4. Test compact width, long text, larger text, and screen-reader labels.
5. Submit the fixture race slot, choose another time after the conflict, and verify refreshed availability.

## Performance Considerations

The fixture contains only a few slots, so the existing mapped view remains appropriate. Focus refetch should be limited to route re-entry and should reuse the existing detail query; no polling, virtualization, or additional dependency is needed.

## Migration Notes

No data migration or compatibility layer is required. The existing `TimeSlot` model, reservation route params, API responses, and conflict behavior remain compatible.

## References

- Related research: `context/changes/station-details/research.md`
- Detail route: `app/station/[id].tsx:13-109`
- Detail query: `src/features/stations/queries.ts:14-19`
- Reservation conflict: `src/api/mockApi.ts:45-55`
- Reservation recovery: `app/reserve.tsx:140-153`
- Shared button semantics: `src/components/Button.tsx:28-41`
- Prior architecture decision: `context/changes/station-discovery/plan.md`

## Review Addendum

- Successful reservations now decrement mock capacity, clamp `placesLeft` at zero, transition exhausted slots to unavailable, and reject further bookings; regression coverage lives in `__tests__/mockApi.test.ts`.
- An accessible Back control was added at the top of station details in response to manual user feedback (`app/station/[id].tsx:128-135`).
- Review follow-ups for missing branch coverage and defensive zero-capacity handling are tracked in `context/changes/station-details/follow-ups/review-fixes.md`.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Explicit Selection and Slot Presentation

#### Automated

- [x] 1.1 Detail tests prove selectable slots can be selected and selection styling/semantics update — a1b2833
- [x] 1.2 Detail tests prove full slots remain disabled and cannot become selected — a1b2833
- [x] 1.3 Tests prove Continue is disabled without selection and navigates with correct params after selection — a1b2833
- [x] 1.4 TypeScript and lint pass for the updated route — a1b2833

#### Manual

- [x] 1.5 Compact viewport layout remains readable and actionable — a1b2833
- [x] 1.6 Screen-reader slot and Continue semantics are understandable — a1b2833

### Phase 2: Reservation Return Freshness

#### Automated

- [x] 2.1 Detail query refetches on focus after navigation return — d88b314
- [x] 2.2 Existing reservation conflict and back-navigation behavior remains intact — d88b314
- [x] 2.3 Full typecheck and lint pass — d88b314

#### Manual

- [x] 2.4 Conflict return refreshes availability without navigation instability — d88b314

### Phase 3: Coverage, Expo Validation, and Documentation

#### Automated

- [x] 3.1 Full Jest suite passes — c173d30
- [x] 3.2 Formatting check passes (station-details scope; unrelated baseline exception accepted) — c173d30
- [x] 3.3 Strict typecheck passes — c173d30
- [x] 3.4 ESLint passes — c173d30
- [x] 3.5 Expo dependency validation succeeds — c173d30
- [x] 3.6 Static web export succeeds — c173d30

#### Manual

- [x] 3.7 End-to-end station selection and reservation smoke flow works on mobile-sized viewports — c173d30
- [x] 3.8 Availability, accessibility, and conflict-return states pass manual review — c173d30
- [x] 3.9 Production experience contains no unintended development controls — c173d30
