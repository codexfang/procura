import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import StatusIndicator from "./components/StatusIndicator";
import Dashboard from "./pages/Dashboard";
import RFPDetail from "./pages/RFPDetail";
import DraftViewer from "./pages/DraftViewer";
import ProfileSetup from "./pages/ProfileSetup";
import { api } from "./services/api";
import { checkBackend, cache, BACKEND_STATUS_KEY } from "./services/cache";
import { mockData } from "./utils/mockData";

function useBackendStatus() {
  const [online, setOnline] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function check() {
      const cached = cache.get(BACKEND_STATUS_KEY);
      if (cached) {
        if (mounted) setOnline(cached.online);
      }

      const isOnline = await checkBackend();
      if (mounted) setOnline(isOnline);
    }

    check();
    const interval = setInterval(async () => {
      const isOnline = await checkBackend();
      if (mounted) setOnline(isOnline);
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return online;
}

function getStoredView() {
  try {
    const stored = sessionStorage.getItem("procura_view");
    return stored ? JSON.parse(stored) : { activeView: "dashboard", matchId: null, draftId: null };
  } catch {
    return { activeView: "dashboard", matchId: null, draftId: null };
  }
}

function storeView(state) {
  try {
    sessionStorage.setItem("procura_view", JSON.stringify(state));
  } catch {}
}

export default function App() {
  const backendOnline = useBackendStatus();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [view, setView] = useState(getStoredView);

  useEffect(() => {
    storeView(view);
  }, [view]);

  function navigate(activeView, opts = {}) {
    setView((prev) => ({ ...prev, activeView, ...opts }));
  }

  function handleSelectMatch(match) {
    navigate("rfp-detail", { matchId: match.id });
  }

  function handleGenerateDraft(match) {
    const existing = mockData.drafts.find((d) => d.match_id === match.id);
    if (existing) {
      navigate("drafts", { draftId: existing.id, matchId: match.id });
    } else {
      navigate("drafts", { draftId: null, matchId: match.id });
    }
  }

  const isLoading = backendOnline === null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gov-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Connecting to Procura...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        activeView={view.activeView}
        onNavigate={(v) => navigate(v)}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />

      <main className="flex-1 lg:ml-64 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <header className="flex items-center justify-between mb-6 lg:mb-8">
            <div className="lg:hidden" />
            <StatusIndicator backendOnline={backendOnline} />
          </header>

          {view.activeView === "dashboard" && (
            <Dashboard
              backendOnline={backendOnline}
              api={api}
              onSelectMatch={handleSelectMatch}
            />
          )}

          {view.activeView === "rfp-detail" && (
            <RFPDetail
              backendOnline={backendOnline}
              api={api}
              matchId={view.matchId}
              onBack={() => navigate("dashboard")}
              onGenerateDraft={handleGenerateDraft}
            />
          )}

          {view.activeView === "drafts" && (
            <DraftViewer
              backendOnline={backendOnline}
              api={api}
              draftId={view.draftId}
              matchId={view.matchId}
              onBack={() => navigate("dashboard")}
            />
          )}

          {view.activeView === "profile" && (
            <ProfileSetup backendOnline={backendOnline} api={api} />
          )}
        </div>
      </main>
    </div>
  );
}
