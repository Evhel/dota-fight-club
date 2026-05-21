import { Link, useLocation } from "@tanstack/react-router";
import { useAdmin, logoutAdmin } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, Swords } from "lucide-react";

const NAV = [
  { to: "/", label: "Главная" },
  { to: "/matches", label: "Матчи" },
  { to: "/match", label: "Поиск матча" },
  { to: "/players", label: "Игроки" },
  { to: "/heroes", label: "Герои" },
  { to: "/player", label: "Игрок" },
  { to: "/records", label: "Рекорды" },
  { to: "/vs", label: "Игрок vs Игрок" },
];

export function Header() {
  const admin = useAdmin();
  const loc = useLocation();
  return (
    <header className="border-b border-border/60 bg-card/60 backdrop-blur-md sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
        <Link to="/" className="flex items-center gap-2 group">
          <Swords className="h-6 w-6 text-primary group-hover:rotate-12 transition" />
          <div className="font-display text-lg leading-none">
            <div className="text-glow tracking-wider">Бойцовский Клуб</div>
            <div className="text-xs text-muted-foreground tracking-[0.3em]">DOTA 2</div>
          </div>
        </Link>
        <nav className="flex flex-wrap gap-1 ml-2">
          {NAV.map((n) => {
            const active =
              n.to === "/"
                ? loc.pathname === "/"
                : loc.pathname === n.to || loc.pathname.startsWith(n.to + "/");
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`px-3 py-1.5 rounded-md text-sm transition ${
                  active
                    ? "bg-primary/20 text-foreground border border-primary/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {admin ? (
            <>
              <Link
                to="/admin"
                className="px-3 py-1.5 rounded-md text-sm bg-accent/40 border border-accent text-foreground flex items-center gap-1.5"
              >
                <Shield className="h-3.5 w-3.5" /> Админ
              </Link>
              <Button variant="ghost" size="sm" onClick={() => logoutAdmin()}>
                <LogOut className="h-4 w-4 mr-1" /> Выйти
              </Button>
            </>
          ) : (
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground border border-border hover:border-primary/40"
            >
              Вход админа
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
