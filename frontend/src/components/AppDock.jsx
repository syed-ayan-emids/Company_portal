import { useEffect, useRef, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { appMeta } from "./appIcons.js";
import EmidsMark from "./EmidsMark.jsx";

/**
 * Slim, fixed app dock pinned to the right edge of the screen.
 * Icon-only quick links (tooltips on hover) + an "all apps" popover.
 * Occupies ~64px; the content area fades short of it on wide screens.
 */
export default function AppDock({ apps, onOpenChat }) {
  const [open, setOpen] = useState(false);
  const popRef = useRef(null);

  useEffect(() => {
    function onDown(e) {
      if (open && popRef.current && !popRef.current.contains(e.target)) setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const showInRail = apps.slice(0, 5);

  return (
    <aside
      className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-1.5 py-3 px-1 bg-emids-paper/85 backdrop-blur border border-emids-line rounded-[20px] shadow-card"
      aria-label="App launcher dock"
    >
      <div className="w-9 h-9 rounded-xl emids-gradient flex items-center justify-center mb-0.5 shrink-0">
        <EmidsMark className="w-5 h-5 text-white" />
      </div>

      <span className="h-px w-6 bg-emids-line my-1" />

      {showInRail.map((a) => {
        const meta = appMeta(a.icon);
        const Icon = meta.icon;
        const external = /^https?:/.test(a.url || "");
        const inApp = a.url?.startsWith("/");
        const href = a.url || "#";
        return (
          <a
            key={a.id}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
            title={a.name}
            onClick={inApp ? (e) => e.preventDefault() : undefined}
            className="group relative w-10 h-10 rounded-xl flex items-center justify-center hover:bg-emids-mist transition-colors"
          >
            <Icon size={19} className={`${meta.tint} opacity-90 group-hover:opacity-100`} strokeWidth={1.9} />
            <span className="absolute right-[52px] top-1/2 -translate-y-1/2 bg-emids-navy text-white text-[11px] font-medium px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-pop">
              {a.name}
            </span>
          </a>
        );
      })}

      <div ref={popRef} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          title="All apps"
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${open ? "bg-emids-tealsoft text-emids-tealdeep" : "text-emids-navy/45 hover:bg-emids-mist hover:text-emids-navy"}`}
        >
          <LayoutGrid size={19} />
        </button>

        {open ? (
          <div className="absolute right-0 bottom-0 translate-y-[calc(100%+10px)] w-72 bg-emids-paper border border-emids-line rounded-3xl shadow-chat p-3 animate-pop z-50">
            <p className="px-2 pt-1 pb-2 text-[10.5px] font-bold tracking-[0.2em] uppercase text-emids-navy/45">
              Ecosystem · all apps
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {apps.map((a) => {
                const meta = appMeta(a.icon);
                const Icon = meta.icon;
                const external = /^https?:/.test(a.url || "");
                return (
                  <a
                    key={a.id}
                    href={a.url}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noreferrer" : undefined}
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-transparent hover:border-emids-line hover:bg-emids-mist/60 px-1 py-3 transition-all"
                  >
                    <span className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center`}>
                      <Icon size={19} className={meta.tint} strokeWidth={1.9} />
                    </span>
                    <span className="text-[11.5px] font-semibold text-emids-navy/75 text-center leading-tight">
                      {a.name}
                    </span>
                  </a>
                );
              })}
            </div>
            <p className="mt-2.5 px-2 text-[10.5px] text-emids-navy/35 leading-snug">
              Tip: press <kbd className="font-semibold text-emids-navy/60">⌘K</kbd> to jump anywhere from the keyboard.
            </p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
