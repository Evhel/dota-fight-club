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
  const { players, global } = useMemo(() => {
    const identities = buildIdentities(matches);
    const players = computeAllPlayerStats(matches, identities);
    const global = computeGlobalStats(matches, identities, players);
    return { players, global };
  }, [matches]);

  return (
    <div className="space-y-8">
      <section
        className="panel p-8 relative overflow-hidden text-center"
        style={{
          backgroundImage: `linear-gradient(120deg, oklch(0.18 0.03 150 / 0.85), oklch(0.18 0.03 150 / 0.4)), url(${forest})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: 260,
        }}
      >
        <h1 className="text-4xl md:text-5xl font-display text-glow">
          Бойцовский Клуб Dota 2
        </h1>
        <div className="mt-8 flex flex-wrap gap-10 justify-center text-base">
          <Stat label="Игр" value={global.total_games} />
          <Stat label="Бойцов" value={global.total_players} />
          <Stat label="Времени в бою" value={formatDuration(global.total_seconds)} />
        </div>
      </section>

      {isLoading && <p className="text-muted-foreground text-center">Загрузка...</p>}

      <div className="grid lg:grid-cols-2 gap-4">
        <ActivityCalendar activity={global.activity_by_date} />
        <WordCloud words={global.word_cloud} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="panel p-4">
          <h2 className="font-display text-xl mb-2 text-center">Общая статистика</h2>
          <ul className="space-y-1 text-sm">
            <Row k="Всего игр" v={global.total_games} />
            <Row k="Время игр + пиков" v={formatDuration(global.total_seconds)} />
            <Row k="Уникальных бойцов" v={global.total_players} />
            <Row k="Побед сил Света" v={global.radiant_wins} />
            <Row k="Побед сил Тьмы" v={global.dire_wins} />
          </ul>
          <div className="mt-3">
            <div className="text-xs text-muted-foreground mb-1 text-center">Игр по режимам</div>
            <ul className="text-sm space-y-1">
              {Object.entries(global.modes).map(([m, c]) => (
                <Row key={m} k={m} v={c} />
              ))}
            </ul>
          </div>
        </div>

        <div className="panel p-4">
          <h2 className="font-display text-xl mb-2 text-center">Рекорды</h2>
          <ul className="space-y-1 text-sm">
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
                label="Лучший винрейт (от 10 игр)"
                value={`${global.records.best_winrate_player.name} — ${global.records.best_winrate_player.winrate}%`}
                to={`/player?nick=${encodeURIComponent(global.records.best_winrate_player.name)}`}
              />
            )}
            {global.records.most_chat_player && (
              <RecLink
                label="Наспамил фраз"
                value={`${global.records.most_chat_player.name} — ${global.records.most_chat_player.messages}`}
                to={`/player?nick=${encodeURIComponent(global.records.most_chat_player.name)}`}
              />
            )}
            {global.records.most_high_fives_player && (
              <RecLink
                label="Больше всех пятюнь"
                value={`${global.records.most_high_fives_player.name} — ${global.records.most_high_fives_player.high_fives}`}
                to={`/player?nick=${encodeURIComponent(global.records.most_high_fives_player.name)}`}
              />
            )}
          </ul>
        </div>
      </div>

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
      <div className="text-4xl md:text-5xl font-display text-glow">{value}</div>
      <div className="text-sm mt-1 uppercase tracking-widest text-muted-foreground">{label}</div>
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
  // Generate exactly the last 371 days (53 weeks), starting on a Monday for alignment
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Find the Sunday/end of this week
  const endOfWeek = new Date(today);
  const dayOfWeek = endOfWeek.getDay(); // 0 = Sun
  const daysToSunday = (7 - dayOfWeek) % 7;
  endOfWeek.setDate(endOfWeek.getDate() + daysToSunday);

  const totalDays = 53 * 7;
  const days: { date: string; count: number; dt: Date }[] = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(endOfWeek);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, count: activity[key] || 0, dt: d });
  }
  const max = Math.max(1, ...days.map((d) => d.count));

  // Build column-by-column data (7 rows × 53 cols)
  const weeks: { date: string; count: number; dt: Date }[][] = [];
  for (let w = 0; w < 53; w++) {
    weeks.push(days.slice(w * 7, w * 7 + 7));
  }

  // Month labels positioned by week column where each month starts
  const monthNames = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  const monthLabels: { week: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, idx) => {
    const firstOfMonth = week.find((d) => d.dt.getDate() <= 7);
    if (firstOfMonth) {
      const m = firstOfMonth.dt.getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ week: idx, label: monthNames[m] });
        lastMonth = m;
      }
    }
  });

  // Stats: current streak (days), max streak (days), total days with games
  const todayKey = today.toISOString().slice(0, 10);
  // walk backwards from today
  let currentStreak = 0;
  {
    const cursor = new Date(today);
    while (true) {
      const key = cursor.toISOString().slice(0, 10);
      if (activity[key]) {
        currentStreak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        // allow today not to have games yet — only break if not today
        if (key === todayKey) {
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }
        break;
      }
    }
  }

  // max streak across all activity
  const allDates = Object.keys(activity).filter((k) => activity[k] > 0).sort();
  let maxStreak = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of allDates) {
    const d = new Date(k);
    if (prev && (d.getTime() - prev.getTime()) === 86400000) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > maxStreak) maxStreak = run;
    prev = d;
  }
  const totalDaysWithGames = allDates.length;

  return (
    <div className="panel p-6">
      <h2 className="font-display text-2xl mb-4 text-center">Активность за год</h2>
      <div className="flex justify-center">
        <div>
          <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
            {days.map((d) => {
              const intensity = d.count / max;
              const dateLabel = d.dt.toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });
              const gamesWord =
                d.count % 10 === 1 && d.count % 100 !== 11
                  ? "игра"
                  : d.count % 10 >= 2 && d.count % 10 <= 4 && (d.count % 100 < 10 || d.count % 100 >= 20)
                    ? "игры"
                    : "игр";
              const tip = d.count > 0 ? `${dateLabel} — ${d.count} ${gamesWord}` : "";
              return (
                <div key={d.date} className="relative group">
                  <div
                    className="w-[10px] h-[10px] rounded-[2px]"
                    style={{
                      backgroundColor:
                        d.count === 0
                          ? "oklch(0.25 0.03 150 / 0.5)"
                          : `oklch(${0.35 + intensity * 0.35} 0.12 145)`,
                      cursor: d.count > 0 ? "help" : "default",
                    }}
                  />
                  {tip && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-popover text-popover-foreground text-xs whitespace-nowrap shadow-lg border border-border opacity-0 group-hover:opacity-100 transition z-50">
                      {tip}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* month labels */}
          <div className="relative h-4 mt-1" style={{ width: 53 * 13 - 3 }}>
            {monthLabels.map((m) => (
              <span
                key={`${m.label}-${m.week}`}
                className="absolute text-[10px] text-muted-foreground"
                style={{ left: m.week * 13 }}
              >
                {m.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-8 text-base">
        <div className="text-center">
          <div className="text-2xl font-display text-glow">{currentStreak}</div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            дней сейчас без перерыва
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-display text-glow">{maxStreak}</div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            дней без перерыва (макс.)
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-display text-glow">{totalDaysWithGames}</div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            дней были игры
          </div>
        </div>
      </div>
    </div>
  );
}

function WordCloud({ words }: { words: { word: string; count: number }[] }) {
  // Filter to words mentioned more than 3 times
  const filtered = words.filter((w) => w.count > 3);
  if (filtered.length === 0) return null;
  const max = filtered[0].count;

  // Spiral layout aiming toward sphere
  const W = 800;
  const H = 500;
  const cx = W / 2;
  const cy = H / 2;
  // Deterministic positions using a Fibonacci/golden-angle spiral
  const placements = filtered.map((w, i) => {
    const size = 0.85 + (w.count / max) * 2.2; // rem
    // spiral radius shrinks for bigger words (place big ones in center)
    const t = i / filtered.length;
    const angle = i * 2.399; // golden angle
    const radius = Math.sqrt(t) * Math.min(W, H) * 0.42;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius * 0.7; // squash slightly
    // alpha based on count
    const opacity = 0.55 + (w.count / max) * 0.45;
    return { ...w, x, y, size, opacity };
  });

  return (
    <div className="panel p-6">
      <h2 className="font-display text-2xl mb-4 text-center">Облако слов из общего чата</h2>
      <div
        className="relative mx-auto"
        style={{ width: "100%", maxWidth: W, height: H }}
      >
        {placements.map((p) => (
          <span
            key={p.word}
            className="absolute text-primary whitespace-nowrap -translate-x-1/2 -translate-y-1/2 select-none"
            style={{
              left: `${(p.x / W) * 100}%`,
              top: `${(p.y / H) * 100}%`,
              fontSize: `${p.size}rem`,
              opacity: p.opacity,
              lineHeight: 1,
            }}
            title={`${p.word} — ${p.count}`}
          >
            {p.word}
          </span>
        ))}
      </div>
    </div>
  );
}
