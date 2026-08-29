# Booking-Code Check-In and Simulated Result Implementation Plan

## Overview

The booking-code check-in experience is already implemented. This change will formalize its behavior with dedicated route-level tests and distinguish first-time check-in from a booking code that has already been checked in, preserving the existing in-memory mock API, Expo Router route, shared form controls, and simulated result presentation.

## Current State Analysis

`app/check-in.tsx` already reads an optional code parameter, validates and normalizes the booking code through `checkInSchema`, submits through the React Query `checkIn` mutation, renders typed invalid-code errors, and shows a result with attendee name and code. The home screen and booking confirmation already provide entry points to check-in, but the current mutation response does not tell the UI whether the reservation was checked in previously, so repeat check-ins receive the same first-time success copy.

The schema and mock API are covered by unit tests, and `BookingScreen.test.tsx` covers direct check-in from the confirmation ticket. There is no dedicated `CheckInScreen.test.tsx`, leaving the manual route’s render states, form behavior, error path, success result, and Done navigation unprotected.

The project uses Expo SDK 54 / Expo Router 6, strict TypeScript, React Native Testing Library, Jest Expo, and direct route-component tests with mocked public hooks. The plan follows those existing conventions.

## Desired End State

The standalone `/check-in` route has focused behavior-level coverage for its complete user-visible contract: optional prefill, normalized valid input, client validation, pending and duplicate-submit protection, invalid booking-code feedback, first-time simulated check-in output, repeat-check-in messaging, and return-home navigation. The mock API exposes whether a check-in result was already recorded so both entry points can render the correct state.

Production behavior, API contracts, route structure, dependencies, and the existing direct confirmation check-in flow remain unchanged. The implementation scope is test-focused; the plan and change artifacts are updated as required handoff bookkeeping. The change is verified by focused tests and the repository’s standard quality commands.

### Key Discoveries:

- The production route already implements the requested behavior ([`app/check-in.tsx:14-95`](../../app/check-in.tsx:14)).
- Validation is centralized and already normalizes whitespace/lowercase codes ([`src/features/bookings/schema.ts:14-22`](../../src/features/bookings/schema.ts:14)).
- The mock API returns typed invalid-code errors and idempotent checked-in reservations; it needs a result-level flag to distinguish first and repeated requests ([`src/api/mockApi.ts:146-162`](../../src/api/mockApi.ts:146)).
- Existing screen tests mock Expo Router and React Query at public boundaries ([`__tests__/BookingScreen.test.tsx:1-40`](../../__tests__/BookingScreen.test.tsx:1)).
- Historical decisions explicitly retain standalone `/check-in` and exclude QR scanning, persistence, authentication, and a real backend ([`context/archive/2026-08-28-reservation-flow/plan.md:5-29`](../../archive/2026-08-28-reservation-flow/plan.md:5)).

## What We're NOT Doing

- Changing unrelated check-in UI or copy beyond the explicit first-time versus repeat-result distinction.
- Adding a backend, persistence, authentication, attendance service, QR scanner, deep links, or a new attendance domain model.
- Reworking the booking confirmation screen’s direct check-in behavior.
- Adding new dependencies or changing the Expo Router structure.
- Adding end-to-end device automation; manual smoke verification is sufficient for this small route.

## Implementation Approach

Extend the mock check-in result with an explicit repeat-state flag, render distinct first-time and already-checked-in messages in both check-in entry points, and add `__tests__/CheckInScreen.test.tsx` using the established direct-route testing pattern. Mock `useMutation` from TanStack Query and `useLocalSearchParams` / `useRouter` from Expo Router, then control mutation return states per test. Use React Native Testing Library to interact through accessible labels and button roles, asserting only the route’s public UI and mutation contract.

Keep schema, unrelated domain behavior, and route structure unchanged. The check-in result contract and the two existing check-in result presentations are intentionally in scope; updating the test and change artifacts is also required handoff bookkeeping.

## Critical Implementation Details

The success branch is selected from `checkInMutation.isSuccess`, so tests must render initial, first-time-success, and repeat-success mutation states rather than attempting to drive a real asynchronous request. The API must compute the repeat flag before writing `checkedInAt`; the UI then branches only on that result flag. Pending coverage should assert the shared button’s visible loading/disabled and busy behavior plus prevention of a second submission; the route’s internal synchronous guard need not be treated as independently observable.

