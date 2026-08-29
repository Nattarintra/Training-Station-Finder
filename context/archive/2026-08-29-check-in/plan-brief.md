# Booking-Code Check-In and Simulated Result — Plan Brief

> Full plan: `context/changes/check-in/plan.md`
> Research: `context/changes/check-in/research.md`

## What & Why

The booking-code check-in experience is already present in the app: users can enter a code, receive a simulated result, and return home. This plan formalizes that behavior with dedicated route-level tests and distinguishes a first check-in from a code that has already been checked in.

## Starting Point

`app/check-in.tsx` uses the shared form and button components, React Query mutation state, and the in-memory `checkIn` mock API. Existing tests cover validation, API lifecycle, and direct check-in from the booking confirmation screen, but no test directly covers the standalone route or distinguishes repeat check-ins in the UI.

## Desired End State

The standalone `/check-in` route has behavior-level coverage for prefilled codes, validation, normalized submission, pending protection, invalid-code errors, first-time and repeat result content, and Done navigation. The mock result contract reports repeat state, and both existing check-in surfaces render the correct message.

## Key Decisions Made

| Decision          | Choice                                                          | Why                                                                                       | Source   |
| ----------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------- |
| Scope             | Add route-level tests around the existing flow                  | The requested UI and API behavior already exist                                           | Research |
| Test boundary     | Mock Expo Router and React Query public hooks                   | Matches existing `BookingScreen` and `ReserveScreen` tests                                | Research |
| API/state model   | Keep in-memory `Reservation.checkedInAt` and `checkIn` mutation | Preserves established simulated architecture                                              | Research |
| Repeat result     | Return an `alreadyCheckedIn` result flag before updating state  | Lets both UI entry points distinguish first and repeated requests without a second lookup | Plan     |
| Feature expansion | No QR scanning, persistence, authentication, or backend         | Historical reservation decisions exclude these capabilities                               | Research |
| Verification      | Focused test plus full Jest, typecheck, lint, and format checks | Fits repository quality conventions                                                       | Plan     |

## Scope

**In scope:**

- Add `__tests__/CheckInScreen.test.tsx`.
- Cover all manual route states and interactions.
- Run and record repository verification commands.
- Add route-level tests and keep the required plan/change handoff artifacts current.

**Out of scope:**

- Unrelated production UI/API redesign.
- QR scanning, persistence, authentication, backend, or new dependencies.
- Changes to the booking confirmation check-in path.

## Architecture / Approach

The test exercises the existing route boundary:

`CheckInScreen` → `useMutation(checkIn)` → mocked mutation result → rendered form/error/success branch

Expo Router hooks and React Query are mocked as existing screen tests do; assertions use accessible UI roles and labels.

## Phases at a Glance

| Phase                        | What it delivers                                             | Key risk                                                 |
| ---------------------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| 1. Manual route coverage     | Repeat-aware result contract and dedicated `/check-in` tests | Keeping API flag and both result surfaces aligned        |
| 2. Regression verification   | Full repository quality gate and phone-sized smoke checks    | Existing dirty worktree may obscure unrelated failures   |
| 3. Documentation and handoff | Complete plan progress and review-ready artifacts            | Progress drift if implementation skips canonical entries |

**Prerequisites:** Existing `check-in` research and current Expo SDK 54 project setup.  
**Estimated effort:** ~1 focused implementation session across 3 small phases.

## Open Risks & Assumptions

- The current production route is treated as the intended behavior; any product change beyond test coverage requires a new planning decision.
- The repository has pre-existing uncommitted changes, so verification results should be interpreted against the current worktree.
- Manual testing requires a generated reservation code because mock reservations are held only in app memory.

## Success Criteria (Summary)

- A first-time valid booking code reaches a visible simulated success result with attendee name and code.
- A repeat code clearly reports that it has already been checked in.
- Invalid and pending states are covered, understandable, and protected from duplicate submissions.
- Focused and full automated verification passes without changing the established check-in architecture.
