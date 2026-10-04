import { Code2, FileText, ShieldCheck, Handshake, Clipboard, ListPlus, Check } from "lucide-react";
import { timeAgo } from "../api.js";
import CollapsibleCard from "./CollapsibleCard.jsx";

const CATEGORY_ICONS = {
  Engineering: { icon: Code2, bg: "bg-blue-50", text: "text-blue-500" },
  Security: { icon: ShieldCheck, bg: "bg-emerald-50", text: "text-emerald-600" },
  Work: { icon: Clipboard, bg: "bg-amber-50", text: "text-amber-500" },
  Meeting: { icon: Handshake, bg: "bg-violet-50", text: "text-violet-500" },
  default: { icon: FileText, bg: "bg-emids-mist", text: "text-emids-navy/70" },
};

/**
 * Briefings list with one-click "add this briefing to My Actions".
 * `addedSourceIds` marks briefings that already became a todo, and
 * `onAddToTasks` hands the briefing back to the Dashboard for the API call.
 */
export default function BriefingsCard({
  briefings,
  showAll,
  onReadAll,
  addedSourceIds,
  onAddToTasks,
  collapsed,
  onToggle,
  privacyOn,
}) {
  const list = showAll ? briefings : briefings.slice(0, 3);

  return (
    <CollapsibleCard
      title="Briefings"
      subtitle="Fresh Insights"
      collapsed={collapsed}
      onToggle={onToggle}
      privacyOn={privacyOn}
    >
      <div className="flex flex-col">
        {list.map((b) => {
          const meta = CATEGORY_ICONS[b.category] || CATEGORY_ICONS.default;
          const Icon = meta.icon;
          const added = addedSourceIds?.has(b.id);
          return (
            <div key={b.id} className="flex items-center gap-4 py-3 group/item">
              <span className={`w-11 h-11 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}>
                <Icon size={19} className={meta.text} strokeWidth={1.9} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-emids-navy leading-snug truncate">{b.title}</p>
                <p className="text-[12px] text-emids-navy/45 mt-0.5">
                  {b.source}
                  {b.due_date ? ` · due ${new Date(b.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ` · ${timeAgo(b.created_at)}`}
                </p>
              </div>
              {added ? (
                <span
                  title="Already in My Actions"
                  className="shrink-0 w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"
                >
                  <Check size={16} strokeWidth={2.5} />
                </span>
              ) : (
                <button
                  onClick={() => onAddToTasks(b)}
                  title="Add to My Actions"
                  className="shrink-0 w-8 h-8 rounded-xl bg-emids-mist text-emids-navy/40 hover:bg-emids-tealsoft hover:text-emids-tealdeep flex items-center justify-center transition-all active:scale-90"
                >
                  <ListPlus size={17} />
                </button>
              )}
            </div>
          );
        })}
        {!briefings.length && (
          <p className="text-[13px] text-emids-navy/40 py-6 text-center">No briefings in the archive yet.</p>
        )}
      </div>

      <button
        onClick={onReadAll}
        className="mt-4 w-full rounded-2xl bg-emids-tealsoft hover:bg-emids-tealsky/40 text-emids-tealdeep text-[12px] font-bold tracking-[0.18em] uppercase py-3.5 transition-colors"
      >
        {showAll ? "Show less" : "Read all archives"}
      </button>
    </CollapsibleCard>
  );
}
