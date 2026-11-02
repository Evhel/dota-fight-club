import { Link } from "@tanstack/react-router";
import type { GlobalRecords } from "@/lib/stats";

export function RecordsTable({ records }: { records: GlobalRecords }) {
  const fmtK = (value: number) => `${(value / 1000).toFixed(1)}k`;
  const items: {
    label: string;
    record: GlobalRecords["top_kills"];
    format?: (value: number) => string;
  }[] = [
    { label: "💀 Самое большое количество убийств", record: records.top_kills },
    { label: "☠️ Самое большое количество смертей", record: records.top_deaths },
    { label: "🤝 Самое большое количество помощи", record: records.top_assists },
    { label: "✨ Лучший KDA с 0 смертей (K+A)", record: records.top_perfect_kda },
    { label: "💰 Максимум ценности в золоте", record: records.top_net_worth, format: fmtK },
    { label: "🗡️ Максимум ласт-хитов", record: records.top_creeps },
    { label: "🛡️ Максимум денаев", record: records.top_denies },
    { label: "🪙 Максимум GPM", record: records.top_gpm },
    { label: "📘 Максимум XPM", record: records.top_xpm },
    { label: "🔥 Максимум урона (DMG)", record: records.top_dmg, format: fmtK },
    { label: "💚 Максимум лечения (HEAL)", record: records.top_heal, format: fmtK },
    { label: "🏰 Максимум урона по строениям (BLD)", record: records.top_bld, format: fmtK },
  ];
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full text-sm text-center">
        <thead className="bg-muted/30">
          <tr>
            <th className="px-4 py-3 text-left">Рекорд</th>
            <th className="px-4 py-3">Игрок</th>
            <th className="px-4 py-3">Значение</th>
          </tr>
        </thead>
        <tbody>
          {items.map(({ label, record, format }) => (
            <tr key={label} className="border-t border-border/40 hover:bg-muted/20">
              <td className="px-4 py-3 text-left text-muted-foreground">
                {record ? (
                  <Link
                    to="/match/$id"
                    params={{ id: String(record.match_id) }}
                    className="hover:text-foreground hover:underline"
                  >
                    {label}
                  </Link>
                ) : (
                  label
                )}
              </td>
              <td className="px-4 py-3">
                {record ? (
                  <Link
                    to="/player"
                    search={{ nick: record.name }}
                    className="text-foreground hover:text-primary hover:underline"
                  >
                    {record.name}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 font-mono">
                {record ? (
                  <Link
                    to="/match/$id"
                    params={{ id: String(record.match_id) }}
                    className="hover:text-primary hover:underline"
                    title={`Открыть матч #${record.match_id}`}
                  >
                    {format ? format(record.value) : record.value}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
