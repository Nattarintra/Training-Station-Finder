---
date: 2026-08-29T22:12:22+02:00
researcher: Natta
git_commit: b04dc5a8bf687cc395cfa6cd606087366b067c76
branch: master
repository: Training-Station-Finder
topic: 'booking-code entry and simulated check-in result'
tags: [research, codebase, bookings, check-in, expo-router, testing]
status: complete
last_updated: 2026-08-29
last_updated_by: Natta
---

# Research: booking-code entry and simulated check-in result

**Date**: 2026-08-29T22:12:22+02:00  
**Researcher**: Natta  
**Git Commit**: `b04dc5a8bf687cc395cfa6cd606087366b067c76`  
**Branch**: `master`  
**Repository**: `Training-Station-Finder`

## Research Question

Understand the existing architecture and implementation points for booking-code entry and a simulated check-in result.

## Summary

The requested flow is already implemented across the standalone `/check-in` route and the booking confirmation screen. Home navigation opens manual check-in, the screen normalizes and validates a booking code, calls the in-memory mock API, and renders a dedicated success result with attendee name and code. The mock API stores check-in state in `Reservation.checkedInAt` and makes repeated check-ins idempotent.

The feature should remain within the existing fixture → mock API → TanStack Query → Expo Router architecture. No backend, persistence, QR scanning, authentication, or new attendance model is needed. The clearest remaining work for this change is route-level test coverage for manual check-in; current tests cover the schema, API lifecycle, and direct check-in from the booking confirmation screen, but not `app/check-in.tsx` itself.

## Detailed Findings

### App structure and navigation

- The root stack registers `/check-in` with the title “Check in” and uses a hidden header only for the home route ([`app/_layout.tsx:18-41`](../../app/_layout.tsx:18)).
- The home screen presents an “Already booked?” card and navigates to `/check-in` ([`app/index.tsx:100-109`](../../app/index.tsx:100)).
- The normal booking path is `/` → `/station/[id]` → `/reserve` → `/booking/[id]`; the confirmation route also offers direct check-in ([`app/booking/[id].tsx:101-118`](../../app/booking/[id].tsx:101)).
- The standalone route accepts an optional `code` parameter, allowing a prefilled booking-code form ([`app/check-in.tsx:14-24`](../../app/check-in.tsx:14)).

### Booking-code entry and result behavior

- `app/check-in.tsx` uses `react-hook-form` with the shared `FormField` and `checkInSchema` ([`app/check-in.tsx:17-25`](../../app/check-in.tsx:17), [`app/check-in.tsx:60-75`](../../app/check-in.tsx:60)).
- The field is configured for booking-code entry with uppercase capitalization, autocorrect disabled, and the `TSF-ABC123` placeholder ([`app/check-in.tsx:65-73`](../../app/check-in.tsx:65)).
- Submission avoids starting another mutation while one is pending ([`app/check-in.tsx:45-47`](../../app/check-in.tsx:45)).
- Invalid API responses render an accessible alert with the user-safe error message ([`app/check-in.tsx:77-81`](../../app/check-in.tsx:77)).
- A successful mutation replaces the form with a centered success state showing “Check-in complete”, the attendee name, the normalized booking code, and a Done action returning to `/` ([`app/check-in.tsx:27-41`](../../app/check-in.tsx:27)).
- The screen explicitly labels the flow as simulated and states that no external certification or attendance service is contacted ([`app/check-in.tsx:89-92`](../../app/check-in.tsx:89)).

### Validation and mock API contract

- `checkInSchema` trims whitespace, requires a minimum length, and uppercases the booking code ([`src/features/bookings/schema.ts:14-22`](../../src/features/bookings/schema.ts:14)).
- `checkIn` normalizes the code again before looking up an in-memory reservation ([`src/api/mockApi.ts:146-151`](../../src/api/mockApi.ts:146)).
- Unknown codes reject with typed `INVALID_CODE` and the message “Booking code not found. Check the code and try again.” ([`src/api/mockApi.ts:152-156`](../../src/api/mockApi.ts:152)).
- Successful check-in sets `checkedInAt` only when it is empty, so repeated requests return the same checked-in reservation ([`src/api/mockApi.ts:157-162`](../../src/api/mockApi.ts:157)).
- `Reservation` already includes `bookingCode` and nullable `checkedInAt`; no domain-model expansion is required ([`src/types/domain.ts:34-38`](../../src/types/domain.ts:34)).
- All reservation state is held in module-level maps and is cleared by `resetMockApi`; it does not survive a JavaScript bundle reload ([`src/api/mockApi.ts:19-24`](../../src/api/mockApi.ts:19), [`src/api/mockApi.ts:165-171`](../../src/api/mockApi.ts:165)).

