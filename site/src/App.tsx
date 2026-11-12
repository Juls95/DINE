import { useEffect, useState, type ReactNode } from "react";
import { loadBundle, type Bundle } from "./lib/bundle";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThesisPage } from "./pages/ThesisPage";
import { AgoraPage } from "./pages/AgoraPage";
import { AgentPage } from "./pages/AgentPage";
import { DashboardPage } from "./pages/DashboardPage";
import { SocialPage } from "./pages/SocialPage";
import { MethodologyPage } from "./pages/MethodologyPage";

const NAV = [
  { href: "#/", label: "Tesis" },
  { href: "#/agora", label: "Ágora" },
  { href: "#/dashboard", label: "Dashboard" },
  { href: "#/social", label: "Social" },
  { href: "#/metodologia", label: "Metodología" },
];

export function useHashRoute(): string {
  const read = () => window.location.hash.replace(/^#/, "") || "/";
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

export function Page({ route, bundle }: { route: string; bundle: Bundle }): ReactNode {
  const agent = /^\/agentes\/(\w+)$/.exec(route);
  if (agent) return <AgentPage bundle={bundle} id={agent[1] ?? ""} />;
  switch (route) {
    case "/agora": return <AgoraPage bundle={bundle} />;
    case "/dashboard": return <DashboardPage bundle={bundle} />;
    case "/social": return <SocialPage bundle={bundle} />;
    case "/metodologia": return <MethodologyPage />;
    default: return <ThesisPage bundle={bundle} />;
  }
}

export function MockBanner({ mode }: { mode: Bundle["mode"] }) {
  if (mode !== "mock") return null;
  return (
    <div className="mock-banner" role="status">
      DATOS SIMULADOS · Ninguna cifra de esta página describe a NEAR. Corre <code>pnpm refresh</code> con credenciales para datos reales.
    </div>
  );
}

export function App({ load = loadBundle }: { load?: () => Promise<Bundle> }) {
  const route = useHashRoute();
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load().then(setBundle, (err: unknown) => setError(err instanceof Error ? err.message : String(err)));
  }, [load]);

  return (
    <>
      {bundle && <MockBanner mode={bundle.mode} />}
      <header className="topbar">
        <a href="#/" className="brand">NEAR <span>RDC</span></a>
        <nav>
          {NAV.map((n) => (
            <a key={n.href} href={n.href} aria-current={`#${route}` === n.href ? "page" : undefined}>{n.label}</a>
          ))}
        </nav>
      </header>
      <main>
        {error && <div className="error-box" role="alert">{error}</div>}
        {!bundle && !error && <p className="muted">Cargando evidencia…</p>}
        {bundle && (
          <ErrorBoundary key={route} label="Página">
            <Page route={route} bundle={bundle} />
          </ErrorBoundary>
        )}
      </main>
      <footer>
        {bundle && <span>Generado {bundle.generated_at.slice(0, 10)} · modo {bundle.mode}</span>}
        <span>No es asesoría financiera.</span>
      </footer>
    </>
  );
}
