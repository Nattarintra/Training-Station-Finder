---
date: 2026-08-28T14:00:50+02:00
researcher: Natta
git_commit: a662389adc16e42ea15dabfb5c3d303717e15123
branch: master
repository: Training-Station-Finder
topic: 'Improve station details, slot presentation, and selection behavior'
tags: [research, codebase, station-details, slots, selection, accessibility]
status: complete
last_updated: 2026-08-28
last_updated_by: Natta
---

# Research: Improve station details, slot presentation, and selection behavior

**Date**: 2026-08-28T14:00:50+02:00  
**Researcher**: Natta  
**Git Commit**: a662389adc16e42ea15dabfb5c3d303717e15123  
**Branch**: master  
**Repository**: Training-Station-Finder

## Research Question

How should the station details screen improve station information, time-slot presentation, and selection behavior while preserving the existing Expo/TanStack Query architecture?

## Summary

Station details is implemented entirely in `app/station/[id].tsx`. The screen already has loading, error/retry, station metadata, amenities, empty-slot, and populated-slot branches. However, slot selection is only immediate navigation: each row is a plain `View` with a `Select` button that pushes to `/reserve`; there is no selected-slot state, visual selection, or explicit continue action.

The highest-value improvements are to make each slot's action contextual and stateful, distinguish available/limited/full states more clearly, make row layout resilient to localized text and larger Dynamic Type, and add route-level tests. Reservation submission can discover stale availability (`SLOT_UNAVAILABLE`), but returning to details currently does not explicitly refetch or invalidate the detail query, so conflict recovery can leave the displayed slot stale.

The existing layering should remain: fixture data → mock API → TanStack Query hooks → Expo Router screens, with shared `Button`, `Screen`, `StateView`, theme tokens, and formatters. No new repository layer or global store is indicated.

## Detailed Findings

### Detail route and data flow

- `StationDetailScreen` reads the route `id`, calls `useStation`, and renders pending, error, and success branches (`app/station/[id].tsx:41-65`).
- The success view presents a station header, amenities, “Choose a time”, slot content, and an availability note inside the shared scrollable `Screen` (`app/station/[id].tsx:66-109`).
- `useStation` uses the stable `['stations', id]` query key and calls `getStation` (`src/features/stations/queries.ts:14-19`). The mock API waits, finds the station, and throws typed `NOT_FOUND` errors for missing IDs (`src/api/mockApi.ts:37-43`).
- The domain model keeps slots nested on each station. A slot has ISO start/end times, an availability union, and `placesLeft` (`src/types/domain.ts:1-20`). Fixtures exercise available, limited, unavailable, and a one-place race/conflict slot (`src/api/fixtures.ts:20-86`).

### Current slot presentation and interaction

- `SlotRow` computes only an `unavailable` boolean; the row itself is not interactive (`app/station/[id].tsx:13-17`).
- Date icon, localized date/time, and places-left copy are rendered as separate text nodes. Limited slots only change the places text color; unavailable rows are reduced to 60% opacity (`app/station/[id].tsx:18-26`, `app/station/[id].tsx:162-175`).
- Available and limited slots both expose the same `Select` label; unavailable slots expose `Full` and disable the button (`app/station/[id].tsx:28-36`). This makes multiple actions indistinguishable to assistive technology because the label does not include date/time or station context.
- Pressing an available or limited slot immediately pushes `/reserve` with `stationId` and `slotId` (`app/station/[id].tsx:32-34`). There is no local selected ID, selected styling, press/loading guard, or confirmation/continue affordance.
- Fixed `minHeight: 104`, horizontal row layout, and `minWidth: 82` button sizing can be fragile for long localized content or larger text (`app/station/[id].tsx:151-176`).
- Date/time formatting is device locale/time-zone based, with no venue timezone field (`src/utils/format.ts:1-14`).

### Reservation coupling and stale availability

