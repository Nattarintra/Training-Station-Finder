# Station Details Review Follow-ups

Source: `context/changes/station-details/reviews/impl-review.md`
Triaged: 2026-08-28

## F1 — Add missing detail-route branch tests

Decision: Fix now.

Add route-level tests for pending/loading, error/retry, station metadata and amenities, and the no-slots state. Keep the existing public-boundary mocks for `useStation`, Expo Router, and focus lifecycle.

## F3 — Harden zero-capacity handling

Decision: Fix now.

Derive a slot’s unavailable state from either `availability === 'unavailable'` or `placesLeft <= 0`, reuse the predicate for selection cleanup/status copy, and add a regression test for inconsistent zero-capacity input.

## F2 — Document capacity persistence

Decision: Document in the plan.

The plan addendum records that successful reservations decrement capacity, clamp at zero, transition slots to full, and reject further bookings.

## F4 — Document the Back button

Decision: Document in the plan.

The plan addendum records the accessible Back control as a user-requested UX adjustment.
