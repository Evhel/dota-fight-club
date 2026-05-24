import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Award {
  id: string;
  name: string;
  image_url: string;
  steam_id: string;
  player_name: string;
  created_at: string;
}

export const awardsKey = ["awards"] as const;
export const AWARD_LINK =
  "https://docs.google.com/spreadsheets/d/1eWdSEiJrhVUUe84iyFrD9SlGWktPkVfD7UXd-gaUZug/edit?gid=0#gid=0";

export function useAwards() {
  return useQuery({
    queryKey: awardsKey,
    queryFn: async (): Promise<Award[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("awards")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Award[];
    },
    staleTime: 30_000,
  });
}

export function useCreateAward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: { name: string; image: File; steam_id: string; player_name: string }) => {
      const ext = a.image.name.split(".").pop() || "png";
      const path = `${a.steam_id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("awards")
        .upload(path, a.image, { contentType: a.image.type, upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("awards").getPublicUrl(path);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("awards").insert({
        name: a.name,
        image_url: pub.publicUrl,
        steam_id: a.steam_id,
        player_name: a.player_name,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: awardsKey }),
  });
}

export function useDeleteAward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("awards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: awardsKey }),
  });
}
