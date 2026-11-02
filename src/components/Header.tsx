import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { useAdmin, logoutAdmin } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, Swords, Menu, X } from "lucide-react";

const NAV = [
  { to: "/", label: "Главная" },
  { to: "/matches", label: "Матчи" },
  { to: "/match", label: "Поиск матча" },
  { to: "/players", label: "Игроки" },
  { to: "/heroes", label: "Герои" },
  { to: "/player", label: "Игрок" },
  { to: "/records", label: "Рекорды" },
  { to: "/vs", label: "Игрок vs Игрок" },
  { to: "/connections", label: "Связь" },
];

export function Header() {
  const admin = useAdmin();
  const loc = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="border-b border-border/60 bg-card/60 backdrop-blur-md sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
        <Link to="/" className="flex items-center gap-2 group" onClick={() => setMenuOpen(false)}>
          <Swords className="h-6 w-6 text-primary group-hover:rotate-12 transition" />
          <div className="font-display text-lg leading-none">
            <div className="text-glow tracking-wider">Бойцовский Клуб</div>
            <div className="text-xs text-muted-foreground tracking-[0.3em]">DOTA 2</div>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-expanded={menuOpen}
          aria-controls="club-navigation"
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          className="md:hidden ml-auto rounded-md border border-border p-2 hover:bg-muted"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav
          id="club-navigation"
          className={`${menuOpen ? "flex" : "hidden"} md:flex flex-wrap gap-1 md:ml-2 order-last w-full md:order-none md:w-auto`}
        >
          {NAV.map((n) => {
            const active =
              n.to === "/"
                ? loc.pathname === "/"
                : loc.pathname === n.to ||
                  loc.pathname.startsWith(n.to + "/") ||
                  (n.to === "/heroes" && /\/hero\//.test(loc.pathname));
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setMenuOpen(false)}
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
        <div className={`${menuOpen ? "flex" : "hidden"} md:flex ml-auto items-center gap-2`}>
          {admin ? (
            <>
              <Link
                to="/admin"
                onClick={() => setMenuOpen(false)}
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
              onClick={() => setMenuOpen(false)}
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