## Phase 1: Manual Check-In Route Coverage

### Overview

Create focused route-level tests for the manual booking-code entry and simulated result states.

### Changes Required:

#### 1. Add `CheckInScreen` behavior tests

**Files**: `src/api/mockApi.ts`, `src/types/domain.ts`, `app/check-in.tsx`, `app/booking/[id].tsx`, `__tests__/CheckInScreen.test.tsx`, `__tests__/mockApi.test.ts`, `__tests__/BookingScreen.test.tsx`

**Intent**: Expose and protect the distinction between a first check-in and a repeat check-in without mounting a navigation container or calling the real delayed mock API.

**Contract**: Follow the existing mocked-hook setup used by `BookingScreen.test.tsx`. Cover:

- initial heading, explanatory copy, booking-code field, Check in action, and simulated-flow disclaimer;
- optional `code` route parameter prefilled into the booking-code input;
- invalid short/empty input blocked by the schema with inline validation feedback;
- valid input trimmed/uppercased before `mutate` receives it;
- pending mutation showing the shared button loading/disabled and busy state and preventing another submit;
- mutation error showing the accessible “Couldn’t check in” alert and API message;
- successful mutation showing “Check-in complete”, attendee name, and normalized booking code;
- repeat successful mutation showing that the code has already been checked in, with attendee name and normalized booking code;
- Done action calling `router.replace('/')`.

### Success Criteria:

#### Automated Verification:

- `npm test -- __tests__/CheckInScreen.test.tsx` passes with all route behavior cases.
- The new test follows existing accessibility-oriented queries and does not depend on implementation-private styles.
- `npm test -- __tests__/mockApi.test.ts __tests__/BookingScreen.test.tsx` passes with first-time and repeat-check-in coverage.

#### Manual Verification:

- From the home screen, open Check in, enter a valid booking code, and confirm the simulated success result appears.
- Enter an unknown code and confirm the error remains understandable and the form can be retried.
- Repeat a previously checked-in code from the home flow and confirm the already-checked-in message appears without changing the recorded state.

**Implementation Note**: After automated verification passes, pause for manual confirmation before proceeding to Phase 2.

## Phase 2: Regression Verification

### Overview

Run the focused route test and the full repository quality gate to confirm that the new test coverage introduces no regressions.

### Changes Required:

#### 1. Verify existing contracts

**Files**: `app/check-in.tsx`, `app/booking/[id].tsx`, `app/index.tsx`, `app/_layout.tsx`, `src/types/domain.ts`, `src/features/bookings/schema.ts`, `src/api/mockApi.ts`, `__tests__/mockApi.test.ts`, `__tests__/validation.test.ts`, `__tests__/BookingScreen.test.tsx`, `__tests__/CheckInScreen.test.tsx`

**Intent**: Confirm that adding manual route coverage does not require production behavior changes and that existing API, validation, and confirmation tests remain authoritative.

**Contract**: Preserve current booking-code normalization, `INVALID_CODE` behavior, idempotent `checkedInAt` updates, direct confirmation check-in, home-screen entry navigation, `/check-in` stack registration, and shared control semantics. The check-in result must expose whether the reservation was already checked in before the request, and both check-in result surfaces must use that flag consistently. Production changes are intentionally limited to this result contract and its user-facing copy.

### Success Criteria:

#### Automated Verification:

- `npm test` passes for the complete Jest suite.
- `npm run typecheck` passes under the repository’s strict TypeScript settings.
- `npm run lint` passes for app, source, and test files.
- `npm run format:check` passes without unrelated formatting churn.

#### Manual Verification:

- Verify the full flow on a phone-sized viewport: home → Check in → valid code → success → Done.
- Verify invalid input and unknown-code errors can be retried without duplicate submissions.
- Confirm the existing booking confirmation ticket and direct Check in now action still behave as before.

**Implementation Note**: After the quality gate and manual smoke checks pass, the change is ready for implementation review.

## Phase 3: Documentation and Handoff

### Overview

Keep the change artifacts aligned with the implemented test coverage and leave a clear verification record for review.

### Changes Required:

#### 1. Update change progress and implementation notes

**Files**: `context/changes/check-in/plan.md`, `context/changes/check-in/change.md`, `context/changes/check-in/reviews/plan-review.md`, `context/changes/check-in/reviews/impl-review.md`

