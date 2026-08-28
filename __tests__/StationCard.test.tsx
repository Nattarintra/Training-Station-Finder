import { fireEvent, render } from '@testing-library/react-native';

import { StationCard } from '@/src/features/stations/StationCard';
import { Station } from '@/src/types/domain';

const station: Station = {
  id: 'test',
  name: 'A Very Long Training Station Name',
  address: '1 Test Street',
  area: 'Test Area',
  distanceKm: 1.2,
  description: 'Test station',
  amenities: [],
  slots: [
    {
      id: 'available',
      startsAt: '2026-08-29T08:00:00.000Z',
      endsAt: '2026-08-29T09:00:00.000Z',
      availability: 'available',
      placesLeft: 4,
    },
    {
      id: 'limited',
      startsAt: '2026-08-29T10:00:00.000Z',
      endsAt: '2026-08-29T11:00:00.000Z',
      availability: 'limited',
      placesLeft: 1,
    },
    {
      id: 'full',
      startsAt: '2026-08-29T12:00:00.000Z',
      endsAt: '2026-08-29T13:00:00.000Z',
      availability: 'unavailable',
      placesLeft: 0,
    },
  ],
};

describe('StationCard', () => {
  it('announces available times and handles the full-card action', () => {
    const onPress = jest.fn();
    const { getByRole, getByText } = render(
      <StationCard station={station} onPress={onPress} />,
    );

    const card = getByRole('button', {
      name: 'A Very Long Training Station Name, 1.2 kilometers away, 2 available times',
    });
    expect(card.props.accessibilityHint).toBe('Opens station details and time slots');
    expect(getByText('2 upcoming times')).toBeOnTheScreen();
    fireEvent.press(card);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('uses singular copy for one available time', () => {
    const oneSlotStation = { ...station, slots: [station.slots[0]!] };
    const { getByText } = render(
      <StationCard station={oneSlotStation} onPress={jest.fn()} />,
    );
    expect(getByText('1 upcoming time')).toBeOnTheScreen();
  });
});
