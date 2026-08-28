# Reservation Flow Implementation Plan

## Overview

Harden the existing station reservation journey so contact details are validated consistently, a single user intent cannot create duplicate reservations, stale slot conflicts recover cleanly, and successful bookings present a reliable confirmation ticket with a QR booking pass. Preserve the current Expo Router, TanStack Query, mock API, shared UI primitives, and accessibility conventions.

## Current State Analysis

The journey already exists as home → station details → slot selection → `/reserve` → `/booking/[id]`, with code-based check-in from the confirmation screen. React Hook Form and Zod provide trimmed name, email, and phone validation (`app/reserve.tsx:24-30`, `src/features/bookings/schema.ts:3-12`). The route and shared `Button` prevent normal double taps through `reservation.isPending` and loading/disabled press behavior (`app/reserve.tsx:61-64`, `src/components/Button.tsx:28-39`).

The mock API rechecks availability and returns typed `SLOT_UNAVAILABLE` errors, while station-detail focus refreshes availability after conflict recovery (`src/api/mockApi.ts:65-81`, `app/reserve.tsx:140-153`, `app/station/[id].tsx:80-104`). The confirmation screen already renders station/date/time, customer name, booking code, and `react-native-qrcode-svg` using `training-station-finder:${booking.bookingCode}` (`app/booking/[id].tsx:63-97`).

The principal gap is API-level idempotency: `ReservationInput` has no request key and every independently accepted `createReservation` call generates a new reservation (`src/types/domain.ts:22-35`, `src/api/mockApi.ts:83-96`). Route-level tests for reservation and confirmation behavior are also missing, despite API and schema coverage.

## Desired End State

The reservation form rejects invalid contact data with field-level accessible errors, submits only once per intent, and sends a stable idempotency key so a repeated request returns the original reservation rather than consuming another slot. A slot that becomes unavailable during submission shows specific recovery copy and returns the user to refreshed station availability.

Successful submission navigates to a stable confirmation route that handles loading/missing data, presents the booking ticket and accessible QR pass, and keeps the existing code-based check-in action. Automated tests cover schema behavior, API idempotency/capacity/conflicts, reservation route states and navigation, and confirmation/QR semantics.

### Key Discoveries:

- The existing form, typed API errors, conflict UI, confirmation ticket, and QR renderer should be extended rather than replaced (`app/reserve.tsx:17-167`, `app/booking/[id].tsx:14-114`).
- UI duplicate protection already exists, but API idempotency does not (`app/reserve.tsx:61-64`, `src/api/mockApi.ts:83-96`).
- Final availability belongs to the API boundary; station detail should continue refreshing through its existing query (`src/api/mockApi.ts:24-39`, `src/features/stations/queries.ts:14-19`).
- Shared `Button`, `FormField`, `Screen`, `StateView`, theme tokens, and accessibility roles are the established implementation vocabulary.
- Expo SDK 54 is the project baseline (`package.json:22-37`); implementation work must consult the exact v54 docs required by `AGENTS.md` before changing Expo-facing code.

## What We're NOT Doing

- Adding a production backend, authentication, persistence, payments, or durable reservation storage.
- Adding QR scanning, camera permissions, deep-link handling, sharing, signed QR tokens, expiry, or replay prevention.
- Replacing the current QR payload with a secure credential; the QR remains a demonstration booking pass.
- Adding a global reservation store, repository layer, optimistic capacity updates, polling, or realtime availability.
- Changing station discovery, station selection, check-in validation, or the existing station-detail selection UX except where conflict refresh requires compatibility.
- Adding broad end-to-end infrastructure; use the current Jest and React Native Testing Library conventions plus manual Expo smoke checks.

## Implementation Approach

Keep the current route/API separation. Introduce a create-reservation command contract carrying a client-generated idempotency key, store successful results by key in the mock API, and check that map before consuming capacity. Keep the route-level pending guard and loading button as the fast UI barrier. Preserve the API’s final availability check and typed conflict error. Add a small QR payload helper only if needed to give the existing format one tested source of truth; do not add scanning or verification behavior.

Add focused route tests by mocking public hooks/router boundaries, following the existing `HomeScreen` and `StationDetailScreen` test style. Test the API contract independently from route rendering, and use `resetMockApi` to isolate mutable module state.

## Critical Implementation Details

