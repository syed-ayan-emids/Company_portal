import { useEffect, useState } from "react";
import { Boxes, X } from "lucide-react";
import { api } from "../api.js";

const STATUS_STYLES = {
  "AT RISK": { chip: "bg-red-50 text-emids-red", bar: "bg-emids-red" },
  ACTIVE: { chip: "bg-emids-tealsoft text-emids-tealdeep", bar: "bg-emids-teal" },
  PAUSED: { chip: "bg-gray-100 text-gray-500", bar: "bg-gray-400" },
  PLANNING: { chip: "bg-amber-50 text-amber-600", bar: "bg-emids-amber" },
  DONE: { chip: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
  default: { chip: "bg-emids-mist text-emids-navy/60", bar: "bg-emids-navy/30" },
};

export default function ProjectsModal({ open, onClose }) {
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setProjects(null);
    setError("");
    api
      .projects()
      .then((r) => setProjects(r.projects))
      .catch((e) => setError(e.message || "Could not load projects"));
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-emids-ink/60 backdrop-blur-sm" onMouseDown={onClose} />
      <div className="relative w-full max-w-2xl bg-emids-paper rounded-[28px] shadow-chat animate-pop overflow-hidden">
        <header className="hero-surface px-6 py-5 flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
            <Boxes size={18} className="text-emids-tealsky" />
          </span>
          <div>
            <p className="text-[15px] font-bold text-white">Projects</p>
            <p className="text-[11.5px] text-emids-tealsky">Your workstreams and company-wide programs</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </header>

        <div className="max-h-[60vh] overflow-y-auto thin-scroll p-3">
          {error ? <p className="py-10 text-center text-[13px] text-emids-navy/50">{error}</p> : null}

          {!error && projects ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {projects.map((p) => {
                const st = STATUS_STYLES[p.status] || STATUS_STYLES.default;
                return (
                  <div
                    key={p.id}
                    className="border border-emids-line rounded-3xl p-5 hover:border-emids-tealsky hover:shadow-card transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[14.5px] font-bold text-emids-navy leading-snug">{p.name}</p>
                      <span className={`shrink-0 text-[10px] font-bold tracking-wider rounded-full px-2.5 py-1 ${st.chip}`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-emids-navy/50 mt-1.5 leading-relaxed line-clamp-2">{p.description}</p>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-emids-navy/45">{p.role || "Team"}</span>
                        <span className="text-emids-navy/60">{p.progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-emids-mist mt-1.5 overflow-hidden">
                        <div className={`h-full rounded-full ${st.bar}`} style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>
                    <p className="text-[11.5px] text-emids-navy/40 mt-3">
                      {p.due_date ? (
                        <>
                          Due{" "}
                          {new Date(p.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </>
                      ) : (
                        "No due date"
                      )}
                    </p>
                  </div>
                );
              })}
              {!projects.length ? (
                <p className="col-span-full py-10 text-center text-[13px] text-emids-navy/40">No projects yet.</p>
              ) : null}
            </div>
          ) : null}

          {!error && !projects ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <span className="w-8 h-8 rounded-xl emids-gradient animate-pulse" />
              <p className="text-[13px] text-emids-navy/45">Loading projects…</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