**Intent**: Record completed verification steps through the canonical progress section and preserve the plan as the implementation handoff.

**Contract**: `/10x-implement` owns flipping Progress entries and appending commit SHAs; implementation must not create a parallel state file. `change.md` status should move through the repository’s normal implementation statuses only when the corresponding workflow completes.

### Success Criteria:

#### Automated Verification:

- The plan’s `## Progress` section contains one entry for every phase success criterion and remains mechanically parseable.
- The change folder contains `change.md`, `research.md`, `plan.md`, and `plan-brief.md`.

#### Manual Verification:

- A reviewer can identify the intended test scope, out-of-scope decisions, and commands needed to verify the change from the brief alone.

## Testing Strategy

### Unit Tests:

- Keep existing schema tests for code normalization and validation.
- Keep existing mock API tests for successful, invalid, and repeated check-ins.

### Integration Tests:

- Add route-level `CheckInScreen` tests for initial render, route-param prefill, validation, normalized submission, pending protection, API error, first-time success result, repeat-check-in result, and Done navigation.
- Extend mock API and booking confirmation tests to verify the repeat-state flag and matching repeat-check-in copy.
- Retain existing `BookingScreen` route tests for the separate confirmation entry point.

### Manual Testing Steps:

1. Launch the Expo app and open Check in from the home screen.
2. Submit an empty or short code and verify inline validation prevents mutation.
3. Submit an unknown code and verify the accessible error message, then edit and retry.
4. Confirm the initial form shows the simulated-flow disclaimer, then use a valid generated booking code from a reservation and verify the attendee name and code in the success state.
5. Tap Done and verify navigation returns to `/`.

## Performance Considerations

No runtime performance changes are planned. The tests mock delayed mutation behavior, and the existing in-memory mock API and React Query configuration remain unchanged.

## Migration Notes

None. No persisted data, schema, dependency, or route migration is required.

## References

- Related research: [`context/changes/check-in/research.md`](research.md)
- Manual route: [`app/check-in.tsx`](../../app/check-in.tsx)
- API contract: [`src/api/mockApi.ts:146-162`](../../src/api/mockApi.ts:146)
- Existing route-test pattern: [`__tests__/BookingScreen.test.tsx`](../../__tests__/BookingScreen.test.tsx)
- Historical reservation decisions: [`context/archive/2026-08-28-reservation-flow/plan.md`](../../archive/2026-08-28-reservation-flow/plan.md)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Manual Check-In Route Coverage

#### Automated

- [x] 1.1 `npm test -- __tests__/CheckInScreen.test.tsx` passes with all route behavior cases — e7a970b
- [x] 1.2 New test follows existing accessibility-oriented queries and avoids implementation-private styles — e7a970b
- [x] 1.5 Repeat-aware API and booking-confirmation tests pass with `npm test -- __tests__/mockApi.test.ts __tests__/BookingScreen.test.tsx` — e7a970b

#### Manual

- [x] 1.3 Valid code produces the simulated success result from the home-screen Check in entry point — e7a970b
- [x] 1.4 Unknown-code error remains understandable and retryable — e7a970b
- [x] 1.6 Repeating a previously checked-in code shows the already-checked-in message and preserves the checked-in state — e7a970b

### Phase 2: Regression Verification

#### Automated

- [x] 2.1 Complete Jest suite passes with `npm test` — 8a4fd5b
- [x] 2.2 Strict TypeScript passes with `npm run typecheck` — 8a4fd5b
- [x] 2.3 ESLint passes with `npm run lint` — 8a4fd5b
- [x] 2.4 Formatting check passes with `npm run format:check` — 8a4fd5b

#### Manual

- [x] 2.5 Full phone-sized check-in flow works from home through Done — 8a4fd5b
- [x] 2.6 Invalid input and unknown-code retry behavior works without duplicate submissions — 8a4fd5b
- [x] 2.7 Existing booking confirmation and direct Check in now behavior remains unchanged — 8a4fd5b

### Phase 3: Documentation and Handoff

#### Automated

- [x] 3.1 Progress section contains one parseable entry for every phase success criterion — bf20775
- [x] 3.2 Change folder contains `change.md`, `research.md`, `plan.md`, and `plan-brief.md` — bf20775

#### Manual

- [x] 3.3 Plan brief communicates scope, decisions, and verification commands without requiring the full plan — bf20775
