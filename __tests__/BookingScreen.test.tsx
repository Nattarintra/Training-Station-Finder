import { fireEvent, render } from '@testing-library/react-native';

import BookingScreen from '@/app/booking/[id]';
import { stations } from '@/src/api/fixtures';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStation } from '@/src/features/stations/queries';

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
  useQuery: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('@/src/features/stations/queries', () => ({
  useStation: jest.fn(),
}));

jest.mock('react-native-qrcode-svg', () => {
  const React = jest.requireActual('react') as typeof import('react');
  const { View } = jest.requireActual('react-native') as typeof import('react-native');
  function MockQRCode({ value }: { value: string }) {
    const props = { testID: 'booking-qr', value } as unknown as React.ComponentProps<
      typeof View
    >;
    return React.createElement(View, props);
  }
  MockQRCode.displayName = 'MockQRCode';
  return MockQRCode;
});

const mockUseMutation = jest.mocked(useMutation);
const mockUseQuery = jest.mocked(useQuery);
const mockUseLocalSearchParams = jest.mocked(useLocalSearchParams);
const mockUseRouter = jest.mocked(useRouter);
const mockUseStation = jest.mocked(useStation);
const mockReplace = jest.fn();
const mockMutate = jest.fn();
const station = stations.find((item) => item.id === 'harbor')!;
const booking = {
  id: 'reservation-123',
  stationId: 'harbor',
  slotId: 'harbor-1',
  fullName: 'Alex Morgan',
  email: 'alex@example.com',
  phone: '+46701234567',
  bookingCode: 'TSF-ABC123',
  createdAt: '2026-08-28T12:00:00.000Z',
  checkedInAt: null,
};

const queryResult = (
  overrides: Partial<ReturnType<typeof useQuery>> = {},
): ReturnType<typeof useQuery> =>
  ({
    data: booking,
    error: null,
    isError: false,
    isPending: false,
    ...overrides,
  }) as ReturnType<typeof useQuery>;

const stationResult = (
  overrides: Partial<ReturnType<typeof useStation>> = {},
): ReturnType<typeof useStation> =>
  ({
    data: station,
    error: null,
    isError: false,
    isPending: false,
    ...overrides,
  }) as ReturnType<typeof useStation>;

describe('BookingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({ id: booking.id });
    mockUseRouter.mockReturnValue({
      replace: mockReplace,
    } as unknown as ReturnType<typeof useRouter>);
    mockUseMutation.mockReturnValue({
      data: undefined,
      isPending: false,
      isSuccess: false,
      mutate: mockMutate,
    } as unknown as ReturnType<typeof useMutation>);
    mockUseQuery.mockReturnValue(queryResult());
    mockUseStation.mockReturnValue(stationResult());
  });

  it('renders the confirmation ticket and stable accessible QR payload', () => {
    const { getByLabelText, getByTestId, getByText } = render(<BookingScreen />);

    expect(getByText('You’re booked')).toBeOnTheScreen();
    expect(getByText('Harbor Skills Hub')).toBeOnTheScreen();
    expect(getByText('TSF-ABC123')).toBeOnTheScreen();
    expect(getByText('Reserved for Alex Morgan')).toBeOnTheScreen();
    expect(getByLabelText('Booking QR code for TSF-ABC123')).toBeOnTheScreen();
    expect(getByTestId('booking-qr').props.value).toBe(
      'training-station-finder:TSF-ABC123',
    );
  });

  it('checks in with the existing booking code from the confirmation', () => {
    const { getByRole } = render(<BookingScreen />);

    fireEvent.press(getByRole('button', { name: 'Check in now' }));

    expect(mockMutate).toHaveBeenCalledWith('TSF-ABC123');
  });

  it('clearly confirms a successful automatic check-in', () => {
    mockUseMutation.mockReturnValue({
      data: {
        ...booking,
        checkedInAt: '2026-08-28T12:05:00.000Z',
        alreadyCheckedIn: false,
      },
      isPending: false,
      isSuccess: true,
      mutate: mockMutate,
    } as unknown as ReturnType<typeof useMutation>);
    const { getByText } = render(<BookingScreen />);

    expect(getByText('Check-in complete')).toBeOnTheScreen();
    expect(getByText('You’re ready for your session.')).toBeOnTheScreen();
  });

  it('labels a repeated confirmation check-in as already completed', () => {
    mockUseMutation.mockReturnValue({
      data: {
        ...booking,
        checkedInAt: '2026-08-28T12:05:00.000Z',
        alreadyCheckedIn: true,
      },
      isPending: false,
      isSuccess: true,
      mutate: mockMutate,
    } as unknown as ReturnType<typeof useMutation>);
    const { getByText } = render(<BookingScreen />);

    expect(getByText('Already checked in')).toBeOnTheScreen();
    expect(getByText('This code has already been checked in.')).toBeOnTheScreen();
  });

  it('recovers from a missing booking by returning to stations', () => {
    mockUseQuery.mockReturnValue(
      queryResult({
        isError: true,
        error: new Error('This booking is no longer available.'),
      }),
    );
    const { getByRole, getByText } = render(<BookingScreen />);

    expect(getByText('Booking unavailable')).toBeOnTheScreen();
    fireEvent.press(getByRole('button', { name: 'Find a station' }));

    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
