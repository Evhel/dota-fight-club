import { useQuery } from "@tanstack/react-query";
import { STATIC_AWARDS, type StaticAward } from "./static-data";

export type Award = StaticAward;

export const awardsKey = ["awards"] as const;
export const AWARD_LINK =
  "https://docs.google.com/spreadsheets/d/1eWdSEiJrhVUUe84iyFrD9SlGWktPkVfD7UXd-gaUZug/edit?gid=0#gid=0";

export function useAwards() {
  return useQuery({
    queryKey: awardsKey,
    queryFn: async (): Promise<Award[]> => STATIC_AWARDS,
    initialData: STATIC_AWARDS,
    staleTime: Infinity,
  });
}
