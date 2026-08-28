import { fireEvent, render } from '@testing-library/react-native';

import StationDetailScreen from '@/app/station/[id]';
import { stations } from '@/src/api/fixtures';
import { useStation } from '@/src/features/stations/queries';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'harbor' }),
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

jest.mock('@/src/features/stations/queries', () => ({
  useStation: jest.fn(),
}));

const mockUseStation = jest.mocked(useStation);
const stationWithFull = {
  ...stations[0]!,
  slots: [
    ...stations[0]!.slots,
    {
      id: 'full',
      startsAt: '2026-08-30T12:00:00.000Z',
      endsAt: '2026-08-30T13:00:00.000Z',
      availability: 'unavailable' as const,
      placesLeft: 0,
    },
  ],
};
const queryResult = (
  overrides: Partial<ReturnType<typeof useStation>>,
): ReturnType<typeof useStation> =>
  ({
    data: stationWithFull,
    error: null,
    isError: false,
    isPending: false,
    refetch: jest.fn(),
    ...overrides,
  }) as ReturnType<typeof useStation>;

describe('StationDetailScreen selection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStation.mockReturnValue(queryResult({}));
  });

  it('keeps Continue disabled until a selectable slot is selected', () => {
    const { getByTestId } = render(<StationDetailScreen />);
    const continueButton = getByTestId('continue-reservation');
    expect(continueButton).toBeDisabled();

    fireEvent.press(getByTestId('slot-harbor-1'));
    expect(getByTestId('slot-harbor-1').props.accessibilityState).toEqual({
      disabled: false,
      busy: false,
      selected: true,
    });
    expect(getByTestId('continue-reservation')).not.toBeDisabled();
  });

  it('returns to the previous screen from the detail view', () => {
    const { getByTestId } = render(<StationDetailScreen />);
    fireEvent.press(getByTestId('back-to-stations'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('switches selection and navigates with the selected slot', () => {
    const { getByTestId } = render(<StationDetailScreen />);

    fireEvent.press(getByTestId('slot-harbor-1'));
    fireEvent.press(getByTestId('slot-harbor-2'));
    expect(getByTestId('slot-harbor-1').props.accessibilityState.selected).toBe(false);
    expect(getByTestId('slot-harbor-2').props.accessibilityState.selected).toBe(true);

    fireEvent.press(getByTestId('continue-reservation'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/reserve',
      params: { stationId: 'harbor', slotId: 'harbor-2' },
    });
  });

  it('keeps full slots disabled with contextual accessibility semantics', () => {
    const { getByTestId } = render(<StationDetailScreen />);
    const fullSlot = getByTestId('slot-full');
    expect(fullSlot).toBeDisabled();
    expect(fullSlot.props.accessibilityLabel).toMatch(/^Full, .*fully booked$/);
    expect(fullSlot.props.accessibilityHint).toBe('This time cannot be selected');
    fireEvent.press(fullSlot);
    expect(getByTestId('continue-reservation')).toBeDisabled();
  });
});
