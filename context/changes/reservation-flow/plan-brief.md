# Reservation Flow — Plan Brief

> Full plan: `context/changes/reservation-flow/plan.md`
> Research: `context/changes/reservation-flow/research.md`

## What & Why

Harden the existing reservation journey so users get reliable form validation, one reservation per submission intent, clear recovery when a slot is taken, and a complete confirmation ticket with QR code. The visible flow mostly exists today; this plan closes the API idempotency and route-test gaps.

## Starting Point

Home, station details, reservation form, confirmation, QR rendering, and code-based check-in are already wired through Expo Router and TanStack Query. UI pending guards and typed stale-slot conflicts exist, but repeated accepted API calls can still create duplicate reservations, and route-level reservation/confirmation tests are missing.

## Desired End State

A stable idempotency key makes repeated requests for one logical submission return the original booking without double-consuming capacity. Invalid forms, pending submits, stale-slot conflicts, confirmation states, QR semantics, and check-in navigation are all covered by focused tests and verified in Expo SDK 54 previews.

## Key Decisions Made

| Decision               | Choice                                                                | Why                                                                              | Source   |
| ---------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------- |
| Duplicate prevention   | API-level idempotency plus existing UI pending guard                  | UI protection handles taps; API protection handles repeated requests and retries | Research |
| Availability authority | Keep final check in mock API and refetch station detail on focus      | Preserves the existing single source of truth and conflict-refresh pattern       | Research |
| QR scope               | Rendered demonstration booking pass only                              | Scanning, signing, expiry, and replay prevention would expand scope materially   | Research |
| Architecture           | Extend fixture → API → query → route layering                         | Matches established project patterns and avoids unnecessary abstractions         | Research |
| Verification           | Jest/RNTL behavior tests plus Expo 54 checks and manual smoke testing | Matches repository quality gates and accessibility conventions                   | Plan     |

## Scope

**In scope:**

- Stable reservation idempotency contract and mock API deduplication
- Existing Zod form validation and pending-submit behavior
- Typed unavailable-slot recovery and refreshed availability
- Confirmation ticket and stable QR payload/accessibility contract
- Reservation and confirmation route tests
- Expo SDK 54, type, lint, format, test, and web-export verification

**Out of scope:**

- Backend, persistence, authentication, payment, QR scanning, sharing, deep links, signed tokens, expiry, and replay prevention

## Architecture / Approach

The form creates a stable request key and calls the existing mock API. The API checks completed keys before capacity accounting, then performs the existing authoritative slot check and returns a reservation. Success routes to confirmation; typed conflicts return to station details, whose focus refetch updates availability. Confirmation keeps the current booking-code QR renderer.

## Phases at a Glance

| Phase                        | What it delivers                                       | Key risk                                                 |
| ---------------------------- | ------------------------------------------------------ | -------------------------------------------------------- |
| 1. Idempotent API            | Command contract, deduplication, route submit coverage | Key lifecycle must distinguish retries from new attempts |
| 2. Recovery and confirmation | Conflict/refresh protection and confirmation/QR tests  | Avoid changing the existing user-visible QR contract     |
| 3. Expo verification         | Full quality gate, SDK 54 validation, truthful docs    | Expo-facing edits require versioned documentation review |

**Prerequisites:** Existing `reservation-flow` research and the current Expo SDK 54 project.
**Estimated effort:** ~2–3 implementation sessions across 3 phases.

## Open Risks & Assumptions

- The in-memory idempotency map is a prototype substitute; production would need server-side durable semantics.
- Existing direct `createReservation` test callers must adopt the new key contract or use a compatibility boundary.
- QR remains display-only and is not a secure attendance credential.

## Success Criteria (Summary)

- One logical submission creates one booking and decrements capacity once, even if the request is repeated.
- Users can recover from stale-slot conflicts and see refreshed availability without silent slot substitution.
- Confirmation reliably shows booking details, accessible QR pass, and check-in action across tested states.
