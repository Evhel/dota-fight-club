import { createFileRoute, Link } from "@tanstack/react-router";
import { useMatches } from "@/lib/matches";
import {
  buildIdentities,
  computeAllPlayerStats,
  computeGlobalStats,
  formatDuration,
} from "@/lib/stats";
import { useMemo } from "react";
import forest from "@/assets/forest-sword.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { data: matches = [], isLoading } = useMatches();
  const { identities, players, global } = useMemo(() => {
    const identities = buildIdentities(matches);
    const players = computeAllPlayerStats(matches, identities);
    const global = computeGlobalStats(matches, identities, players);
    return { identities, players, global };
  }, [matches]);

  return (
    <div className="space-y-8">
      <section
        className="panel p-8 relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(120deg, oklch(0.18 0.03 150 / 0.85), oklch(0.18 0.03 150 / 0.4)), url(${forest})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: 240,
        }}
      >
        <h1 className="text-4xl md:text-5xl font-display text-glow">
          Бойцовский Клуб Dota 2
        </h1>
        <p className="mt-3 max-w-xl text-mist/90">
          Хроники приватных матчей. Каждая смерть, каждый варды и каждая «пятёрка» — учтены.
        </p>
        <div className="mt-6 flex flex-wrap gap-6 text-sm">
          <Stat label="Игр" value={global.total_games} />
          <Stat label="Игроков" value={global.total_players} />
          <Stat label="Время в боях" value={formatDuration(global.total_seconds)} />
        </div>
      </section>

      {isLoading && <p className="text-muted-foreground">Загрузка...</p>}

      <ActivityCalendar activity={global.activity_by_date} />

      <div className="grid md:grid-cols-2 gap-6">
        <div className="panel p-6">
          <h2 className="font-display text-xl mb-4">Общая статистика</h2>
          <ul className="space-y-2 text-sm">
            <Row k="Всего игр" v={global.total_games} />
            <Row k="Время игр + пиков" v={formatDuration(global.total_seconds)} />
            <Row k="Уникальных игроков" v={global.total_players} />
            <Row k="Побед Света" v={global.radiant_wins} />
            <Row k="Побед Тьмы" v={global.dire_wins} />
          </ul>
          <div className="mt-4">
            <div className="text-xs text-muted-foreground mb-1">Игр по режимам</div>
            <ul className="text-sm space-y-1">
              {Object.entries(global.modes).map(([m, c]) => (
                <Row key={m} k={m} v={c} />
              ))}
            </ul>
          </div>
        </div>

        <div className="panel p-6">
          <h2 className="font-display text-xl mb-4">Рекорды</h2>
          <ul className="space-y-2 text-sm">
            {global.records.shortest_match && (
              <RecLink
                label="Самая короткая игра"
                value={`${Math.round(global.records.shortest_match.minutes)} мин`}
                to={`/match/${global.records.shortest_match.match_id}`}
              />
            )}
            {global.records.longest_match && (
              <RecLink
                label="Самая длинная игра"
                value={`${Math.round(global.records.longest_match.minutes)} мин`}
                to={`/match/${global.records.longest_match.match_id}`}
              />
            )}
            {global.records.most_obs && (
              <RecLink
                label="Максимум observer wards"
                value={`${global.records.most_obs.value} — ${global.records.most_obs.name}`}
                to={`/match/${global.records.most_obs.match_id}`}
              />
            )}
            {global.records.most_sen && (
              <RecLink
                label="Максимум sentries"
                value={`${global.records.most_sen.value} — ${global.records.most_sen.name}`}
                to={`/match/${global.records.most_sen.match_id}`}
              />
            )}
            {global.records.most_dewards && (
              <RecLink
                label="Максимум wards destroyed"
                value={`${global.records.most_dewards.value} — ${global.records.most_dewards.name}`}
                to={`/match/${global.records.most_dewards.match_id}`}
              />
            )}
            {global.records.top_word && (
              <li className="flex justify-between gap-3 border-b border-border/40 pb-1">
                <span className="text-muted-foreground">Самое популярное слово в чате</span>
                <span className="font-medium">«{global.records.top_word}»</span>
              </li>
            )}
            {global.records.most_games_player && (
              <RecLink
                label="Больше всего игр"
                value={`${global.records.most_games_player.name} — ${global.records.most_games_player.games}`}
                to={`/player?nick=${encodeURIComponent(global.records.most_games_player.name)}`}
              />
            )}
            {global.records.best_winrate_player && (
              <RecLink
                label="Лучший винрейт"
                value={`${global.records.best_winrate_player.name} — ${global.records.best_winrate_player.winrate}%`}
                to={`/player?nick=${encodeURIComponent(global.records.best_winrate_player.name)}`}
              />
            )}
            {global.records.most_chat_player && (
              <RecLink
                label="Чаще всех пишет в чат"
                value={`${global.records.most_chat_player.name} — ${global.records.most_chat_player.messages}`}
                to={`/player?nick=${encodeURIComponent(global.records.most_chat_player.name)}`}
              />
            )}
            {global.records.most_high_fives_player && (
              <RecLink
                label="Король «дай пять»"
                value={`${global.records.most_high_fives_player.name} — ${global.records.most_high_fives_player.high_fives}`}
                to={`/player?nick=${encodeURIComponent(global.records.most_high_fives_player.name)}`}
              />
            )}
          </ul>
        </div>
      </div>

      <WordCloud words={global.word_cloud} />

      {players.length === 0 && !isLoading && (
        <p className="text-center text-muted-foreground py-8">
          Нет данных. Админ может загрузить первый матч в{" "}
          <Link to="/admin" className="text-primary underline">
            панели администратора
          </Link>
          .
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-3xl font-display text-glow">{value}</div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: number | string }) {
  return (
    <li className="flex justify-between gap-3 border-b border-border/40 pb-1">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </li>
  );
}

function RecLink({ label, value, to }: { label: string; value: string; to: string }) {
  return (
    <li className="flex justify-between gap-3 border-b border-border/40 pb-1">
      <span className="text-muted-foreground">{label}</span>
      <Link to={to} className="font-medium text-primary hover:underline text-right">
        {value}
      </Link>
    </li>
  );
}

function ActivityCalendar({ activity }: { activity: Record<string, number> }) {
  const days: { date: string; count: number }[] = [];
  const now = new Date();
  for (let i = 119; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, count: activity[key] || 0 });
  }
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <div className="panel p-6">
      <h2 className="font-display text-xl mb-4">Активность последних 120 дней</h2>
      <div className="grid grid-flow-col grid-rows-7 gap-1">
        {days.map((d) => {
          const intensity = d.count / max;
          return (
            <div
              key={d.date}
              title={`${d.date}: ${d.count} игр`}
              className="aspect-square rounded-sm"
              style={{
                backgroundColor:
                  d.count === 0
                    ? "oklch(0.25 0.03 150 / 0.5)"
                    : `oklch(${0.35 + intensity * 0.35} 0.12 145)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function WordCloud({ words }: { words: { word: string; count: number }[] }) {
  if (words.length === 0) return null;
  const max = words[0].count;
  return (
    <div className="panel p-6">
      <h2 className="font-display text-xl mb-4">Облако слов из общего чата</h2>
      <div className="flex flex-wrap gap-x-3 gap-y-2 items-baseline justify-center">
        {words.map((w) => {
          const size = 0.8 + (w.count / max) * 2.2;
          return (
            <span
              key={w.word}
              style={{
                fontSize: `${size}rem`,
                opacity: 0.55 + (w.count / max) * 0.45,
              }}
              className="text-primary"
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </div>
  );
}
