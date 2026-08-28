import { act, fireEvent, render } from '@testing-library/react-native';

import HomeScreen from '@/app/index';
import { stations } from '@/src/api/fixtures';
import { setStationListScenario } from '@/src/api/mockApi';
import { useStations } from '@/src/features/stations/queries';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/src/features/stations/queries', () => ({
  useStations: jest.fn(),
}));

jest.mock('@/src/api/mockApi', () => ({
  ...jest.requireActual('@/src/api/mockApi'),
  setStationListScenario: jest.fn(),
}));

const mockUseStations = jest.mocked(useStations);
const queryResult = (
  overrides: Partial<ReturnType<typeof useStations>>,
): ReturnType<typeof useStations> =>
  ({
    data: [],
    error: null,
    isError: false,
    isFetching: false,
    isPending: false,
    refetch: jest.fn().mockResolvedValue({ data: [] }),
    ...overrides,
  }) as ReturnType<typeof useStations>;

describe('HomeScreen station discovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the pending state', () => {
    mockUseStations.mockReturnValue(queryResult({ isPending: true }));
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Finding stations nearby…')).toBeOnTheScreen();
  });

  it('preserves error context and blocks duplicate retry presses', async () => {
    let resolveRetry: (() => void) | undefined;
    const refetch = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveRetry = () => resolve({ data: [] });
        }),
    );
    mockUseStations.mockReturnValue(
      queryResult({
        isError: true,
        error: new Error('Unavailable'),
        refetch: refetch as ReturnType<typeof useStations>['refetch'],
      }),
    );
    const { getByRole, getByText } = render(<HomeScreen />);

    fireEvent.press(getByRole('button', { name: 'Try again' }));
    const retrying = getByRole('button', { name: 'Trying again…' });
    expect(getByText('Stations are unavailable')).toBeOnTheScreen();
    expect(retrying).toBeDisabled();
    fireEvent.press(retrying);
    expect(refetch).toHaveBeenCalledTimes(1);

    await act(async () => resolveRetry?.());
  });

  it('renders empty state and refreshes once', () => {
    const refetch = jest.fn().mockResolvedValue({ data: [] });
    mockUseStations.mockReturnValue(queryResult({ data: [], refetch }));
    const { getByRole, getByText } = render(<HomeScreen />);

    expect(getByText('No stations nearby')).toBeOnTheScreen();
    fireEvent.press(getByRole('button', { name: 'Refresh' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('shows a busy refresh action while fetching empty results', () => {
    mockUseStations.mockReturnValue(queryResult({ data: [], isFetching: true }));
    const { getByRole } = render(<HomeScreen />);
    expect(getByRole('button', { name: 'Refreshing…' })).toBeDisabled();
  });

  it('renders stations and navigates to the selected detail route', () => {
    mockUseStations.mockReturnValue(queryResult({ data: stations }));
    const { getByRole } = render(<HomeScreen />);

    fireEvent.press(
      getByRole('button', {
        name: 'Harbor Skills Hub, 0.8 kilometers away, 3 available times',
      }),
    );
    expect(mockPush).toHaveBeenCalledWith('/station/harbor');
  });

  it('switches the development response scenario and refetches', () => {
    const refetch = jest.fn().mockResolvedValue({ data: stations });
    mockUseStations.mockReturnValue(queryResult({ data: stations, refetch }));
    const { getByRole } = render(<HomeScreen />);

    fireEvent.press(getByRole('radio', { name: 'Error station response' }));
    expect(setStationListScenario).toHaveBeenCalledWith('error');
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
