import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import CheckInScreen from '@/app/check-in';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

const mockUseMutation = jest.mocked(useMutation);
const mockUseLocalSearchParams = jest.mocked(useLocalSearchParams);
const mockUseRouter = jest.mocked(useRouter);
const mockMutate = jest.fn();
const mockReplace = jest.fn();

const checkedInReservation = {
  id: 'reservation-123',
  stationId: 'harbor',
  slotId: 'harbor-1',
  fullName: 'Alex Morgan',
  email: 'alex@example.com',
  phone: '+46701234567',
  bookingCode: 'TSF-ABC123',
  createdAt: '2026-08-29T12:00:00.000Z',
  checkedInAt: '2026-08-29T12:05:00.000Z',
  alreadyCheckedIn: false,
};

const mutationResult = (overrides: Record<string, unknown> = {}) =>
  ({
    data: undefined,
    error: null,
    isError: false,
    isPending: false,
    isSuccess: false,
    mutate: mockMutate,
    ...overrides,
  }) as unknown as ReturnType<typeof useMutation>;

describe('CheckInScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({});
    mockUseRouter.mockReturnValue({
      replace: mockReplace,
    } as unknown as ReturnType<typeof useRouter>);
    mockUseMutation.mockReturnValue(mutationResult());
  });

  it('renders the booking-code form and simulated-flow disclaimer', () => {
    const { getByRole, getByText, getByLabelText } = render(<CheckInScreen />);

    expect(getByRole('header', { name: 'Enter booking code' })).toBeOnTheScreen();
    expect(getByLabelText('Booking code')).toBeOnTheScreen();
    expect(getByRole('button', { name: 'Check in' })).toBeOnTheScreen();
    expect(
      getByText(
        'This is a simulated check-in. No external certification or attendance service is contacted.',
      ),
    ).toBeOnTheScreen();
  });

  it('prefills the booking code from the route parameter', () => {
    mockUseLocalSearchParams.mockReturnValue({ code: 'tsf-abc123' });
    const { getByLabelText } = render(<CheckInScreen />);

    expect(getByLabelText('Booking code').props.value).toBe('tsf-abc123');
  });

  it('shows validation feedback and does not mutate for a short code', async () => {
    const { getByLabelText, getByRole, getByText } = render(<CheckInScreen />);

    await act(async () => {
      fireEvent.changeText(getByLabelText('Booking code'), 'TSF');
      fireEvent.press(getByRole('button', { name: 'Check in' }));
    });

    await waitFor(() => expect(getByText('Enter your booking code.')).toBeOnTheScreen());
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('submits a trimmed and normalized booking code', async () => {
    const { getByLabelText, getByRole } = render(<CheckInScreen />);

    await act(async () => {
      fireEvent.changeText(getByLabelText('Booking code'), ' tsf-abc123 ');
      fireEvent.press(getByRole('button', { name: 'Check in' }));
    });

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith('TSF-ABC123');
  });

  it('disables the action and prevents submission while pending', () => {
    mockUseMutation.mockReturnValue(mutationResult({ isPending: true }));
    const { getByRole, getByTestId } = render(<CheckInScreen />);
    const button = getByRole('button', { name: 'Check in' });

    expect(button).toBeDisabled();
    expect(button.props.accessibilityState).toMatchObject({ busy: true });
    expect(getByTestId('button-loading-indicator')).toBeOnTheScreen();
    fireEvent.press(button);
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('shows the API error and keeps the form available for retry', () => {
    mockUseMutation.mockReturnValue(
      mutationResult({
        isError: true,
        error: new Error('Booking code not found. Check the code and try again.'),
      }),
    );
    const { getByRole, getByText } = render(<CheckInScreen />);

    expect(getByText('Couldn’t check in')).toBeOnTheScreen();
    expect(
      getByText('Booking code not found. Check the code and try again.'),
    ).toBeOnTheScreen();
    expect(getByRole('button', { name: 'Check in' })).toBeEnabled();
  });

  it('renders the successful simulated check-in result', () => {
    mockUseMutation.mockReturnValue(
      mutationResult({ data: checkedInReservation, isSuccess: true }),
    );
    const { getByRole, getByText } = render(<CheckInScreen />);

    expect(getByRole('header', { name: 'Check-in complete' })).toBeOnTheScreen();
    expect(
      getByText('Welcome, Alex Morgan. You’re ready for your session.'),
    ).toBeOnTheScreen();
    expect(getByText('TSF-ABC123')).toBeOnTheScreen();
  });

  it('renders an already-checked-in result for a repeat code', () => {
    mockUseMutation.mockReturnValue(
      mutationResult({
        data: { ...checkedInReservation, alreadyCheckedIn: true },
        isSuccess: true,
      }),
    );
    const { getByRole, getByText } = render(<CheckInScreen />);

    expect(getByRole('header', { name: 'Already checked in' })).toBeOnTheScreen();
    expect(
      getByText('This code has already been checked in. Welcome, Alex Morgan.'),
    ).toBeOnTheScreen();
  });

  it('returns to the home route when Done is pressed', () => {
    mockUseMutation.mockReturnValue(
      mutationResult({ data: checkedInReservation, isSuccess: true }),
    );
    const { getByRole } = render(<CheckInScreen />);

    fireEvent.press(getByRole('button', { name: 'Done' }));

    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
