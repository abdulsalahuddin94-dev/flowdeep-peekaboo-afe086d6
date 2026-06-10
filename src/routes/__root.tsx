import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter,
  HeadContent, Scripts, useNavigate, useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

import appCss from "../styles.css?url";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppTopbar } from "@/components/AppTopbar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProjectsProvider } from "@/lib/projects-store";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-medium text-accent">404</h1>
        <h2 className="mt-4 text-xl font-medium text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Nexus PMO — Enterprise Portfolio Management" },
      { name: "description", content: "Strategic portfolio, pipeline, resources, and governance for the enterprise PMO." },
      { name: "theme-color", content: "#0B1120" },
      { property: "og:title", content: "Nexus PMO — Enterprise Portfolio Management" },
      { property: "og:description", content: "Strategic portfolio, pipeline, resources, and governance for the enterprise PMO." },
      { name: "twitter:title", content: "Nexus PMO — Enterprise Portfolio Management" },
      { name: "twitter:description", content: "Strategic portfolio, pipeline, resources, and governance for the enterprise PMO." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/22620826-27a7-4c30-8622-5cfffcd30a0e/id-preview-fe5adaf1--f8986191-21e9-4ad6-b2f7-3dd205d75fc5.lovable.app-1779283908595.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/22620826-27a7-4c30-8622-5cfffcd30a0e/id-preview-fe5adaf1--f8986191-21e9-4ad6-b2f7-3dd205d75fc5.lovable.app-1779283908595.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ProjectsProvider>
      <TooltipProvider delayDuration={120}>
          <SidebarProvider defaultOpen>
            <div className="flex min-h-screen w-full bg-background text-foreground">
              <AppSidebar />
              <div className="flex min-w-0 flex-1 flex-col">
                <AppTopbar />
                <main className="flex-1 overflow-x-hidden px-6 py-6 md:px-10 md:py-8">
                  <Outlet />
                </main>
              </div>
            </div>
          </SidebarProvider>
        <Toaster richColors theme="dark" position="bottom-right" />
      </TooltipProvider>
      </ProjectsProvider>
    </QueryClientProvider>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [status, setStatus] = useState<"loading" | "in" | "out">("loading");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setStatus(session ? "in" : "out");
    });
    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? "in" : "out");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (status === "out" && pathname !== "/auth") {
      navigate({ to: "/auth", replace: true });
    }
  }, [status, pathname, navigate]);

  if (pathname === "/auth") return <Outlet />;

  if (status !== "in") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  return <>{children}</>;
}
