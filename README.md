# Training Station Finder

A portfolio-quality Expo application for discovering nearby practice stations, reserving a time, receiving a QR booking pass, and simulating on-site check-in.

This is an original, independent portfolio concept. It is not affiliated with or endorsed by Laerdal or any other training provider.

## Highlights

- Nearby stations ordered by deterministic mock distance
- Station details, amenities, capacity, and available time slots
- Strictly validated contact form with duplicate submission protection
- Recoverable conflict when another user takes the last slot
- Booking confirmation with QR and human-readable booking codes
- Simulated code-based check-in with invalid-code feedback
- Loading, empty, error/retry, unavailable, and success states
- Accessible names, state announcements, and minimum 48-point controls
- Responsive content width for common phones and tablets

## Run locally

Requirements: Node.js 22+, npm, and an iOS Simulator, Android Emulator, or compatible Expo client.

```bash
npm ci
npm start
```

Then press `i` for iOS, `a` for Android, or scan the QR code. Quality commands:

```bash
npm run typecheck
npm run lint
npm test
npm run format:check
```

No environment variables are required, so there is intentionally no `.env.example`.

## Demo path

1. In development, use **Development preview** on the home screen to demonstrate normal, empty, and error station responses. Return it to **Normal** afterward.
2. Open **Harbor Skills Hub**.
3. Select a normal available slot, then press **Continue** to complete the form and see confirmation and QR check-in.
4. To see conflict recovery, choose the Harbor slot with one place left. The mock API simulates that final place being taken during submission.
5. Check in from confirmation; the code is prefilled. A made-up code demonstrates the invalid-code state.

The preview controls are guarded by `__DEV__` and are not rendered in production-mode apps or exports.

## Architecture

```text
app/                       Expo Router routes and navigation composition
src/api/                   Async mock API and station fixtures
src/components/            Reusable controls and screen/state primitives
src/features/bookings/     Booking and check-in validation schemas
src/features/stations/     Station query hooks and domain UI
src/providers/             Application providers and query policy
src/theme/                 Small visual token set
src/types/                 Strict domain contracts
src/utils/                 Presentation formatting
__tests__/                 API lifecycle, validation, and accessibility tests
.github/workflows/         CI quality gate
```

TanStack Query owns asynchronous server-like state and retry policy. The API boundary uses delays and typed errors to behave like a network service while retaining an entirely in-memory implementation. React Hook Form limits rerenders and Zod provides one validation contract. Expo Router keeps screens addressable without another navigation abstraction.

The booking map lives inside the mock API module. This is intentionally session-only: reloading the JavaScript bundle clears reservations.

## Data model

- `Station`: identity, address, area, distance, content, amenities, and slots.
- `TimeSlot`: start/end timestamps, availability state, and remaining capacity.
- `ReservationInput`: station/slot references plus name, email, and phone.
- `Reservation`: input data plus ID, booking code, creation time, and optional check-in time.
- `ApiError`: a recoverable typed code for missing records, unavailable slots, or invalid booking codes.

## Testing

Jest tests cover contact and code validation, normalization, station sorting and response scenarios, missing records, the reservation-to-check-in lifecycle, concurrent slot conflict, invalid codes, discovery screen states and retry behavior, station navigation, and accessible component interactions. React Native Testing Library exercises behavior through accessibility roles.

CI runs clean install, formatting verification, strict type-checking, lint, and tests for pushes to `main` and pull requests.

## Trade-offs

- Location uses stable sample distances. Device permission and geospatial handling require native/privacy work beyond this journey.
- Reservation state is not persisted. This keeps the no-backend exercise honest while preserving a replaceable API-shaped boundary.
- QR data uses a custom demonstration payload. Entry is simulated because camera permissions are outside the requested scope.
- Dates are relative to device time and use the device locale. A production API would supply venue timezone metadata.
- The app uses one light theme. Semantic tokens keep dark mode incremental.

## Screenshots

Add simulator captures here before publishing the portfolio repository:

| Nearby stations | Choose a time | Booking QR   | Check-in     |
| --------------- | ------------- | ------------ | ------------ |
| _Screenshot_    | _Screenshot_  | _Screenshot_ | _Screenshot_ |

Recommended capture sizes are iPhone 15/16 and a compact Android device to show layout adaptability.

## Production improvements

- Replace mocks with authenticated HTTPS endpoints, idempotency keys, server validation, and durable reservations.
- Add consent-based device location, distance units, map/list choice, and manual-location fallback.
- Implement server-authoritative slot holds, expiry, realtime availability, and offline-aware retries.
- Define secure data storage, retention/consent policies, telemetry redaction, and privacy/security review.
- Add camera QR scanning, signed payloads, replay prevention, and a real attendance integration.
- Add analytics, crash reporting, flags, deep-link validation, localization, dark mode, and device E2E tests.
- Introduce EAS profiles, environment separation, signed releases, staged rollout, and monitoring.
- Perform VoiceOver/TalkBack, dynamic type, reduced-motion, contrast, slow-network, and device QA.

## Scope boundaries

There is no database, authentication, payment flow, production location tracking, or real certification/attendance service. All people, stations, addresses, and codes are fictional.
