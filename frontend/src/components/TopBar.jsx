import { useEffect, useRef, useState } from "react";
import { Bell, EyeOff, Eye, Search, Settings, Megaphone } from "lucide-react";
import { fmtDate, timeAgo } from "../api.js";

export default function TopBar({ user, data, privacyOn, onTogglePrivacy, onOpenPalette }) {
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (bellOpen && bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [bellOpen]);

  const announcements = data?.bulletins || [];

  function hourPart(h) {
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }
  const hello = privacyOn ? hourPart(new Date().getHours()) : `${hourPart(new Date().getHours())}, ${user.name.split()[0]}`;

  return (
    <header className="flex items-center justify-between gap-6 mb-7">
      <div>
        <h1 className="text-[26px] leading-tight font-bold tracking-tight text-emids-navy">{hello}</h1>
        <p className="text-[12.5px] font-medium text-emids-navy/45 mt-0.5 tracking-wide flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          {fmtDate(new Date()).toUpperCase()}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onOpenPalette}
          title="Search and commands (Ctrl/Cmd + K)"
          className={`group w-[300px] bg-white border border-emids-line hover:border-emids-teal rounded-full pl-11 pr-16 py-2.5 text-left relative shadow-card transition-all ${
            privacyOn ? "opacity-60" : ""
          }`}
        >
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emids-navy/30 group-hover:text-emids-tealdeep transition-colors" />
          <span className="block text-[13.5px] text-emids-navy/35 group-hover:text-emids-navy/55 font-medium truncate">
            {privacyOn ? "Search hidden during privacy mode" : "Search or run a command…"}
          </span>
          <kbd className="absolute right-4 top-1/2 -translate-y-1/2 text-[10.5px] font-semibold text-emids-navy/40 bg-emids-mist border border-emids-line rounded-md px-1.5 py-0.5">
            ⌘K
          </kbd>
        </button>

        <button
          onClick={onTogglePrivacy}
          title={privacyOn ? "End privacy mode" : "Privacy mode — collapse personal info"}
          className={`h-11 px-3.5 rounded-full border flex items-center gap-2 text-[13px] font-semibold transition-all shadow-card ${
            privacyOn
              ? "bg-emids-navy text-emids-tealsky border-emids-navy"
              : "bg-white text-emids-navy/70 border-emids-line hover:text-emids-navy"
          }`}
        >
          {privacyOn ? <EyeOff size={17} /> : <Eye size={17} />}
          <span className="hidden xl:inline">{privacyOn ? "Privacy ON" : "Privacy"}</span>
        </button>

        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen((v) => !v)}
            title="Notifications"
            className="relative w-11 h-11 rounded-full bg-white border border-emids-line shadow-card flex items-center justify-center text-emids-navy/60 hover:text-emids-navy transition-colors"
          >
            <Bell size={18} />
            {announcements.length ? (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emids-red ring-2 ring-white" />
            ) : null}
          </button>

          {bellOpen ? (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-emids-line shadow-chat animate-pop overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-emids-line flex items-center gap-2">
                <Megaphone size={14} className="text-emids-tealdeep" />
                <p className="text-[11px] font-semibold tracking-widest uppercase text-emids-navy/50">Notifications</p>
              </div>
              <div className="max-h-72 overflow-y-auto thin-scroll">
                {announcements.map((a) => (
                  <div key={a.id} className="px-4 py-3 hover:bg-emids-mist/60 transition-colors cursor-pointer border-b border-emids-line/60 last:border-0">
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                          a.importance === "HIGH" ? "bg-emids-red" : a.importance === "MEDIUM" ? "bg-emids-amber" : "bg-emids-teal"
                        }`}
                      />
                      <div>
                        <p className="text-[13px] font-semibold text-emids-navy leading-snug">{a.title}</p>
                        <p className="text-[11.5px] text-emids-navy/45 mt-0.5">
                          {a.category} · {timeAgo(a.published_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {!announcements.length && (
                  <p className="px-4 py-6 text-center text-[12.5px] text-emids-navy/40">No notifications right now.</p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <button
          title="Settings"
          className="w-11 h-11 rounded-full bg-white border border-emids-line shadow-card flex items-center justify-center text-emids-navy/60 hover:text-emids-navy hover:rotate-45 transition-all"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
