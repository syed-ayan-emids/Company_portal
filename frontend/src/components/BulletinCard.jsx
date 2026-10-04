import { useState } from "react";
import { Heart, Megaphone, Server, ShieldCheck, Sparkles, Sun, UsersRound } from "lucide-react";
import CollapsibleCard from "./CollapsibleCard.jsx";

const CAT = {
  HR: { icon: Sun, bg: "bg-amber-50", text: "text-amber-500" },
  Benefits: { icon: Heart, bg: "bg-rose-50", text: "text-rose-500" },
  IT: { icon: Server, bg: "bg-violet-50", text: "text-violet-500" },
  General: { icon: Megaphone, bg: "bg-emids-tealsoft", text: "text-emids-tealdeep" },
  Engineering: { icon: Sparkles, bg: "bg-blue-50", text: "text-blue-500" },
  default: { icon: UsersRound, bg: "bg-emids-mist", text: "text-emids-navy/60" },
};

export default function BulletinCard({ bulletins, collapsed, onToggle, privacyOn }) {
  const [liked, setLiked] = useState({});

  return (
    <CollapsibleCard
      title="Announcements"
      subtitle="Corporate news & communication"
      collapsed={collapsed}
      onToggle={onToggle}
      privacyOn={privacyOn}
    >
      <div className="flex flex-col">
        {bulletins.map((a) => {
          const meta = CAT[a.category] || CAT.default;
          const Icon = meta.icon;
          const isLiked = !!liked[a.id];
          return (
            <div key={a.id} className="flex items-center gap-4 py-3">
              <span className={`w-11 h-11 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}>
                <Icon size={19} className={`${meta.text} ${isLiked ? "fill-current" : ""}`} strokeWidth={1.9} />
              </span>
              <div className="min-w-0 flex-1 cursor-pointer group" title={a.description}>
                <p className="text-[14px] font-semibold text-emids-navy leading-snug group-hover:text-emids-tealdeep transition-colors truncate">
                  {a.title}
                </p>
                <p className="text-[12px] text-emids-navy/45 mt-0.5">{a.category}</p>
              </div>
              <button
                onClick={() => setLiked((s) => ({ ...s, [a.id]: !isLiked }))}
                title={isLiked ? "Liked" : "Like"}
                className={`shrink-0 transition-all ${isLiked ? "text-emids-red" : "text-emids-navy/25 hover:text-emids-red/60"}`}
              >
                <Heart size={18} fill={isLiked ? "currentColor" : "none"} strokeWidth={2} />
              </button>
            </div>
          );
        })}
        {!bulletins.length && (
          <p className="text-[13px] text-emids-navy/40 py-6 text-center">No announcements yet.</p>
        )}
      </div>
    </CollapsibleCard>
  );
}
