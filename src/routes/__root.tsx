import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/Header";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-forest-vignette">
      <div className="max-w-md text-center panel p-8">
        <h1 className="text-6xl font-display text-glow">404</h1>
        <p className="mt-3 text-muted-foreground">Этой страницы нет в архивах клуба.</p>
      </div>
    </div>
  );
}

function ErrorComponent({ error }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-forest-vignette">
      <div className="max-w-md text-center panel p-8">
        <h2 className="text-xl font-display">Что-то пошло не так</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Бойцовский клуб Dota 2" },
      {
        name: "description",
        content:
          "Статистика приватных матчей Dota 2: игроки, герои, рекорды и история боёв.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Inter:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-forest-vignette">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <Outlet />
        </main>
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}
