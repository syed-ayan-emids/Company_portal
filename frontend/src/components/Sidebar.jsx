import { useEffect, useRef, useState } from "react";
import {
  Boxes, CircleHelp, ClipboardList, Clock, Home, LayoutGrid, Sparkles,
} from "lucide-react";
import EmidsMark from "./EmidsMark.jsx";
import { PORTALS } from "./portals.js";
import { appMeta } from "./appIcons.js";

const NAV = [
  { id: "home", icon: Home, tip: "Home" },
  { id: "projects", icon: Boxes, tip: "Projects" },
  { id: "history", icon: Clock, tip: "Recent activity" },
  { id: "docs", icon: ClipboardList, tip: "Documents" },
];

export default function Sidebar({
  user,
  activeNav,
  onNav,
  onOpenChat,
  onLogout,
  apps,
  onOpenProjects,
  onPendingPortal,
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    function onDown(e) {
      if (moreOpen && moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [moreOpen]);

  function pick(id) {
    if (id === "projects") {
      onOpenProjects(true);
      onNavKeep("projects");
      return;
    }
    onNav(id);
  }

  function clickPortal(p) {
    setMoreOpen(false);
    if (p.action === "projects") {
      pick("projects");
      return;
    }
    if (p.url && !p.url.startsWith("#")) {
      if (/^https?:/.test(p.url)) window.open(p.url, "_blank", "noreferrer");
      else onPendingPortal(p.name);
      return;
    }
    onPendingPortal(p.name);
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-[84px] bg-emids-ink flex flex-col items-center py-5 z-50 select-none">
      <div className="w-12 h-12 rounded-2xl emids-gradient shadow-pop flex items-center justify-center mb-8">
        <EmidsMark className="w-7 h-7 text-white" />
      </div>

      <nav className="flex flex-col gap-2.5">
        {NAV.map(({ id, icon: Icon, tip }) => {
          const active = activeNav === id;
          return (
            <button
              key={id}
              onClick={() => pick(id)}
              title={tip}
              className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group
                ${active ? "bg-white/10 text-white" : "text-white/35 hover:text-white/80 hover:bg-white/5"}`}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.9} />
              <span className="absolute left-[60px] top-1/2 -translate-y-1/2 bg-emids-navy text-white text-[11px] font-medium px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-pop z-50 w-max">
                {tip}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="relative" ref={moreRef}>
        <button
          onClick={() => setMoreOpen((v) => !v)}
          title="All portals"
          className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group
            ${moreOpen ? "bg-white/10 text-emids-tealsky" : "text-white/35 hover:text-white/80 hover:bg-white/5"}`}
        >
          <LayoutGrid size={22} strokeWidth={1.9} />
          <span className="absolute left-[60px] top-1/2 -translate-y-1/2 bg-emids-navy text-white text-[11px] font-medium px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-pop z-50">
            All portals
          </span>
        </button>

        {moreOpen ? (
          <div className="absolute left-[70px] bottom-0 w-[364px] max-w-[calc(100vw-110px)] bg-emids-paper border border-emids-line rounded-[28px] shadow-chat p-3.5 animate-pop z-50">
            <p className="px-2 pt-1 pb-2.5 text-[10.5px] font-bold tracking-[0.2em] uppercase text-emids-navy/45">
              Company portals
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {PORTALS.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.slug}
                    onClick={() => clickPortal(p)}
                    title={p.name}
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-transparent hover:border-emids-line hover:bg-emids-mist/60 px-1.5 py-3 transition-all"
                  >
                    <span className={`w-10 h-10 rounded-xl ${p.bg} flex items-center justify-center`}>
                      <Icon size={19} className={p.tint} strokeWidth={1.9} />
                    </span>
                    <span className="text-[11px] font-semibold text-emids-navy/75 text-center leading-tight">{p.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="my-3 flex items-center gap-2 px-2">
              <p className="text-[10.5px] font-bold tracking-[0.2em] uppercase text-emids-navy/40 whitespace-nowrap">
                Ecosystem apps
              </p>
              <span className="flex-1 h-px bg-emids-line" />
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {apps.map((a) => {
                const meta = appMeta(a.icon);
                const Icon = meta.icon;
                const external = /^https?:/.test(a.url || "");
                return (
                  <a
                    key={a.id}
                    href={a.url || "#"}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noreferrer" : undefined}
                    title={a.name}
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-transparent hover:border-emids-line hover:bg-emids-mist/60 px-1.5 py-3 transition-all"
                  >
                    <span className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center`}>
                      <Icon size={19} className={meta.tint} strokeWidth={1.9} />
                    </span>
                    <span className="text-[11px] font-semibold text-emids-navy/75 text-center leading-tight">{a.name}</span>
                  </a>
                );
              })}
            </div>

            <p className="mt-3 px-2 text-[10.5px] text-emids-navy/35">
              Tip: the slim dock on the right edges the screen for your daily apps.
            </p>
          </div>
        ) : null}
      </div>

      <button
        onClick={() => onNav("help")}
        title="Help & support"
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white/35 hover:text-white/80 hover:bg-white/5 transition-all mb-2"
      >
        <CircleHelp size={22} strokeWidth={1.9} />
      </button>

      <button
        onClick={onOpenChat}
        title="emids Assistant"
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 text-white/35 hover:text-emids-tealsky hover:bg-white/5 transition-all"
      >
        <Sparkles size={22} strokeWidth={1.9} />
      </button>

      <button onClick={onLogout} title={`Sign out ${user.name}`} className="mt-1 group relative">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.name}
            className={`w-11 h-11 rounded-2xl object-cover ring-2 transition-all ${
              activeNav === "account" ? "ring-emids-red" : "ring-white/15 group-hover:ring-emids-teal"
            }`}
          />
        ) : (
          <div className="w-11 h-11 rounded-2xl emids-gradient-red flex items-center justify-center text-white font-bold">
            {user.name?.[0]}
          </div>
        )}
        <span className="absolute -right-0.5 bottom-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-emids-ink" />
      </button>
    </aside>
  );
}
