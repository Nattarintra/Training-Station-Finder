<!-- IMPL-REVIEW-REPORT -->

# Implementation Review: Reservation Flow

- **Plan**: `context/changes/reservation-flow/plan.md`
- **Scope**: Phases 1–3
- **Date**: 2026-08-28
- **Verdict**: APPROVED
- **Findings**: 0 critical, 4 warnings, 1 observation

## Verdicts

| Dimension           | Verdict |
| ------------------- | ------- |
| Plan Adherence      | PASS    |
| Scope Discipline    | PASS    |
| Safety & Quality    | PASS    |
| Architecture        | PASS    |
| Pattern Consistency | PASS    |
| Success Criteria    | PASS    |

## Verification

- `npm test -- --runInBand`: 8 suites, 39 tests passed
- `npm run format:check`: passed
- `npm run typecheck`: passed
- `npm run lint`: passed
- `npx expo install --check`: dependencies up to date using the local SDK 54 map; network was unavailable
- `npx expo export --platform web --output-dir /tmp/training-station-finder-web-review`: passed; 7 routes exported

## Findings

### F1 — Idempotency metadata leaks into reservation objects

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `src/api/mockApi.ts:115-123`
- **Detail**: The reservation is built with `...input`, so `idempotencyKey` is stored on the runtime reservation object even though the plan explicitly says request metadata must not leak into the persisted/display model.
- **Fix**: Destructure `idempotencyKey` before constructing the `Reservation`, and spread only the reservation fields.
- **Decision**: FIXED — destructured `idempotencyKey` before constructing the reservation and added a regression assertion.

### F2 — Empty idempotency keys are accepted at the API boundary

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence
- **Location**: `src/api/mockApi.ts:73-94`
- **Detail**: The approved contract requires a non-empty key, but direct API callers can submit an empty or whitespace-only key. The route generates a valid key, so this does not affect the normal UI path.
- **Fix**: Trim and validate `input.idempotencyKey` at the API boundary, throw typed `INVALID_REQUEST` for empty values, and add a focused test.
- **Decision**: FIXED — the API now trims and rejects empty keys with `INVALID_REQUEST`, with regression coverage.

### F3 — Automatic check-in is not documented as a plan-contract change

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence
- **Location**: `app/booking/[id].tsx:101-113`; `__tests__/BookingScreen.test.tsx:108-126`
- **Detail**: The approved plan specifies navigation to `/check-in` with the booking code. The implemented UX intentionally performs check-in directly and shows “Check-in complete,” matching the user’s later direction. The plan and test wording still describe the older code-entry/navigation contract.
- **Fix**: Update the plan’s confirmation contract, success criteria, and test wording to explicitly document direct check-in from confirmation. Preserve the separate manual check-in route for users entering a code from elsewhere.
- **Decision**: FIXED — updated the plan and verification wording to document direct confirmation check-in, explicit success, and the retained manual `/check-in` route.

### F4 — Failed mutation clears the retry key for ambiguous failures

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: `app/reserve.tsx:34-40`
- **Detail**: `onError` clears the route-local idempotency key for every failure. If a real backend committed the reservation but the response was lost, a retry would generate a new key and could create a duplicate. The current mock API does not simulate that transport ambiguity, but the lifecycle conflicts with the plan’s “stable for retries” requirement.
- **Fix**: Preserve the key for retryable/ambiguous failures and generate a new key only when the user changes the reservation intent or explicitly starts over. Keep a new key for a confirmed slot-conflict recovery path if desired.
- **Decision**: FIXED — deterministic `ApiError` failures clear the key, while unknown/ambiguous failures preserve it for safe retries.

### F5 — Supporting UI variants and formatting edits are outside the listed file scope

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: `src/components/Button.tsx`, `src/components/StateView.tsx`, `app/index.tsx`, `app/check-in.tsx`, and two formatting-only review files
- **Detail**: The implementation adds shared danger/neutral variants, applies danger styling to retry actions, retains the manual check-in screen, and formats two unrelated review files. These changes are benign and the error styling follows the user’s explicit direction, but they are not all listed in the plan’s Changes Required sections.
- **Fix**: Add a short plan addendum documenting the approved supporting UI/error-state changes and the intentionally retained manual check-in entry point; note the unrelated formatting-only files separately.
- **Decision**: FIXED — added an implementation-review addendum documenting the approved supporting UI variants, retained manual check-in route, and formatting-only changes.