The idempotency key must remain stable for retries of one logical submission and must not be regenerated between the initial request and a repeated API call. The API must resolve an already-completed key before availability accounting, so a duplicate returns the original reservation without incrementing `reservedPlaces`; a different key for the same slot remains a separate reservation and is still subject to capacity/conflict rules.

Conflict recovery must preserve the current `SLOT_UNAVAILABLE` branch and return path. Do not hide the form or silently retry with another slot; the user must explicitly choose a fresh slot, and station-detail focus remains responsible for showing the updated availability.

Before modifying Expo-facing files or dependencies, read the exact Expo SDK 54 documentation specified in `AGENTS.md` and validate with the repository’s Expo 54 checks.

## Phase 1: Reservation Command Contract and Idempotent API

### Overview

Make duplicate prevention a real API invariant while retaining the existing form validation and UI pending behavior.

### Changes Required:

#### 1. Reservation command and domain types

**Files**: `src/types/domain.ts`, `src/api/mockApi.ts`

**Intent**: Represent a create-reservation request with a stable idempotency key without leaking request metadata into the persisted reservation display model.

**Contract**: Add and export a required `CreateReservationInput` type containing the existing `ReservationInput` fields plus a non-empty `idempotencyKey`; `createReservation` accepts this type as its sole argument. Keep `Reservation` unchanged for consumers. Repeated calls with the same key and equivalent input return the same reservation identity and booking code; reusing a key with different input rejects with a typed invalid-request error and never changes capacity.

#### 2. Mock API idempotency and reset behavior

**File**: `src/api/mockApi.ts`

**Intent**: Deduplicate completed reservation commands before slot capacity is consumed, while preserving final availability checks and deterministic race behavior.

**Contract**: Add resettable key-to-reservation state. Check the key after the simulated request delay and before slot lookup/accounting; return the prior reservation for a completed key. Store the result only after successful creation. `resetMockApi` must clear idempotency state along with reservations, capacity, conflicts, and scenarios. Existing `SLOT_UNAVAILABLE` and `NOT_FOUND` codes remain unchanged.

#### 3. Reservation route request lifecycle

**Files**: `app/reserve.tsx`, `src/features/bookings/` (only if a helper is needed)

**Intent**: Generate one key per logical form submission and pass it through the mutation while keeping the current validated values, loading state, and success navigation.

**Contract**: Invalid forms never call the mutation. A pending submit is synchronously ignored. Store the generated key in a route-local ref for the active logical submission, pass it in `CreateReservationInput`, and clear it when the mutation fails so a later user attempt receives a new key. Successful mutation data still navigates with ``router.replace(`/booking/${data.id}`)``, and conflict recovery continues to use the existing typed branch.

### Success Criteria:

#### Automated Verification:

- Schema tests prove valid values are trimmed and invalid name/email/phone values never pass validation.
- API tests prove the same idempotency key returns one reservation and consumes one capacity place, while a different key creates a distinct reservation or receives the expected slot conflict.
- API tests prove reset isolation and preserve existing capacity exhaustion and `harbor-race` conflict behavior.
- Reservation route tests prove invalid submission does not mutate, pending submission exposes busy/disabled behavior, and successful mutation navigates once with the expected route.
- `npm run typecheck` and `npm run lint` pass.

#### Manual Verification:

- On iOS and Android-sized Expo SDK 54 previews, submit valid details and confirm the button visibly enters a busy state and cannot be pressed repeatedly.
- Return to the same slot after a successful booking and confirm capacity reflects one reservation, not multiple accidental submissions.

**Implementation Note**: After automated verification passes, pause for manual confirmation of the submit lifecycle and capacity behavior before proceeding to Phase 2.

## Phase 2: Conflict Recovery and Confirmation Contract

### Overview

Protect the stale-slot recovery path and make the existing confirmation/QR experience explicit, testable, and resilient across its loading and missing-data states.

### Changes Required:

#### 1. Unavailable-slot recovery

**Files**: `app/reserve.tsx`, `app/station/[id].tsx`, `src/features/stations/queries.ts` only if required by tests

**Intent**: Keep conflict messaging actionable and ensure returning to station details exposes the newly unavailable slot.

**Contract**: `ApiError.code === 'SLOT_UNAVAILABLE'` renders the specific conflict title/message and “Choose another time” action. The action returns to the station route without creating a reservation; focus-triggered refetch updates the selected slot to unavailable. Do not add a second availability source or automatic slot substitution.

