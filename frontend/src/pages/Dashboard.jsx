import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, Info, X } from "lucide-react";
import { api, fmtTime } from "../api.js";
import Sidebar from "../components/Sidebar.jsx";
import TopBar from "../components/TopBar.jsx";
import HeroSlider from "../components/HeroSlider.jsx";
import AppDock from "../components/AppDock.jsx";
import CommandPalette from "../components/CommandPalette.jsx";
import ProjectsModal from "../components/ProjectsModal.jsx";
import BriefingsCard from "../components/BriefingsCard.jsx";
import ActionsCard from "../components/ActionsCard.jsx";
import CalendarCard from "../components/CalendarCard.jsx";
import MeetingSyncCard from "../components/MeetingSyncCard.jsx";
import BulletinCard from "../components/BulletinCard.jsx";
import SupportCard from "../components/SupportCard.jsx";
import ChatWidget from "../components/ChatWidget.jsx";

const PRIVACY_KEY = "emids_portal_privacy";

function ScheduleModal({ open, onClose, events, meetings }) {
  if (!open) return null;
  const rows = [
    ...(events || []).map((e) => ({ ...e, kind: e.category })),
    ...(meetings || []).map((m) => ({ title: m.title, start_datetime: m.start_datetime, kind: m.platform, location: m.meeting_url })),
  ].sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-emids-ink/60 backdrop-blur-sm" onMouseDown={onClose} />
      <div className="relative w-full max-w-lg bg-emids-paper rounded-[28px] shadow-chat animate-pop overflow-hidden">
        <header className="hero-surface px-6 py-5 flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
            <CalendarDays size={18} className="text-emids-tealsky" />
          </span>
          <div>
            <p className="text-[15px] font-bold text-white">Full Schedule</p>
            <p className="text-[11.5px] text-emids-tealsky">Company events and your meetings</p>
          </div>
          <button onClick={onClose} className="ml-auto w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </header>
        <div className="max-h-[420px] overflow-y-auto thin-scroll">
          {rows.map((r, i) => (
            <div key={i} className="px-6 py-3.5 flex items-center gap-4 border-b border-emids-line/60 last:border-0 hover:bg-emids-mist/60 transition-colors">
              <div className="w-12 text-center shrink-0">
                <p className="text-[10px] font-bold uppercase text-emids-tealdeep">
                  {new Date(r.start_datetime).toLocaleDateString("en-US", { weekday: "short" })}
                </p>
                <p className="text-[17px] font-extrabold text-emids-navy leading-none">
                  {new Date(r.start_datetime).getDate()}
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-emids-navy truncate">{r.title}</p>
                <p className="text-[12px] text-emids-navy/45">
                  {fmtTime(r.start_datetime)} · {r.kind}
                  {r.location ? ` · ${r.location}` : ""}
                </p>
              </div>
            </div>
          ))}
          {!rows.length && <p className="py-8 text-center text-[13px] text-emids-navy/40">Nothing scheduled.</p>}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ user, setUser }) {
  const [data, setData] = useState(null);
  const [privacy, setPrivacy] = useState(() => localStorage.getItem(PRIVACY_KEY) === "1");
  const [collapsed, setCollapsed] = useState({});
  const [chatOpen, setChatOpen] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("home");
  const [showAllBriefings, setShowAllBriefings] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  function showToast(text) {
    clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  const load = useCallback(() => {
    api
      .dashboard()
      .then(setData)
      .catch((e) => e.unauthorized && setUser(null));
  }, [setUser]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function togglePrivacy() {
    setPrivacy((v) => {
      const next = !v;
      localStorage.setItem(PRIVACY_KEY, next ? "1" : "0");
      if (next) setCollapsed({});
      return next;
    });
  }

  function toggleCard(key) {
    setCollapsed((s) => ({ ...s, [key]: !s[key] }));
  }

  function toggleAllBriefings() {
    setShowAllBriefings((v) => {
      const next = !v;
      if (next) {
        setCollapsed((s) => ({ ...s, briefings: false }));
        setTimeout(() => document.getElementById("briefings-card")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      }
      return next;
    });
  }

  async function addBriefingToTasks(b) {
    try {
      await api.addAction(b.title, {
        source_type: "BRIEFING",
        source_id: b.id,
        due_date: b.due_date || null,
      });
      showToast(`Added to Actions${b.due_date ? " with its due date" : ""} ✓`);
    } catch (e) {
      showToast(e.message || "Could not add the briefing");
    } finally {
      load();
    }
  }

  function askAssistant(prompt) {
    if (prompt === "__clear__") {
      api.clearChat().catch(() => {});
      setChatOpen(false);
      setAssistantPrompt(null);
      return;
    }
    setChatOpen(true);
    setAssistantPrompt(prompt);
  }

  async function addFromPalette(title) {
    try {
      await api.addAction(title);
    } finally {
      load();
    }
  }

  function navTo(id) {
    setActiveNav(id);
    if (id !== "home") setTimeout(() => setActiveNav("home"), 900);
  }

  async function logout() {
    await api.logout().catch(() => {});
    setUser(null);
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-emids-mist">
        <Sidebar user={user} activeNav={activeNav} onNav={navTo} onOpenChat={setChatOpen} onLogout={logout} />
        <main className="ml-[84px] flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-3">
            <span className="w-9 h-9 rounded-xl emids-gradient animate-pulse" />
            <p className="text-[13px] text-emids-navy/45">Fetching your day…</p>
          </div>
        </main>
      </div>
    );
  }

  const nextMeeting = data.meeting_queue?.[0] || null;

  return (
    <div className="min-h-screen bg-emids-mist">
      <Sidebar
        user={user}
        activeNav={activeNav}
        onNav={navTo}
        onNavKeep={setActiveNav}
        onOpenChat={setChatOpen}
        onLogout={logout}
        apps={data.apps}
        onOpenProjects={setProjectsOpen}
        onPendingPortal={showToast}
      />
      <AppDock apps={data.apps} />

      <main className="ml-[84px] lg:mr-[88px] min-h-screen">
        <div className="mx-auto max-w-[1560px] px-8 py-7">
        <TopBar
          user={user}
          data={data}
          privacyOn={privacy}
          onTogglePrivacy={togglePrivacy}
          onOpenPalette={() => setPaletteOpen(true)}
        />

        <section className="mb-5">
          <HeroSlider
            hero={data.hero}
            comingEvents={(data.coming_events || []).filter((e) => e.title !== data.hero?.title)}
            bulletin={(data.bulletins || []).find((b) => b.title !== data.hero?.title)}
            nextMeeting={nextMeeting}
            onOpenSchedule={() => setScheduleOpen(true)}
            onReadBriefings={toggleAllBriefings}
          />
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
          <div id="briefings-card">
            <BriefingsCard
              briefings={data.briefings}
              showAll={showAllBriefings}
              addedSourceIds={
                new Set(
                  (data.actions || [])
                    .filter((a) => a.source_type === "BRIEFING" && a.source_id)
                    .map((a) => a.source_id)
                )
              }
              onAddToTasks={addBriefingToTasks}
              collapsed={collapsed.briefings}
              onToggle={() => toggleCard("briefings")}
              privacyOn={privacy}
              onReadAll={toggleAllBriefings}
            />
          </div>
          <ActionsCard
            actions={data.actions}
            doneCount={data.actions_done_count}
            collapsed={collapsed.actions}
            onToggle={() => toggleCard("actions")}
            privacyOn={privacy}
            onChanged={load}
          />
          <CalendarCard
            calendarEvents={data.calendar_events}
            nextMeeting={nextMeeting}
            collapsed={collapsed.calendar}
            onToggle={() => toggleCard("calendar")}
            privacyOn={privacy}
          />
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <MeetingSyncCard
            meetings={data.meeting_queue}
            collapsed={collapsed.meetings}
            onToggle={() => toggleCard("meetings")}
            privacyOn={privacy}
          />
          <BulletinCard
            bulletins={data.bulletins}
            collapsed={collapsed.bulletin}
            onToggle={() => toggleCard("bulletin")}
            privacyOn={privacy}
          />
          <SupportCard
            tickets={data.tickets}
            collapsed={collapsed.support}
            onToggle={() => toggleCard("support")}
            privacyOn={privacy}
          />
        </section>
        </div>
      </main>

      <ScheduleModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        events={data.coming_events}
        meetings={data.meeting_queue}
      />

      <ProjectsModal
        open={projectsOpen}
        onClose={() => {
          setProjectsOpen(false);
          setActiveNav((a) => (a === "projects" ? "home" : a));
        }}
      />

      {toast ? (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2.5 bg-emids-navy text-white text-[13px] font-medium px-5 py-3 rounded-2xl shadow-chat animate-pop">
          <Info size={16} className="text-emids-tealsky shrink-0" />
          {toast}
        </div>
      ) : null}

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        apps={data.apps}
        privacyOn={privacy}
        onTogglePrivacy={togglePrivacy}
        onOpenSchedule={() => setScheduleOpen(true)}
        onAddAction={addFromPalette}
        onAssistant={askAssistant}
        onLogout={logout}
        onExpandBriefings={toggleAllBriefings}
        onOpenProjects={() => setProjectsOpen(true)}
      />

      <ChatWidget
        open={chatOpen}
        setOpen={setChatOpen}
        pendingPrompt={assistantPrompt}
        onPromptDone={() => setAssistantPrompt(null)}
      />
    </div>
  );
}