- The reserve route consumes `stationId` and `slotId`, reloads the station, and looks up the slot independently (`app/reserve.tsx:17-23`, `app/reserve.tsx:49-59`).
- `createReservation` rejects unavailable slots and the `harbor-race` fixture with typed `SLOT_UNAVAILABLE` (`src/api/mockApi.ts:45-55`). This intentionally models another user taking the final place after selection.
- Conflict recovery uses `router.back()` from the reserve screen (`app/reserve.tsx:140-153`), but no explicit detail-query invalidation/refetch is performed. The detail screen may therefore continue to show a stale “1 place left” race slot until a normal query refresh occurs.

### Shared UI and quality conventions

- Shared `Button` already supplies minimum touch-target sizing and disabled/busy accessibility semantics (`src/components/Button.tsx:28-41`, `src/components/Button.tsx:57-77`). A selection implementation can reuse this contract.
- `StateView` is the shared loading/error/empty presentation and supports action loading (`src/components/StateView.tsx:6-37`).
- Theme tokens for colors, spacing, and radii are centralized in `src/theme/index.ts`; the detail route already uses them.
- Tests use React Native Testing Library and accessibility roles (`__tests__/StationCard.test.tsx`, `__tests__/HomeScreen.test.tsx`). There is currently no detail-route or `SlotRow` test.
- Strict TypeScript and formatting conventions are enabled (`tsconfig.json`, `.prettierrc`); the project targets Expo SDK 54 / React Native 0.81 / Expo Router 6 (`package.json`). Repository instructions require consulting the exact Expo v54 docs before writing implementation code.

## Code References

- `app/station/[id].tsx:13-39` - Slot row rendering and immediate reservation navigation.
- `app/station/[id].tsx:41-109` - Detail query states, station content, amenities, slot list, and no-slots state.
- `app/station/[id].tsx:151-177` - Slot sizing, opacity, and button layout styles.
- `src/features/stations/queries.ts:14-19` - Station detail query key and hook.
- `src/api/mockApi.ts:37-55` - Station lookup and stale slot conflict behavior.
- `src/types/domain.ts:1-20` - Slot and station domain contracts.
- `src/utils/format.ts:1-14` - Locale/device-time date and time formatters.
- `app/reserve.tsx:49-67` - Slot lookup and typed unavailable handling.
- `app/reserve.tsx:140-153` - Conflict recovery back navigation.
- `src/components/Button.tsx:28-41` - Disabled/loading accessibility and press behavior.
- `src/components/StateView.tsx:6-37` - Shared state presentation and action loading.

## Architecture Insights

The current architecture is intentionally small and appropriate for this feature. Detail improvements should stay at the route/component boundary and continue consuming server-shaped query state. Selection state is UI state and can remain local to the detail screen; a global store would add complexity without another consumer.

The reservation API remains the source of truth for final availability. Any improved selection UI should preserve the existing conflict error path and, after returning from a conflict, invalidate or refetch the station detail query so the user sees updated availability. Contextual accessibility labels should be derived from the same formatted date/time and availability copy rendered visually.

For layout, flexible text wrapping/stacking is safer than fixed-width assumptions. The current fixture has only a few slots, so virtualization or a new list abstraction is not warranted.

## Historical Context (from prior changes)

`context/changes/station-discovery/plan.md` explicitly kept “station details, slot selection, reservation, confirmation, or check-in behavior” out of scope. Its research established and preserved the fixture → mock API → TanStack Query → Expo Router layering and shared accessibility conventions. No archived changes were found beyond `context/archive/.gitkeep`.

## Related Research

- `context/changes/station-discovery/research.md` - Discovery state, shared UI, testing, and architecture findings.
- `context/changes/station-discovery/plan.md` - Prior scope boundary and implementation conventions.

## Open Questions

- Should selecting a slot continue directly to the reservation form, or should the detail screen support persistent selection plus a separate “Continue” action?
- Should slots be grouped by date or summarized by availability before listing individual times?
- Should conflict recovery invalidate the detail query in the reserve route, or should the detail screen refetch on focus/route return?
- What exact visual distinction is desired for available versus limited slots while preserving the existing design tokens?
- Which localized/large-text viewport should be used for manual verification of the flexible row layout?
