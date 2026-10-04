import { CheckCircle2, Clock, Headset, Loader } from "lucide-react";
import CollapsibleCard from "./CollapsibleCard.jsx";

const STATUS = {
  OPEN: { icon: Clock, text: "text-emids-red", label: "Open", bg: "bg-red-50" },
  IN_PROGRESS: { icon: Loader, text: "text-emids-tealdeep", label: "In progress", bg: "bg-emids-tealsoft" },
  WAITING: { icon: Clock, text: "text-amber-600", label: "Waiting", bg: "bg-amber-50" },
  RESOLVED: { icon: CheckCircle2, text: "text-emerald-600", label: "Resolved", bg: "bg-emerald-50" },
  default: { icon: Clock, text: "text-emids-navy/60", label: "Open", bg: "bg-emids-mist" },
};

export default function SupportCard({ tickets, collapsed, onToggle, privacyOn }) {
  return (
    <CollapsibleCard
      title="Support"
      subtitle="Active tickets"
      collapsed={collapsed}
      onToggle={onToggle}
      privacyOn={privacyOn}
    >
      <div className="flex flex-col">
        {tickets.map((t) => {
          const meta = STATUS[t.status] || STATUS.default;
          const Icon = meta.icon;
          return (
            <div key={t.id} className="flex items-center gap-4 py-3">
              <span className={`w-11 h-11 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}>
                <Icon size={19} className={meta.text} strokeWidth={1.9} />
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-emids-navy leading-snug truncate">{t.title}</p>
                <p className="text-[12px] mt-0.5 font-medium">
                  <span className={meta.text}>{meta.label}</span>
                  <span className="text-emids-navy/40"> · {t.category}</span>
                </p>
              </div>
            </div>
          );
        })}
        {!tickets.length && (
          <p className="text-[13px] text-emids-navy/40 py-6 text-center">No tickets — all clear.</p>
        )}
      </div>
    </CollapsibleCard>
  );
}
