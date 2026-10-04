import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownUp, Boxes, CalendarDays, CircleHelp, Eraser, ExternalLink, Eye, LogOut,
  MessageSquare, Plus, Search, ShieldCheck, Sparkles,
} from "lucide-react";
import { appMeta } from "./appIcons.js";

const AssistantIcon = Sparkles;

/**
 * Keyboard-first command palette (⌘K / Ctrl+K).
 * One compact surface fronts every portal action: run commands, ask the
 * assistant, jump to apps, add actions — so the home page stays lean.
 */
export default function CommandPalette({
  open,
  onClose,
  apps,
  privacyOn,
  onTogglePrivacy,
  onOpenSchedule,
  onAddAction,
  onAssistant,
  onLogout,
  onExpandBriefings,
  onOpenProjects,
}) {
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setCursor(0);
      setAdding(false);
      setDraft("");
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  const commands = useMemo(() => {
    const cmds = [];

    if (!privacyOn) {
      cmds.push(
        { id: "add", group: "Do it", icon: Plus, tint: "text-emids-red", label: "Add a new action", hint: "type or pick", keepOpen: true, run: () => { setAdding(true); inputRef.current?.focus(); } },
        { id: "ask-tasks", group: "Ask the Assistant", icon: AssistantIcon, tint: "text-emids-tealdeep", label: "My pending tasks", hint: "assistant", run: () => onAssistant("my tasks") },
        { id: "ask-meetings", group: "Ask the Assistant", icon: AssistantIcon, tint: "text-emids-tealdeep", label: "Meetings today", hint: "assistant", run: () => onAssistant("my meetings today") },
        { id: "ask-briefings", group: "Ask the Assistant", icon: AssistantIcon, tint: "text-emids-tealdeep", label: "Latest briefings", hint: "assistant", run: () => onAssistant("show briefings") },
        { id: "ask-tickets", group: "Ask the Assistant", icon: AssistantIcon, tint: "text-emids-tealdeep", label: "My support tickets", hint: "assistant", run: () => onAssistant("my tickets") },
        { id: "schedule", group: "Navigate", icon: CalendarDays, tint: "text-emids-navy", label: "Open full schedule", hint: "events", run: onOpenSchedule },
        { id: "projects", group: "Navigate", icon: Boxes, tint: "text-emids-tealdeep", label: "Open projects", hint: "workstreams", run: onOpenProjects },
        { id: "briefs", group: "Navigate", icon: MessageSquare, tint: "text-emids-tealdeep", label: "Read all briefings", hint: "archives", run: onExpandBriefings },
      );
    }

    cmds.push({
      id: "privacy",
      group: "Do it",
      icon: privacyOn ? Eye : ShieldCheck,
      tint: privacyOn ? "text-emids-tealdeep" : "text-emids-navy",
      label: privacyOn ? "Turn off privacy mode" : "Turn on privacy mode",
      hint: "shared screens",
      run: () => onTogglePrivacy(),
    });

    for (const a of apps) {
      const meta = appMeta(a.icon);
      cmds.push({
        id: `app-${a.id}`,
        group: "Open app",
        icon: meta.icon,
        tint: meta.tint,
        label: a.name,
        hint: (a.url || "").replace(/^https?:\/\//, "").slice(0, 26),
        run: () => {
          if (a.url && !a.url.startsWith("/")) window.open(a.url, "_blank", "noreferrer");
        },
      });
    }

    cmds.push({
      id: "help",
      group: "Navigate",
      icon: CircleHelp,
      tint: "text-emids-navy/50",
      label: "What can the Assistant do?",
      hint: "assistant",
      run: () => onAssistant("help"),
    });
    cmds.push({
      id: "clear",
      group: "Do it",
      icon: Eraser,
      tint: "text-emids-navy/50",
      label: "Reset the Assistant conversation",
      hint: "clears chat",
      run: () => onAssistant("__clear__"),
    });
    cmds.push({
      id: "logout",
      group: "Account",
      icon: LogOut,
      tint: "text-emids-navy/50",
      label: "Sign out",
      hint: "session",
      run: onLogout,
    });

    const needle = q.trim().toLowerCase();
    if (!needle) return cmds;
    return cmds.filter((c) => (c.label + " " + (c.hint || "") + " " + (c.group || "")).toLowerCase().includes(needle));
  }, [q, apps, privacyOn, onTogglePrivacy, onOpenSchedule, onAssistant, onLogout, onExpandBriefings]);

  useEffect(() => {
    setCursor((c) => Math.min(c, Math.max(0, commands.length - 1)));
  }, [commands.length]);

  function pick(index) {
    const c = commands[index];
    if (!c) return;
    if (!c.keepOpen) onClose();
    queueMicrotask(() => c.run());
  }

  function onKeyDown(e) {
    if (adding && e.key === "Escape") {
      e.preventDefault();
      setAdding(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (c + 1) % Math.max(1, commands.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (c - 1 + commands.length) % Math.max(1, commands.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (adding) {
        if (!draft.trim()) return;
        onClose();
        const done = draft;
        setDraft("");
        setAdding(false);
        onAddAction(done.trim());
        return;
      }
      pick(cursor);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
    if (listRef.current) {
      const el = listRef.current.children[cursor];
      el?.scrollIntoView({ block: "nearest" });
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4">
      <div className="absolute inset-0 bg-emids-ink/55 backdrop-blur-[3px]" onMouseDown={onClose} />
      <div className="relative w-full max-w-[560px] bg-emids-paper border border-emids-line rounded-3xl shadow-chat overflow-hidden animate-pop">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-emids-line bg-emids-mist/50">
          {adding ? (
            <>
              <Plus size={17} className="text-emids-red shrink-0" />
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Describe the action and press Enter…"
                className="flex-1 bg-transparent outline-none text-[15px] font-medium text-emids-navy placeholder-emids-navy/30"
              />
              <kbd className="text-[10px] font-semibold text-emids-navy/40 bg-white border border-emids-line rounded-md px-1.5 py-0.5">↵ save</kbd>
              <kbd className="text-[10px] font-semibold text-emids-navy/40 bg-white border border-emids-line rounded-md px-1.5 py-0.5">esc back</kbd>
            </>
          ) : (
            <>
              <Search size={17} className="text-emids-navy/35 shrink-0" />
              <input
                ref={inputRef}
                autoFocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setCursor(0);
                }}
                onKeyDown={onKeyDown}
                placeholder={privacyOn ? "Privacy mode — apps and quick controls only" : "Search actions, meetings, apps… or type a command"}
                className="flex-1 bg-transparent outline-none text-[15px] font-medium text-emids-navy placeholder-emids-navy/30"
              />
              <kbd className="text-[10px] font-semibold text-emids-navy/40 bg-white border border-emids-line rounded-md px-1.5 py-0.5">↵ run</kbd>
              <kbd className="text-[10px] font-semibold text-emids-navy/40 bg-white border border-emids-line rounded-md px-1.5 py-0.5">esc</kbd>
            </>
          )}
        </div>

        <div ref={listRef} className="max-h-[46vh] overflow-y-auto thin-scroll py-2">
          {commands.map((c, i) => {
            const prev = commands[i - 1];
            const showGroup = !prev || prev.group !== c.group;
            const Icon = c.icon;
            return (
              <div key={c.id}>
                {showGroup ? (
                  <p className="px-5 pt-2.5 pb-1 text-[10px] font-bold tracking-[0.2em] uppercase text-emids-navy/35 flex items-center gap-2">
                    {c.group}
                    <span className="flex-1 h-px bg-emids-line/70" />
                  </p>
                ) : null}
                <button
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => pick(i)}
                  className={`w-full px-5 py-2.5 flex items-center gap-3 text-left transition-colors ${cursor === i ? "bg-emids-tealsoft/70" : ""}`}
                >
                  <span className="w-8 h-8 rounded-xl bg-emids-mist flex items-center justify-center shrink-0">
                    <Icon size={16} className={c.tint} strokeWidth={2} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13.5px] font-semibold text-emids-navy truncate">{c.label}</span>
                  </span>
                  {c.hint ? (
                    <span className="text-[11px] text-emids-navy/35 truncate max-w-[160px]">{c.hint}</span>
                  ) : null}
                </button>
              </div>
            );
          })}

          {!commands.length ? (
            <div className="py-10 text-center">
              <ArrowDownUp size={20} className="mx-auto text-emids-navy/25 mb-2" />
              <p className="text-[13px] font-medium text-emids-navy/40">No match — try "task", "meeting" or an app name.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
