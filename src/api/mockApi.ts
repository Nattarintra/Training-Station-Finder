import { stations } from '@/src/api/fixtures';
import { CheckInResult, CreateReservationInput, Reservation, Station } from '@/src/types/domain';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'NOT_FOUND'
      | 'SLOT_UNAVAILABLE'
      | 'INVALID_CODE'
      | 'STATIONS_UNAVAILABLE'
      | 'INVALID_REQUEST',
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const reservations = new Map<string, Reservation>();
const idempotentReservations = new Map<
  string,
  { fingerprint: string; reservation: Reservation }
>();
const forcedUnavailableSlots = new Set<string>();
const reservedPlaces = new Map<string, number>();
export type StationListScenario = 'success' | 'empty' | 'error';

let stationListScenario: StationListScenario = 'success';
const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));
const slotKey = (stationId: string, slotId: string) => `${stationId}:${slotId}`;

function snapshotStation(station: Station): Station {
  return {
    ...station,
    slots: station.slots.map((slot) => {
      const placesLeft = Math.max(
        0,
        slot.placesLeft - (reservedPlaces.get(slotKey(station.id, slot.id)) ?? 0),
      );
      const unavailable =
        forcedUnavailableSlots.has(slotKey(station.id, slot.id)) || placesLeft === 0;
      return unavailable
        ? { ...slot, availability: 'unavailable', placesLeft: 0 }
        : { ...slot, placesLeft };
    }),
  };
}

export function setStationListScenario(scenario: StationListScenario) {
  stationListScenario = scenario;
}

export async function getStations(): Promise<Station[]> {
  await wait();
  if (stationListScenario === 'error') {
    throw new ApiError(
      'Nearby stations are temporarily unavailable. Please try again.',
      'STATIONS_UNAVAILABLE',
    );
  }
  if (stationListScenario === 'empty') return [];
  return stations.map(snapshotStation).sort((a, b) => a.distanceKm - b.distanceKm);
}

export async function getStation(id: string): Promise<Station> {
  await wait(250);
  const station = stations.find((item) => item.id === id);
  if (!station)
    throw new ApiError('We could not find that training station.', 'NOT_FOUND');
  return snapshotStation(station);
}

export async function createReservation(
  input: CreateReservationInput,
): Promise<Reservation> {
  await wait(550);
  const idempotencyKey = input.idempotencyKey.trim();
  if (!idempotencyKey) {
    throw new ApiError('A reservation request key is required.', 'INVALID_REQUEST');
  }
  const reservationInput = {
    stationId: input.stationId,
    slotId: input.slotId,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
  };
  const fingerprint = JSON.stringify({
    stationId: reservationInput.stationId,
    slotId: reservationInput.slotId,
    fullName: reservationInput.fullName,
    email: reservationInput.email,
    phone: reservationInput.phone,
  });
  const previous = idempotentReservations.get(idempotencyKey);
  if (previous) {
    if (previous.fingerprint !== fingerprint) {
      throw new ApiError(
        'This reservation request key has already been used.',
        'INVALID_REQUEST',
      );
    }
    return previous.reservation;
  }
  const station = stations.find((item) => item.id === input.stationId);
  const slot = station
    ? snapshotStation(station).slots.find((item) => item.id === input.slotId)
    : undefined;

  // This slot simulates another person taking the final place before submission.
  if (!slot || slot.availability === 'unavailable' || slot.id === 'harbor-race') {
    if (slot?.id === 'harbor-race') {
      forcedUnavailableSlots.add(slotKey(input.stationId, input.slotId));
    }
    throw new ApiError(
      'That time was just reserved by someone else. Please choose another slot.',
      'SLOT_UNAVAILABLE',
    );
  }

  const key = slotKey(input.stationId, input.slotId);
  reservedPlaces.set(key, (reservedPlaces.get(key) ?? 0) + 1);

  const id = `reservation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const bookingCode = `TSF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const reservation: Reservation = {
    ...reservationInput,
    id,
    bookingCode,
    createdAt: new Date().toISOString(),
    checkedInAt: null,
  };
  reservations.set(id, reservation);
  idempotentReservations.set(idempotencyKey, { fingerprint, reservation });
  return reservation;
}

export async function getReservation(id: string): Promise<Reservation> {
  await wait(200);
  const reservation = reservations.get(id);
  if (!reservation)
    throw new ApiError('This booking is no longer available.', 'NOT_FOUND');
  return reservation;
}

export async function checkIn(bookingCode: string): Promise<CheckInResult> {
  await wait(450);
  const normalized = bookingCode.trim().toUpperCase();
  const reservation = [...reservations.values()].find(
    (item) => item.bookingCode === normalized,
  );
  if (!reservation)
    throw new ApiError(
      'Booking code not found. Check the code and try again.',
      'INVALID_CODE',
    );
  const alreadyCheckedIn = reservation.checkedInAt !== null;
  const updated = {
    ...reservation,
    checkedInAt: reservation.checkedInAt ?? new Date().toISOString(),
    alreadyCheckedIn,
  };
  reservations.set(updated.id, updated);
  return updated;
}

export function resetMockApi() {
  reservations.clear();
  idempotentReservations.clear();
  forcedUnavailableSlots.clear();
  reservedPlaces.clear();
  stationListScenario = 'success';
}
