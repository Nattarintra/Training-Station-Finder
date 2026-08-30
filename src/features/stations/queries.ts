import { useQuery } from '@tanstack/react-query';

import { getStation, getStations } from '@/src/api/mockApi';

export const stationKeys = {
  all: ['stations'] as const,
  detail: (id: string) => ['stations', id] as const,
};

export function useStations() {
  return useQuery({ queryKey: stationKeys.all, queryFn: getStations });
}

export function useStation(id: string) {
  return useQuery({
    queryKey: stationKeys.detail(id),
    queryFn: () => getStation(id),
    enabled: Boolean(id),
  });
}
