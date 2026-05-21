import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MatchRow, DotaMatch } from "./types";

export const matchesQueryKey = ["matches"] as const;

export function useMatches() {
  return useQuery({
    queryKey: matchesQueryKey,
    queryFn: async (): Promise<MatchRow[]> => {
      const { data, error } = await supabase
        .from("matches")
        .select("match_id,start_time,data,created_at")
        .order("start_time", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data || []).map((r) => ({
        match_id: Number(r.match_id),
        start_time: r.start_time,
        data: r.data as unknown as DotaMatch,
        created_at: r.created_at,
      }));
    },
    staleTime: 30_000,
  });
}

export function useUploadMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      match: DotaMatch,
    ): Promise<{ status: "added" | "duplicate"; match_id: number }> => {
      const { data: existing } = await supabase
        .from("matches")
        .select("match_id")
        .eq("match_id", match.match_id)
        .maybeSingle();
      if (existing) return { status: "duplicate", match_id: match.match_id };
      const { error } = await supabase.from("matches").insert({
        match_id: match.match_id,
        start_time: new Date(
          match.start_time.replace(" ", "T") + (match.start_time.includes("Z") ? "" : "Z"),
        ).toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: match as any,
      });
      if (error) throw error;
      return { status: "added", match_id: match.match_id };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: matchesQueryKey }),
  });
}

export function useDeleteMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (match_id: number) => {
      const { error } = await supabase.from("matches").delete().eq("match_id", match_id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: matchesQueryKey }),
  });
}