#### 2. Confirmation and QR presentation

**Files**: `app/booking/[id].tsx`, optionally `src/features/bookings/qr.ts`

**Intent**: Preserve the booking-pass confirmation while giving the QR payload and accessible semantics a stable tested contract.

**Contract**: Confirmation loads the reservation by ID and station details, renders explicit pending/error/missing-slot states, and on success shows station, formatted date/time, customer name, booking code, QR, and check-in navigation. The QR value remains exactly `training-station-finder:${booking.bookingCode}` unless a deliberately documented compatibility change is approved. If extracted, the QR formatter must be pure and covered by unit tests.

#### 3. Route behavior tests

**Files**: `__tests__/ReserveScreen.test.tsx` (new), `__tests__/BookingScreen.test.tsx` (new), `__tests__/mockApi.test.ts` (extend), `__tests__/StationDetailScreen.test.tsx` (extend only if needed)

**Intent**: Test user-visible behavior through accessibility roles and public hook/router boundaries, without coupling tests to TanStack Query or Expo internals.

**Contract**: Cover reserve loading/error/missing-slot states, field errors, pending duplicate protection, success replacement navigation, typed conflict copy/back action, booking pending/error states, confirmation details, QR accessible label/value, and check-in route params. Mock `useMutation` with explicit `isPending`, `isError`, `error`, and `mutate` fixtures; mock `useQuery` with explicit pending/success/error data fixtures; mock `useStation` and `useRouter` at their public module boundaries; and mock `react-native-qrcode-svg` with a test component that exposes its received `value` prop. Reset all mutable API state between API tests.

### Success Criteria:

#### Automated Verification:

- Route tests prove unavailable-slot recovery calls `router.back()` and does not navigate to confirmation.
- Station-detail coverage proves focus return refetch keeps conflict-driven availability current, without introducing duplicate refetch loops.
- Confirmation tests prove booking details, QR contract, accessible label, check-in navigation, and missing-booking fallback.
- `npm test` passes with existing discovery/detail suites and the new reservation/booking coverage.
- `npm run format:check` passes.

#### Manual Verification:

- Use the deterministic Harbor race slot, submit the form, choose “Choose another time,” and verify the slot is now unavailable on station details.
- Complete a normal booking and verify the confirmation ticket, QR visibility, booking code, customer name, date/time, and check-in action on compact phone dimensions.
- With VoiceOver or TalkBack, verify field errors, conflict recovery, QR label, and confirmation actions are understandable.

**Implementation Note**: After automated verification passes, pause for manual confirmation of conflict recovery, confirmation layout, and assistive-technology semantics before proceeding to Phase 3.

## Phase 3: Expo 54 Verification and Documentation

### Overview

Run the full repository quality gate, validate the Expo SDK 54 dependency/runtime surface, and document the final prototype boundaries and demo path.

### Changes Required:

#### 1. Expo and package validation

**Files**: `package.json`, `package-lock.json`, `app.json` only if implementation changes require them

**Intent**: Ensure any Expo-facing edits remain aligned with SDK 54 and do not introduce unsupported or unnecessary dependencies.

**Contract**: Consult the exact versioned Expo v54 documentation before implementation changes. Use `npx expo install --check`; do not add camera, sharing, or deep-link dependencies for the out-of-scope features.

#### 2. Documentation alignment

**File**: `README.md` only if behavior or demo instructions change

**Intent**: Keep the documented reservation demo, idempotency guarantee, in-memory limitation, and QR scope truthful.

**Contract**: Preserve the existing statement that reservations are session-only and QR is a demonstration payload. Document any new deterministic idempotency or route-test behavior only where it helps a reviewer reproduce the flow.

### Success Criteria:

#### Automated Verification:

- `npm test` passes.
- `npm run format:check` passes.
- `npm run typecheck` passes.
- `npm run lint` passes.
- `npx expo install --check` succeeds against the Expo SDK 54 dependency map.
- `npx expo export --platform web --output-dir /tmp/training-station-finder-web` completes without route errors.

#### Manual Verification:

- Complete home → station → slot → form → confirmation on iOS and Android-sized viewports.
- Verify normal booking, duplicate-submit attempt, stale-slot conflict recovery, confirmation QR, and check-in flows.
- Confirm no camera/scanner, sharing, persistence, or development-only controls are unintentionally introduced.

