import { Station } from '@/src/types/domain';

const day = (offset: number, hour: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

export const stations: Station[] = [
  {
    id: 'harbor',
    name: 'Harbor Skills Hub',
    address: '18 Quayside Lane',
    area: 'North Harbor',
    distanceKm: 0.8,
    description:
      'Practical training rooms with modern simulation equipment and quiet study space.',
    amenities: ['Accessible entrance', 'Lockers', 'Bike parking'],
    slots: [
      {
        id: 'harbor-1',
        startsAt: day(1, 9),
        endsAt: day(1, 10),
        availability: 'available',
        placesLeft: 6,
      },
      {
        id: 'harbor-2',
        startsAt: day(1, 13),
        endsAt: day(1, 14),
        availability: 'limited',
        placesLeft: 2,
      },
      {
        id: 'harbor-race',
        startsAt: day(2, 10),
        endsAt: day(2, 11),
        availability: 'available',
        placesLeft: 1,
      },
    ],
  },
  {
    id: 'central',
    name: 'Central Practice Studio',
    address: '42 Market Street',
    area: 'City Centre',
    distanceKm: 2.1,
    description:
      'A bright central venue for focused instructor-led and self-guided sessions.',
    amenities: ['Transit nearby', 'Changing rooms', 'Wi-Fi'],
    slots: [
      {
        id: 'central-1',
        startsAt: day(1, 17),
        endsAt: day(1, 18),
        availability: 'available',
        placesLeft: 8,
      },
      {
        id: 'central-2',
        startsAt: day(3, 12),
        endsAt: day(3, 13),
        availability: 'unavailable',
        placesLeft: 0,
      },
    ],
  },
  {
    id: 'riverside',
    name: 'Riverside Training Room',
    address: '7 Willow Walk',
    area: 'Riverside',
    distanceKm: 4.6,
    description: 'A calm neighborhood station suited to small-group practical training.',
    amenities: ['Free parking', 'Accessible toilet', 'Water station'],
    slots: [
      {
        id: 'riverside-1',
        startsAt: day(2, 15),
        endsAt: day(2, 16),
        availability: 'limited',
        placesLeft: 3,
      },
    ],
  },
];
