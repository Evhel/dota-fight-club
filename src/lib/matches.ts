import { useQuery } from "@tanstack/react-query";
import { STATIC_MATCHES } from "./static-data";
import type { MatchRow } from "./types";

export const matchesQueryKey = ["matches"] as const;

export function useMatches() {
  return useQuery({
    queryKey: matchesQueryKey,
    queryFn: async (): Promise<MatchRow[]> => STATIC_MATCHES,
    initialData: STATIC_MATCHES,
    staleTime: Infinity,
  });
}