## Testing Strategy

### Unit Tests:

- Keep Zod schema tests for trimming and invalid contact fields.
- Add pure idempotency-key/QR helper tests only if helpers are extracted.
- Extend mock API tests for same-key deduplication, different-key capacity behavior, reset isolation, and existing conflict semantics.

### Integration Tests:

- Mock `useStation`, `useQuery`/`useMutation` boundaries as needed, and Expo Router public APIs for route rendering.
- Verify reserve submit handling, one navigation on success, conflict back navigation, confirmation data rendering, and check-in params.
- Do not test TanStack Query internals, QR pixel geometry, or Expo implementation details.

### Manual Testing Steps:

1. Open a selectable station slot and submit invalid, then valid, contact details; verify field errors and successful navigation.
2. Press the reservation action repeatedly during its delay; verify one booking and one capacity decrement.
3. Submit the Harbor race slot; verify the typed conflict message, return action, and refreshed unavailable state.
4. Complete a normal booking; verify confirmation data, QR label/value, booking code, and check-in navigation.
5. Repeat the flow on compact phone dimensions and with VoiceOver/TalkBack where available.

## Performance Considerations

The mock dataset is small and remains non-virtualized. Idempotency lookup is an in-memory map operation before capacity accounting; no polling or new cache layer is needed. Keep the existing request delays so pending and conflict states remain manually demonstrable.

## Migration Notes

No persisted data migration is required because reservations and idempotency records exist only in the mock module’s memory. Every direct `createReservation` caller, including `__tests__/mockApi.test.ts`, must adopt the required `CreateReservationInput` contract. The six-request capacity test must use six distinct explicit keys; no compatibility overload is retained.

## References

- Related research: `context/changes/reservation-flow/research.md`
- Reservation route: `app/reserve.tsx:17-167`
- Reservation schema: `src/features/bookings/schema.ts:3-12`
- API reservation creation: `src/api/mockApi.ts:65-96`
- Domain contract: `src/types/domain.ts:22-35`
- Conflict recovery: `app/reserve.tsx:140-153`
- Confirmation and QR: `app/booking/[id].tsx:63-110`
- Query freshness: `app/station/[id].tsx:80-104`
- Shared button semantics: `src/components/Button.tsx:28-39`
- Prior architecture: `context/changes/station-discovery/plan.md:33-39`
- Prior conflict-refresh decision: `context/archive/2026-08-28-station-details/plan.md:95-132`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Reservation Command Contract and Idempotent API

#### Automated

- [x] 1.1 Schema tests preserve trimmed valid input and reject invalid contact details — 03218b7
- [x] 1.2 API tests prove same-key requests return one reservation and consume one capacity place — 03218b7
- [x] 1.3 API tests preserve different-key capacity/conflict behavior and reset isolation — 03218b7
- [x] 1.4 Reservation route tests prove invalid submission, pending duplicate protection, and one success navigation — 03218b7
- [x] 1.5 Typecheck and lint pass — 03218b7

#### Manual

- [x] 1.6 Expo preview confirms busy submit behavior and one capacity decrement — 03218b7

### Phase 2: Conflict Recovery and Confirmation Contract

#### Automated

- [x] 2.1 Route tests prove typed unavailable recovery returns to station details without confirmation — 81f7273
- [x] 2.2 Station-detail tests preserve focus refetch freshness without loops — 81f7273
- [x] 2.3 Confirmation tests prove details, QR contract/accessibility, check-in navigation, and missing-booking fallback — 81f7273
- [x] 2.4 Full Jest suite passes — 81f7273
- [x] 2.5 Formatting check passes — 81f7273

#### Manual

- [x] 2.6 Harbor race recovery refreshes availability correctly — 81f7273
- [x] 2.7 Confirmation and QR remain usable on compact devices and with assistive technology — 81f7273

### Phase 3: Expo 54 Verification and Documentation

#### Automated

- [x] 3.1 Expo SDK 54 dependency check passes
- [x] 3.2 Web export completes without route errors
- [x] 3.3 Final typecheck, lint, tests, and formatting checks pass

#### Manual

- [x] 3.4 End-to-end reservation, recovery, confirmation, QR, and check-in smoke flow passes on target previews
- [x] 3.5 Prototype scope remains limited to in-memory bookings and rendered QR confirmation
