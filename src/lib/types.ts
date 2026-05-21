export interface MatchPlayer {
  nickname: string;
  steam_id: number;
  hero: string;
}

export interface MatchKDA {
  kills: number;
  deaths: number;
  assists: number;
  kda_ratio: number;
}

export interface MatchWards {
  observer: number;
  sentry: number;
  total: number;
}

export interface ChatMessage {
  tick: number;
  channel: string;
  player_slot: number;
  text: string;
}

export interface DotaMatch {
  match_id: number;
  start_time: string;
  start_timestamp: number;
  duration_minutes: number;
  duration_seconds: number;
  draft_duration_minutes: number;
  has_draft: boolean;
  winner: "radiant" | "dire";
  game_mode_id: number;
  game_mode: string;
  league_id: number;
  radiant_team_info?: { team_name?: string; team_tag?: string; team_id?: number };
  dire_team_info?: { team_name?: string; team_tag?: string; team_id?: number };
  radiant_team: MatchPlayer[];
  dire_team: MatchPlayer[];
  picks: { team: number; hero: string; tick: number }[];
  bans: { team: number; hero: string; tick: number }[];
  draft_order?: { order: number; team: number; hero: string; tick: number; game_time_sec: number }[];
  total_deaths: number;
  kda: Record<string, MatchKDA>;
  net_worth: Record<string, number>;
  wards_placed: Record<string, MatchWards>;
  wards_destroyed: Record<string, MatchWards>;
  chat_after_draft: ChatMessage[];
  chat_message_count: number;
  high_fives: Record<string, number>;
  creep_kills: Record<string, number>;
}

export interface MatchRow {
  match_id: number;
  start_time: string;
  data: DotaMatch;
  created_at: string;
}
