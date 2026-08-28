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
    });
    expect(reservation.bookingCode).toMatch(/^TSF-[A-Z0-9]{6}$/);
    const checkedIn = await checkIn(reservation.bookingCode.toLowerCase());
    expect(checkedIn.checkedInAt).not.toBeNull();
  });

  it('returns a recoverable error when the final slot was taken', async () => {
    await expect(
      createReservation({
        stationId: 'harbor',
        slotId: 'harbor-race',
        fullName: 'Alex Morgan',
        email: 'alex@example.com',
        phone: '+46701234567',
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
});
