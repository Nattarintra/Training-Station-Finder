import {
  checkIn,
  createReservation,
  getStation,
  getStations,
  resetMockApi,
  setStationListScenario,
} from '@/src/api/mockApi';

describe('mock API booking lifecycle', () => {
  beforeEach(resetMockApi);

  it('returns nearby stations sorted by distance', async () => {
    const result = await getStations();
    expect(result).toHaveLength(3);
    expect(result.map((station) => station.distanceKm)).toEqual([0.8, 2.1, 4.6]);
  });

  it('returns an empty discovery response for the empty scenario', async () => {
    setStationListScenario('empty');
    await expect(getStations()).resolves.toEqual([]);
  });

  it('returns a typed discovery error and resets to success', async () => {
    setStationListScenario('error');
    await expect(getStations()).rejects.toMatchObject({
      code: 'STATIONS_UNAVAILABLE',
    });

    resetMockApi();
    await expect(getStations()).resolves.toHaveLength(3);
  });

  it('reports an unknown station', async () => {
    await expect(getStation('unknown')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('creates a reservation and checks in with its code', async () => {
    const reservation = await createReservation({
      stationId: 'harbor',
      slotId: 'harbor-1',
      fullName: 'Alex Morgan',
      email: 'alex@example.com',
      phone: '+46701234567',
      idempotencyKey: 'lifecycle-1',
    });
    expect(reservation.bookingCode).toMatch(/^TSF-[A-Z0-9]{6}$/);
    const checkedIn = await checkIn(reservation.bookingCode.toLowerCase());
    expect(checkedIn.checkedInAt).not.toBeNull();
    const station = await getStation('harbor');
    expect(station.slots.find((slot) => slot.id === 'harbor-1')).toMatchObject({
      placesLeft: 5,
    });
  });

  it('clamps capacity at zero and rejects bookings after the slot is full', async () => {
    const input = {
      stationId: 'harbor',
      slotId: 'harbor-1',
      fullName: 'Alex Morgan',
      email: 'alex@example.com',
      phone: '+46701234567',
    };

    await Promise.all(
      Array.from({ length: 6 }, (_, index) =>
        createReservation({ ...input, idempotencyKey: `capacity-${index}` }),
      ),
    );
    const station = await getStation('harbor');
    expect(station.slots.find((slot) => slot.id === 'harbor-1')).toMatchObject({
      availability: 'unavailable',
      placesLeft: 0,
    });
    await expect(
      createReservation({ ...input, idempotencyKey: 'capacity-overflow' }),
    ).rejects.toMatchObject({
      code: 'SLOT_UNAVAILABLE',
    });
  });

  it('returns a recoverable error when the final slot was taken', async () => {
    await expect(
      createReservation({
        stationId: 'harbor',
        slotId: 'harbor-race',
        fullName: 'Alex Morgan',
        email: 'alex@example.com',
        phone: '+46701234567',
        idempotencyKey: 'race-1',
      }),
    ).rejects.toMatchObject({ code: 'SLOT_UNAVAILABLE' });
    const station = await getStation('harbor');
    expect(station.slots.find((slot) => slot.id === 'harbor-race')).toMatchObject({
      availability: 'unavailable',
      placesLeft: 0,
    });
  });

  it('rejects an invalid check-in code', async () => {
    await expect(checkIn('TSF-NOPE00')).rejects.toMatchObject({ code: 'INVALID_CODE' });
  });

  it('keeps repeated check-in requests idempotent', async () => {
    const reservation = await createReservation({
      stationId: 'harbor',
      slotId: 'harbor-1',
      fullName: 'Alex Morgan',
      email: 'alex@example.com',
      phone: '+46701234567',
      idempotencyKey: 'check-in-once',
    });

    const first = await checkIn(reservation.bookingCode);
    const repeated = await checkIn(reservation.bookingCode);

    expect(repeated).toEqual(first);
  });

  it('returns the original reservation for a repeated idempotency key', async () => {
    const input = {
      stationId: 'harbor',
      slotId: 'harbor-1',
      fullName: 'Alex Morgan',
      email: 'alex@example.com',
      phone: '+46701234567',
      idempotencyKey: 'duplicate-1',
    };

    const first = await createReservation(input);
    const duplicate = await createReservation(input);

    expect(duplicate).toEqual(first);
    expect(
      (await getStation('harbor')).slots.find((slot) => slot.id === 'harbor-1'),
    ).toMatchObject({ placesLeft: 5 });
  });

  it('rejects reusing a key with different reservation input', async () => {
    const input = {
      stationId: 'harbor',
      slotId: 'harbor-1',
      fullName: 'Alex Morgan',
      email: 'alex@example.com',
      phone: '+46701234567',
      idempotencyKey: 'mismatch-1',
    };

    await createReservation(input);
    await expect(
      createReservation({ ...input, fullName: 'Jordan Lee' }),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
  });
});
