import { useState } from "react";
import { CheckSquare, Plus, Square } from "lucide-react";
import { api } from "../api.js";
import CollapsibleCard from "./CollapsibleCard.jsx";

/**
 * Today's actions. Every row is a toggle: click to complete (green tick +
 * strike-through), click again to send it back to pending — no easy clicks lost.
 */
export default function ActionsCard({ actions, doneCount, collapsed, onToggle, privacyOn, onChanged }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyIds, setBusyIds] = useState(new Set());

  async function toggleItem(item) {
    const nextStatus = item.status === "COMPLETED" ? "TODO" : "COMPLETED";
    setBusyIds((s) => new Set([...s, item.id]));
    try {
      await api.setActionStatus(item.id, nextStatus);
      onChanged();
    } finally {
      setBusyIds((s) => {
        const out = new Set(s);
        out.delete(item.id);
        return out;
      });
    }
  }

  async function addDraft(e) {
    e.preventDefault();
    if (!draft.trim() || busy) return;
    setBusy(true);
    try {
      await api.addAction(draft.trim());
      setDraft("");
      setAdding(false);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  const pending = actions.filter((a) => a.status !== "COMPLETED");
  const done = actions.filter((a) => a.status === "COMPLETED");

  function Row({ a }) {
    const isDone = a.status === "COMPLETED";
    const pinned = busyIds.has(a.id);
    return (
      <button
        onClick={() => toggleItem(a)}
        disabled={pinned}
        title={isDone ? "Mark as pending again" : "Mark as done"}
        className={`group flex items-center gap-3.5 w-full text-left rounded-2xl px-4 py-3 transition-all
          ${isDone ? "bg-emerald-50/60 hover:bg-emerald-50" : "bg-emids-mist/60 hover:bg-emids-tealsoft/70 border border-transparent hover:border-emids-tealsky/40"}
          ${pinned ? "opacity-50" : ""}`}
      >
        {isDone ? (
          <CheckSquare size={19} className="text-emerald-500 shrink-0" strokeWidth={2.4} />
        ) : (
          <Square size={18} className="text-emids-navy/30 group-hover:text-emids-tealdeep transition-colors shrink-0" strokeWidth={2.4} />
        )}
        <span className="flex-1 min-w-0">
          <span className={`block text-[14px] font-semibold truncate ${isDone ? "text-emids-navy/45 line-through decoration-emerald-500 decoration-2" : "text-emids-navy"}`}>
            {a.title}
          </span>
          {a.due_date ? (
            <span className={`block text-[11.5px] mt-0.5 ${isDone ? "text-emerald-500/70" : "text-emids-navy/45"}`}>
              Due {new Date(a.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          ) : null}
        </span>
        {isDone ? (
          <span className="text-[10px] font-bold tracking-wider text-emerald-600 uppercase">Done</span>
        ) : null}
      </button>
    );
  }

  return (
    <CollapsibleCard
      title="Actions"
      subtitle={`${pending.length} pending`}
      collapsed={collapsed}
      onToggle={onToggle}
      privacyOn={privacyOn}
      headerRight={
        <span className="text-[10.5px] font-bold tracking-wider text-white bg-emerald-400 rounded-full px-2.5 py-1">
          ✓ {doneCount || done.length} done
        </span>
      }
    >
      <div className="flex flex-col gap-2">
        {pending.map((a) => (
          <Row key={a.id} a={a} />
        ))}
        {done.map((a) => (
          <Row key={a.id} a={a} />
        ))}
        {!actions.length && (
          <p className="text-[13px] text-emids-navy/40 py-6 text-center">All caught up — nothing pending.</p>
        )}
      </div>

      <div className="mt-4">
        {adding ? (
          <form onSubmit={addDraft} className="flex items-center gap-2 animate-pop">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setAdding(false)}
              placeholder="Describe the action…"
              className="flex-1 bg-white border border-emids-tealsky rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none"
            />
            <button
              type="submit"
              disabled={busy}
              className="emids-gradient-red text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl disabled:opacity-50"
            >
              Add
            </button>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full rounded-2xl bg-emids-mist hover:bg-emids-tealsoft text-emids-navy/55 hover:text-emids-tealdeep text-[12px] font-bold tracking-[0.18em] uppercase py-3.5 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={15} /> Add action
          </button>
        )}
      </div>
    </CollapsibleCard>
  );
}
