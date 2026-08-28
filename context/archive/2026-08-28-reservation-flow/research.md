---
date: 2026-08-28T21:21:12+02:00
researcher: Natta
git_commit: 0f76c3de8d8f80161af0c413775b3f9d25c7a2ff
branch: master
repository: Training-Station-Finder
topic: 'Validated reservation form, duplicate submission prevention, unavailable-slot recovery, confirmation, and QR code'
tags: [research, codebase, reservation, validation, idempotency, availability, qr]
status: complete
last_updated: 2026-08-28
last_updated_by: Natta
---

# Research: Reservation flow

**Date**: 2026-08-28T21:21:12+02:00
**Researcher**: Natta
**Git Commit**: 0f76c3de8d8f80161af0c413775b3f9d25c7a2ff
**Branch**: master
**Repository**: Training-Station-Finder

## Research Question

How should the existing reservation journey support a validated reservation form, duplicate submission prevention, unavailable-slot recovery, confirmation, and a QR code?

## Summary

The complete user journey already exists: home → station details → slot selection → `/reserve` → `/booking/[id]`, with check-in reachable from the booking confirmation. The implementation uses the established fixture → API-shaped mock → TanStack Query → Expo Router architecture.

Validation and ordinary UI duplicate prevention are already implemented. React Hook Form delegates to a Zod schema, the submit handler returns while the mutation is pending, and the shared button disables itself and exposes busy state while loading. However, the API has no idempotency key or deduplication contract: two independently accepted calls with the same input create two reservations. This is the main distinction to preserve in planning.

Final slot availability is correctly authoritative at submission. The mock API returns a typed `SLOT_UNAVAILABLE` error, including a deterministic `harbor-race` scenario; the form presents recovery copy and returns to station details, whose focus lifecycle refetches availability. Confirmation already renders station/date/time, a human-readable booking code, an accessible QR code, and a check-in action. Route-level reservation and confirmation tests remain the largest coverage gap.

## Detailed Findings

### Reservation form and validation

- `app/reserve.tsx:17-35` loads `stationId` and `slotId`, creates the React Hook Form instance, applies `zodResolver`, and routes successful mutations to `/booking/[id]`.
- `src/features/bookings/schema.ts:3-12` defines trimmed full name, email, and phone validation with user-facing messages. The schema is the reusable validation contract and should remain the source for form errors.
- `src/components/FormField.tsx` provides the shared label, input, and error presentation used by all three fields.
- The route resolves the station and selected slot before rendering (`app/reserve.tsx:37-59`), with explicit loading, station-error, and missing-time states.

### Duplicate submission and mutation semantics

- `app/reserve.tsx:61-64` synchronously returns when `reservation.isPending` and passes the selected IDs plus validated values to `createReservation`.
- `src/components/Button.tsx:28-39` prevents presses when disabled/loading and exposes accessibility busy/disabled state; `app/reserve.tsx:156-162` binds this to the mutation.
- `src/providers/AppProviders.tsx:7-12` disables automatic mutation retries while retaining one query retry. This avoids silently repeating a reservation mutation.
- There is no API-level idempotency field in `src/types/domain.ts:22-35`, and `src/api/mockApi.ts:83-96` creates a new ID/code for each accepted call. Planning should decide whether this change needs a client-generated idempotency key plus mock deduplication, or only protects the route-level interaction.

### Availability and conflict recovery

- `src/api/mockApi.ts:24-39` derives a fresh station snapshot, subtracts successful reservations from capacity, clamps capacity at zero, and marks exhausted slots unavailable.
- `src/api/mockApi.ts:65-81` rechecks the selected slot at submission and throws typed `SLOT_UNAVAILABLE`; `harbor-race` deliberately simulates the last-place conflict.
- `app/reserve.tsx:140-153` distinguishes the typed conflict, explains that the time was taken, and offers “Choose another time” via `router.back()`.
- `app/station/[id].tsx:80-104` refetches the existing station query on focus, so the return path can show the updated slot state without a second source of truth.
- `src/features/stations/queries.ts:14-19` keeps station detail state under a stable query key. No mutation-driven invalidation or cache patching exists; focus refetch is the current freshness mechanism.

### Confirmation and QR code

