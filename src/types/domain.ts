export type SlotAvailability = 'available' | 'limited' | 'unavailable';

export interface TimeSlot {
  id: string;
  startsAt: string;
  endsAt: string;
  availability: SlotAvailability;
  placesLeft: number;
}

export interface Station {
  id: string;
  name: string;
  address: string;
  area: string;
  distanceKm: number;
  description: string;
  amenities: string[];
  slots: TimeSlot[];
}

export interface ReservationInput {
  stationId: string;
  slotId: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface CreateReservationInput extends ReservationInput {
  idempotencyKey: string;
}

export interface Reservation extends ReservationInput {
  id: string;
  bookingCode: string;
  createdAt: string;
  checkedInAt: string | null;
}

export interface CheckInResult extends Reservation {
  alreadyCheckedIn: boolean;
}
