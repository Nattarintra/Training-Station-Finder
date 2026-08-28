import { act, fireEvent, render } from '@testing-library/react-native';

import ReserveScreen from '@/app/reserve';
import { stations } from '@/src/api/fixtures';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStation } from '@/src/features/stations/queries';

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('@/src/features/stations/queries', () => ({
  useStation: jest.fn(),
}));

const mockUseMutation = jest.mocked(useMutation);
const mockUseLocalSearchParams = jest.mocked(useLocalSearchParams);
const mockUseRouter = jest.mocked(useRouter);
const mockUseStation = jest.mocked(useStation);
const mockMutate = jest.fn();
const mockReplace = jest.fn();
let mutationOptions: { onSuccess?: (data: { id: string }) => void } | undefined;

const station = stations.find((item) => item.id === 'harbor')!;

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

describe('ReserveScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mutationOptions = undefined;
    mockUseLocalSearchParams.mockReturnValue({ stationId: 'harbor', slotId: 'harbor-1' });
    mockUseRouter.mockReturnValue({ replace: mockReplace } as unknown as ReturnType<
      typeof useRouter
    >);
    mockUseStation.mockReturnValue(stationResult());
    mockUseMutation.mockImplementation((options) => {
      mutationOptions = options as typeof mutationOptions;
      return {
        isPending: false,
        isError: false,
        error: null,
        mutate: mockMutate,
      } as unknown as ReturnType<typeof useMutation>;
    });
  });

  it('shows field errors and does not mutate for invalid contact details', async () => {
    const { getByTestId, getByText } = render(<ReserveScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('submit-reservation'));
    });

    expect(getByText('Enter your full name.')).toBeOnTheScreen();
    expect(getByText('Enter a valid email address.')).toBeOnTheScreen();
    expect(getByText('Enter a valid phone number.')).toBeOnTheScreen();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('submits trimmed valid details with one stable idempotency key', async () => {
    const { getByLabelText, getByTestId } = render(<ReserveScreen />);

    await act(async () => {
      fireEvent.changeText(getByLabelText('Full name'), '  Alex Morgan  ');
      fireEvent.changeText(getByLabelText('Email'), ' alex@example.com ');
      fireEvent.changeText(getByLabelText('Phone'), '+46701234567');
      fireEvent.press(getByTestId('submit-reservation'));
    });

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate.mock.calls[0]?.[0]).toMatchObject({
      stationId: 'harbor',
      slotId: 'harbor-1',
      fullName: 'Alex Morgan',
      email: 'alex@example.com',
      phone: '+46701234567',
    });
    expect(mockMutate.mock.calls[0]?.[0].idempotencyKey).toEqual(expect.any(String));
  });

  it('disables the submit action while the mutation is pending', () => {
    mockUseMutation.mockReturnValue({
      isPending: true,
      isError: false,
      error: null,
      mutate: mockMutate,
    } as unknown as ReturnType<typeof useMutation>);
    const { getByTestId } = render(<ReserveScreen />);

    expect(getByTestId('submit-reservation')).toBeDisabled();
    fireEvent.press(getByTestId('submit-reservation'));
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('replaces the route with the concrete booking ID after success', () => {
    render(<ReserveScreen />);

    mutationOptions?.onSuccess?.({ id: 'reservation-123' });

    expect(mockReplace).toHaveBeenCalledWith('/booking/reservation-123');
  });
});