- `app/booking/[id].tsx:17-21` loads the reservation by ID and then loads its station; `app/booking/[id].tsx:23-61` provides pending, missing-booking, station-error, and missing-slot states.
- `app/booking/[id].tsx:63-97` renders the success ticket with station, date, time, customer name, booking code, and QR.
- `app/booking/[id].tsx:80-90` uses `react-native-qrcode-svg` with the payload `training-station-finder:${booking.bookingCode}` and gives the QR an accessible label.
- `app/booking/[id].tsx:99-110` routes to code-based check-in and back to stations. `app/check-in.tsx:45-87` accepts and normalizes a booking code; it does not scan QR data.
- `src/types/domain.ts:30-35` has no QR version, signature, expiry, or verification metadata. The current QR is therefore a demonstration payload, not a secure credential.

### Data, dependencies, and boundaries

- `src/api/mockApi.ts:15-22` stores reservations, reserved capacity, and forced conflicts in module-level memory. Reloading the JavaScript bundle loses reservations (`README.md:65-67`).
- `package.json:21-39` confirms Expo `~54.0.36`, Expo Router `~6.0.24`, React Native `0.81.5`, `react-native-qrcode-svg`, and aligned `react-native-svg` are already present.
- `expo-linking` is installed and `app.json:8` defines the `trainingstationfinder` scheme, but no deep-link parsing or URL listener is implemented.
- No QR scanner or sharing feature exists. `expo-camera` and `expo-sharing` are absent. If scanning is added later, the SDK 54 Camera API uses `CameraView`, barcode settings, and `onBarcodeScanned`; it also needs camera permission/configuration work.

## Code References

- `app/reserve.tsx:17-35` — Reservation route setup, form resolver, mutation, and success navigation.
- `app/reserve.tsx:61-67` — Synchronous pending guard and typed conflict detection.
- `app/reserve.tsx:140-162` — Conflict recovery UI and loading submit button.
- `src/features/bookings/schema.ts:3-20` — Reservation and check-in schemas.
- `src/api/mockApi.ts:24-39` — Capacity snapshot and unavailable-state derivation.
- `src/api/mockApi.ts:65-96` — Final availability check and reservation creation.
- `app/booking/[id].tsx:63-110` — Confirmation ticket, QR, and check-in navigation.
- `src/types/domain.ts:22-35` — Reservation input/output contracts and current idempotency/QR gaps.
- `src/providers/AppProviders.tsx:7-12` — Query/mutation retry policy.
- `__tests__/mockApi.test.ts:38-90` — Existing lifecycle, capacity, and conflict coverage.
- `__tests__/validation.test.ts:3-37` — Existing schema and normalization coverage.

## Architecture Insights

Keep the existing layering and shared primitives. Validation belongs in the Zod schema; the route should translate schema/API state into UI; final availability must stay server/API-authoritative; and query freshness should reuse the existing station-detail query.

Treat duplicate prevention as two separate guarantees: UI interaction protection (`isPending` plus button loading) and request idempotency (a stable request key remembered by the API). The former exists today; the latter does not. If the change promises duplicate submission prevention under retries, navigation races, or repeated requests, it needs an explicit contract and tests at the API boundary.

Keep QR rendering separate from QR verification. The current confirmation QR can remain a booking-pass display for this scope, but scanning, deep-linking, sharing, signed payloads, expiry, and replay prevention would materially expand the feature.

## Historical Context (from prior changes)

- `context/changes/station-discovery/plan.md:33-39` established the fixture → mock API → TanStack Query → Expo Router architecture and shared accessibility conventions.
- `context/archive/2026-08-28-station-details/plan.md:95-132` established focus-triggered station refresh after returning from reservation conflict and kept the reservation route/API contract stable.
- `context/archive/2026-08-28-station-details/research.md:80-86` recommends keeping final availability in the reservation API and avoiding a second source of truth.

## Related Research

- `context/changes/station-discovery/research.md` — Discovery state, query policy, accessibility, and testing conventions.
- `context/archive/2026-08-28-station-details/research.md` — Slot selection and conflict-return freshness.

## Open Questions

- Should “duplicate submission prevention” require true API idempotency, or is route/button interaction protection sufficient for this in-memory prototype?
- Should an idempotency key be added to `ReservationInput`, kept as a separate command type, or remain an API implementation detail?
- After conflict recovery, should the reserve route invalidate/refetch directly, or should the existing station focus refresh remain the only freshness mechanism?
- Is QR scanning, deep linking, or sharing in scope, or is the current rendered booking-pass QR sufficient?
- Should route-level tests be added for reserve and confirmation screens, including pending double-submit behavior, conflict recovery, success navigation, QR accessibility, and missing-booking states?
