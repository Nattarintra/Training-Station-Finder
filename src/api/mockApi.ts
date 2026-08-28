import { stations } from '@/src/api/fixtures';
import { Reservation, ReservationInput, Station } from '@/src/types/domain';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code:
      'NOT_FOUND' | 'SLOT_UNAVAILABLE' | 'INVALID_CODE' | 'STATIONS_UNAVAILABLE',
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const reservations = new Map<string, Reservation>();
export type StationListScenario = 'success' | 'empty' | 'error';

let stationListScenario: StationListScenario = 'success';
const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

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
  return stations.slice().sort((a, b) => a.distanceKm - b.distanceKm);
}

export async function getStation(id: string): Promise<Station> {
  await wait(250);
  const station = stations.find((item) => item.id === id);
  if (!station)
    throw new ApiError('We could not find that training station.', 'NOT_FOUND');
  return station;
}

export async function createReservation(input: ReservationInput): Promise<Reservation> {
  await wait(550);
  const station = stations.find((item) => item.id === input.stationId);
  const slot = station?.slots.find((item) => item.id === input.slotId);

  // This slot simulates another person taking the final place before submission.
  if (!slot || slot.availability === 'unavailable' || slot.id === 'harbor-race') {
    throw new ApiError(
      'That time was just reserved by someone else. Please choose another slot.',
      'SLOT_UNAVAILABLE',
    );
  }

  const id = `reservation-${Date.now()}`;
  const bookingCode = `TSF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const reservation: Reservation = {
    ...input,
    id,
    bookingCode,
    createdAt: new Date().toISOString(),
    checkedInAt: null,
  };
  reservations.set(id, reservation);
  return reservation;
}

export async function getReservation(id: string): Promise<Reservation> {
  await wait(200);
  const reservation = reservations.get(id);
  if (!reservation)
    throw new ApiError('This booking is no longer available.', 'NOT_FOUND');
  return reservation;
}

export async function checkIn(bookingCode: string): Promise<Reservation> {
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
  const updated = {
    ...reservation,
    checkedInAt: reservation.checkedInAt ?? new Date().toISOString(),
  };
  reservations.set(updated.id, updated);
  return updated;
}

export function resetMockApi() {
  reservations.clear();
  stationListScenario = 'success';
}