### Shared UI and project conventions

- `Screen` supplies scrolling, safe-area handling, keyboard behavior, and a 720-point content width cap ([`src/components/Screen.tsx:13-35`](../../src/components/Screen.tsx:13)).
- `FormField` provides the labeled input, 48-point minimum height, shared tokens, inline validation, and accessibility hint ([`src/components/FormField.tsx:10-25`](../../src/components/FormField.tsx:10)).
- `Button` provides the 48-point minimum target, loading indicator, disabled behavior, and busy accessibility state ([`src/components/Button.tsx:18-39`](../../src/components/Button.tsx:18)).
- The project uses Expo SDK 54 (`expo ~54.0.36`), Expo Router 6, React Native 0.81, and React 19 ([`package.json:22-33`](../../package.json:22)). The existing Expo Router file-based route structure should be preserved.
- Verification conventions are `npm test`, `npm run typecheck`, `npm run lint`, and `npm run format:check` ([`package.json:8-15`](../../package.json:8)). TypeScript is strict with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` ([`tsconfig.json:2-11`](../../tsconfig.json:2)).

### Test coverage and gap

- Schema tests already verify whitespace and lowercase normalization ([`__tests__/validation.test.ts:33-37`](../../__tests__/validation.test.ts:33)).
- Mock API tests cover reservation creation, successful check-in, invalid codes, repeated check-in, and reset behavior ([`__tests__/mockApi.test.ts:38-55`](../../__tests__/mockApi.test.ts:101)).
- Booking confirmation tests cover QR payload/accessibility, direct check-in submission, and success feedback ([`__tests__/BookingScreen.test.tsx:95-127`](../../__tests__/BookingScreen.test.tsx:95)).
- There is no dedicated `__tests__/CheckInScreen.test.tsx`. The missing route-level cases are initial rendering and prefill, validation blocking, pending/duplicate protection, invalid-code feedback, successful result content, and Done navigation.
- Existing screen tests import route components directly and mock Expo Router hooks, React Query, and feature hooks at their public boundaries; a check-in screen test should follow that pattern.

## Code References

- `app/check-in.tsx:14-95` - Manual booking-code entry, mutation states, and simulated success result.
- `app/booking/[id].tsx:63-118` - Booking ticket and direct check-in action/result.
- `app/index.tsx:100-109` - Home entry point to manual check-in.
- `src/features/bookings/schema.ts:14-22` - Booking-code normalization and validation.
- `src/api/mockApi.ts:146-162` - Simulated check-in lookup, error, and idempotent state update.
- `src/types/domain.ts:34-38` - Reservation check-in fields.
- `__tests__/mockApi.test.ts:38-55,101-119` - API lifecycle and check-in behavior tests.
- `__tests__/BookingScreen.test.tsx:95-127` - Confirmation and direct check-in route tests.

## Architecture Insights

The current separation is intentionally small and appropriate: the mock API owns simulated server state, React Query owns asynchronous mutation state, and route components compose reusable form and action primitives. Check-in should continue to be modeled as a reservation mutation rather than a separate attendance service.

The standalone route and confirmation action are two entry points over the same `checkIn` contract. The API normalizes defensively even though the form schema already normalizes, which keeps non-UI callers safe. The success result is route-local UI state derived from the mutation response; no global client store is necessary.

## Historical Context (from prior changes)

- The archived reservation-flow plan preserves both direct confirmation check-in and standalone `/check-in`, while explicitly excluding persistence, authentication, QR scanning, deep links, and a real backend ([`context/archive/2026-08-28-reservation-flow/plan.md:5-29`](../../archive/2026-08-28-reservation-flow/plan.md:5)).
- Its implementation review confirms that direct confirmation check-in was added without removing the separate manual entry route ([`context/archive/2026-08-28-reservation-flow/reviews/impl-review.md:53-61`](../../archive/2026-08-28-reservation-flow/reviews/impl-review.md:53)).
- The station-discovery plan treats reservation, confirmation, and check-in as separate feature boundaries ([`context/changes/station-discovery/plan.md:5-27`](../station-discovery/plan.md:5)).

## Related Research

- [`context/archive/2026-08-28-reservation-flow/research.md`](../../archive/2026-08-28-reservation-flow/research.md)
- [`context/changes/station-discovery/research.md`](../station-discovery/research.md)

## Open Questions

- Should this change primarily formalize the already-present flow with dedicated `CheckInScreen` route tests, or is additional user-visible behavior intended beyond the current implementation?
- If additional behavior is desired, should it remain a manual code-entry flow, or introduce a separate capability such as QR scanning? Historical decisions currently exclude QR scanning.
- Should the simulated reservation state remain in memory, consistent with the existing portfolio/demo scope, or is persistence now required?
