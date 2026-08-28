<!-- PLAN-REVIEW-REPORT -->

# Plan Review: Reservation Flow Implementation Plan

- **Plan**: `context/changes/reservation-flow/plan.md`
- **Mode**: Deep
- **Date**: 2026-08-28
- **Verdict**: SOUND
- **Findings**: 0 critical, 0 warnings, 0 observations (3 resolved)

## Verdicts

| Dimension             | Verdict |
| --------------------- | ------- |
| End-State Alignment   | PASS    |
| Lean Execution        | PASS    |
| Architectural Fitness | PASS    |
| Blind Spots           | PASS    |
| Plan Completeness     | PASS    |

## Grounding

6/6 target paths present ✓, symbols verified ✓, brief↔plan consistent ✓. No `docs/reference/contract-surfaces.md` exists; contract-surface scan skipped.

## Findings

### F1 — Idempotency migration contract is underspecified

- **Severity**: ⚠️ WARNING
- **Impact**: 🔬 HIGH — architectural stakes; think carefully before deciding
- **Dimension**: Blind Spots
- **Location**: Phase 1 — Reservation command and domain types; Migration Notes
- **Detail**: `createReservation` currently accepts `ReservationInput` only (`src/api/mockApi.ts:65`), the route calls it without a key (`app/reserve.tsx:61-64`), and existing API tests call it without a key (`__tests__/mockApi.test.ts:38-45`, `64`). The capacity test intentionally submits the same object six times. Deriving an idempotency key from input would collapse that test from six reservations to one; requiring a key requires all direct callers to be updated. The plan currently leaves “required command/key contract” versus “compatibility overload” as an implementation choice.
- **Fix**: Specify one required create command shape, update the route and all direct tests to provide explicit keys, and make the six-capacity test use six distinct keys. Do not retain compatibility as an unresolved alternative.
- **Decision**: RESOLVED — the plan now requires an explicit `CreateReservationInput` with a required key, updates every direct caller, uses distinct keys for capacity tests, and rejects key reuse with different input.

### F2 — Route-test mocking boundaries need concrete fixtures

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Completeness
- **Location**: Phase 2 — Route behavior tests
- **Detail**: The proposed public-boundary strategy is feasible and matches `__tests__/StationDetailScreen.test.tsx:11-22`, but `app/reserve.tsx` directly imports TanStack Query `useMutation` and `app/booking/[id].tsx` directly imports `useQuery`. Without explicit mock return shapes, tests may accidentally depend on a Query Client or native QR rendering.
- **Fix**: Require mocks for `useMutation`, `useQuery`, `useStation`, and router methods with minimal pending/success/error fixtures, plus a `react-native-qrcode-svg` mock that exposes/asserts its `value` prop.
- **Decision**: RESOLVED — the plan now specifies `useMutation`, `useQuery`, `useStation`, and router fixtures plus a QR component mock exposing `value`.

### F3 — Dynamic route assertion should use the concrete path

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 1 — Reservation route request lifecycle
- **Detail**: The plan describes `router.replace('/booking/[id]')`, while the live implementation uses `/booking/${data.id}` (`app/reserve.tsx:34`). Tests should assert the concrete dynamic route format.
- **Fix**: Change the plan wording to “`router.replace('/booking/${data.id}')`” and assert the concrete ID in route tests.
- **Decision**: RESOLVED — the plan now names the concrete `router.replace(`/booking/${data.id}`)` contract and requires asserting the concrete ID.

## Verified Claims

- Focus refetch and conflict recovery are implemented as claimed (`app/reserve.tsx:140-153`, `app/station/[id].tsx:88-104`).
- The QR scope and payload are stable and have no other consumer (`app/booking/[id].tsx:80-90`).
- The `createReservation` blast radius is limited to the API, reserve route, domain types, and direct API tests.
- Existing patterns to reuse include `resetMockApi`, typed `ApiError`, `beforeEach(resetMockApi)`, public-boundary Jest mocks, query result fixtures, shared UI primitives, and guarded `useFocusEffect`.
