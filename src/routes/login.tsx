import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { loginAdmin, useAdmin } from "@/lib/admin";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const admin = useAdmin();
  const navigate = useNavigate();
  const [pwd, setPwd] = useState("");

  useEffect(() => {
    if (admin) navigate({ to: "/admin" });
  }, [admin, navigate]);

  return (
    <div className="max-w-sm mx-auto mt-16 panel p-8">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-display">Вход администратора</h1>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (loginAdmin(pwd)) {
            toast.success("Добро пожаловать, мастер клуба");
            navigate({ to: "/admin" });
          } else {
            toast.error("Неверный пароль");
          }
        }}
        className="space-y-4"
      >
        <Input
          type="password"
          autoFocus
          placeholder="Пароль"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
        />
        <Button type="submit" className="w-full">
          Войти
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Игроки смотрят сайт без входа.{" "}
          <Link to="/" className="underline">
            На главную
          </Link>
        </p>
      </form>
    </div>
  );
}
