import { useState } from "react";
import { ChevronDown, Copy, Link2, Presentation, UsersRound } from "lucide-react";
import CollapsibleCard from "./CollapsibleCard.jsx";
import { fmtShort, fmtTime } from "../api.js";

function CopyLink({ url }) {
  const [copied, setCopied] = useState(false);
  if (!url) return null;
  return (
    <button
      title="Copy meeting link"
      onClick={() => {
        navigator.clipboard?.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="text-emids-navy/35 hover:text-emids-tealdeep transition-colors"
    >
      {copied ? <Check /> : <Link2 size={15} />}
    </button>
  );
}

function Check() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function MeetingSyncCard({ meetings, collapsed, onToggle, privacyOn }) {
  return (
    <CollapsibleCard
      title="Meeting Sync"
      subtitle="Priority queue"
      collapsed={collapsed}
      onToggle={onToggle}
      privacyOn={privacyOn}
    >
      <div className="flex flex-col gap-2.5">
        {meetings.slice(0, 4).map((m) => (
          <div key={m.id} className="flex items-center gap-4 bg-emids-mist/60 hover:bg-emids-tealsoft/70 border border-transparent hover:border-emids-tealsky/40 rounded-2xl px-4 py-3.5 transition-all group">
            <span className="w-10 h-10 rounded-xl bg-white border border-emids-line flex items-center justify-center shrink-0">
              {m.platform?.toLowerCase().includes("zoom") ? (
                <UsersRound size={18} className="text-sky-500" strokeWidth={2} />
              ) : (
                <Presentation size={18} className="text-indigo-500" strokeWidth={2} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-emids-navy truncate">{m.title}</p>
              <p className="text-[12px] text-emids-navy/45 mt-0.5 flex items-center gap-1.5">
                {fmtShort(m.start_datetime)} · {m.platform}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <CopyLink url={m.meeting_url} />
              {m.meeting_url ? (
                <a
                  href={m.meeting_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold tracking-widest uppercase bg-white border border-emids-line hover:border-emids-teal hover:text-emids-tealdeep text-emids-navy/70 rounded-xl px-3.5 py-1.5 transition-all"
                >
                  Join
                </a>
              ) : (
                <span className="text-[11px] font-bold tracking-widest uppercase text-emids-navy/35 bg-white border border-emids-line rounded-xl px-3.5 py-1.5">
                  Prep
                </span>
              )}
            </div>
          </div>
        ))}
        {!meetings.length && (
          <p className="text-[13px] text-emids-navy/40 py-6 text-center">No meetings in the pipeline.</p>
        )}
      </div>
    </CollapsibleCard>
  );
}
