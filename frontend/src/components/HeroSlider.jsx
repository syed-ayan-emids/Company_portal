import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Video } from "lucide-react";

function useCountdown(target) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const label = useMemo(() => {
    if (!target) return null;
    const diff = new Date(target).getTime() - now;
    if (diff <= 0) return { live: true };
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    if (days > 0) return { label: `${days}d ${String(hours).padStart(2, "0")}h` };
    if (hours > 0) return { label: `${hours}h ${String(mins).padStart(2, "0")}m` };
    return { label: `${mins}m ${String(secs).padStart(2, "0")}s` };
  }, [target, now]);
  return label;
}

function DatePill({ startsAt }) {
  const d = new Date(startsAt);
  return (
    <div className="shrink-0 text-center bg-white/10 border border-white/15 backdrop-blur-xl rounded-3xl px-8 py-6 shadow-pop">
      <p className="text-[26px] font-extrabold text-emids-tealsky leading-none">{d.getDate()}</p>
      <p className="mt-1.5 text-[10px] font-bold tracking-[0.2em] text-white/55 uppercase">
        {d.toLocaleDateString("en-US", { month: "short" })} · {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
      </p>
    </div>
  );
}

function CountdownChip({ target }) {
  const c = useCountdown(target);
  if (!c) return null;
  return (
    <div className="shrink-0 text-center bg-white/10 border border-white/15 backdrop-blur-xl rounded-3xl px-8 py-6 shadow-pop">
      <p className="text-[30px] font-extrabold text-emids-tealsky tracking-tight leading-none tabular-nums">
        {c.live ? "● LIVE" : c.label}
      </p>
      <p className="mt-2.5 text-[10px] font-bold tracking-[0.24em] text-white/55 uppercase">
        {c.live ? "Happening now" : "Starting"}
      </p>
    </div>
  );
}

const MIN_AUTOPLAY = 7;

/**
 * Auto-rotating global banner: company update first, then upcoming
 * company events and the latest bulletin. Arrows + dots, pauses on hover.
 */
export default function HeroSlider({ hero, comingEvents, bulletin, nextMeeting, onOpenSchedule, onReadBriefings }) {
  const slides = useMemo(() => {
    const s = [{
      kind: "hero",
      kicker: "Global Update",
      title: hero?.title,
      serif: hero?.location || hero?.category || "",
      text: hero?.description,
      chip: hero?.starts_at ? { startsAt: hero.starts_at } : null,
      cta: nextMeeting?.meeting_url
        ? { label: "Join Live Stream", href: nextMeeting.meeting_url, external: true, icon: Video }
        : null,
      alt: { label: "Full Schedule", onClick: onOpenSchedule },
    }];
    for (const e of (comingEvents || []).slice(0, 2)) {
      s.push({
        kind: "event",
        kicker: "Company Event",
        title: e.title,
        serif: e.location,
        text: e.description,
        chipText: `${new Date(e.start_datetime).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${new Date(e.start_datetime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
        cta: { label: "View in Schedule", onClick: onOpenSchedule, icon: null },
      });
    }
    if (bulletin) {
      s.push({
        kind: "bulletin",
        kicker: "Announcement",
        title: bulletin.title,
        serif: bulletin.category || "",
        text: bulletin.description,
        cta: { label: "Read all briefings", onClick: onReadBriefings, icon: null },
      });
    }
    return s;
  }, [hero, comingEvents, bulletin, nextMeeting, onOpenSchedule, onReadBriefings]);

  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    setIndex((i) => Math.min(i, slides.length - 1));
  }, [slides.length]);

  useEffect(() => {
    if (hovered) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), MIN_AUTOPLAY * 1000);
    return () => clearInterval(t);
  }, [hovered, slides.length]);

  function go(next) {
    setIndex((i) => (i + next + slides.length) % slides.length);
  }

  return (
    <div
      className="hero-surface rounded-[30px] relative overflow-hidden min-h-[400px] flex"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* decorative rings */}
      <div className="pointer-events-none absolute -right-24 -top-28 w-[380px] h-[380px]">
        <div className="absolute inset-0 rounded-full border border-emids-tealsky/15" />
        <div className="absolute inset-8 rounded-full border border-emids-tealsky/10" />
        <div className="absolute inset-16 rounded-full bg-emids-teal/10 blur-2xl" />
      </div>
      <div className="pointer-events-none absolute -left-16 -bottom-20 w-[260px] h-[260px]">
        <div className="absolute inset-0 rounded-full border border-emids-red/15" />
        <div className="absolute inset-10 rounded-full bg-emids-red/10 blur-3xl" />
      </div>

      {/* sliding track */}
      <div
        className="flex min-w-full h-full transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((s, i) => (
          <div key={i} className="min-w-full h-full flex" aria-hidden={i !== index}>
            <div className="px-10 lg:px-12 py-12 flex items-center gap-8 w-full">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-2 h-2 rounded-full bg-emids-teal animate-pulse" />
                  <span className="text-[11px] font-bold tracking-[0.22em] text-emids-tealsky uppercase">{s.kicker}</span>
                </div>

                <h2 className="text-[30px] xl:text-[38px] leading-[1.1] font-extrabold text-white tracking-tight max-w-[640px]">
                  {s.title}
                  {s.serif ? (
                    <span className="block font-serif italic font-semibold text-emids-tealsky text-[22px] xl:text-[26px] mt-2">
                      {s.serif}
                    </span>
                  ) : null}
                </h2>

                <p className="text-[14.5px] text-white/60 mt-4 max-w-[520px] leading-relaxed">{s.text}</p>

                <div className="flex items-center gap-3.5 mt-7">
                  {s.cta ? (
                    s.cta.href ? (
                      <a
                        href={s.cta.href}
                        target="_blank"
                        rel="noreferrer"
                        className="emids-gradient-red hover:brightness-110 text-white text-[14px] font-semibold px-7 py-3.5 rounded-2xl shadow-pop flex items-center gap-2.5 transition-all active:scale-[0.98]"
                      >
                        {s.cta.icon ? <s.cta.icon size={17} /> : null}
                        {s.cta.label}
                      </a>
                    ) : (
                      <button
                        onClick={s.cta.onClick}
                        className="emids-gradient-red hover:brightness-110 text-white text-[14px] font-semibold px-7 py-3.5 rounded-2xl shadow-pop flex items-center gap-2.5 transition-all active:scale-[0.98]"
                      >
                        {s.cta.icon ? <s.cta.icon size={17} /> : null}
                        {s.cta.label}
                      </button>
                    )
                  ) : null}
                  {s.alt ? (
                    <button
                      onClick={s.alt.onClick}
                      className="text-white/85 hover:text-white text-[14px] font-semibold px-7 py-3.5 rounded-2xl border border-white/20 hover:border-white/40 bg-white/5 backdrop-blur flex items-center gap-2 transition-all active:scale-[0.98]"
                    >
                      {s.alt.label}
                      <ArrowRight size={15} />
                    </button>
                  ) : null}
                </div>
              </div>

              {s.kind === "hero" ? (
                s.chip ? <CountdownChip target={s.chip.startsAt} /> : null
              ) : s.kind === "event" ? (
                <div className="shrink-0 text-center bg-white/10 border border-white/15 backdrop-blur-xl rounded-3xl px-8 py-6 shadow-pop">
                  <p className="text-[11px] font-bold tracking-[0.2em] text-emids-tealsky uppercase whitespace-nowrap">{s.chipText}</p>
                  <p className="mt-2 text-[10px] font-bold tracking-[0.24em] text-white/55 uppercase">Mark your calendar</p>
                </div>
              ) : (
                <DatePill startsAt={bulletin?.published_at} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* arrows */}
      <button
        onClick={() => go(-1)}
        title="Previous"
        className={`absolute left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl border border-white/15 bg-emids-ink/30 backdrop-blur flex items-center justify-center text-white/70 hover:text-white hover:border-white/40 transition-all transition-opacity ${hovered ? "opacity-100" : "opacity-60"}`}
      >
        <ChevronLeft size={19} />
      </button>
      <button
        onClick={() => go(1)}
        title="Next"
        className={`absolute right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl border border-white/15 bg-emids-ink/30 backdrop-blur flex items-center justify-center text-white/70 hover:text-white hover:border-white/40 transition-all ${hovered ? "opacity-100" : "opacity-60"}`}
      >
        <ChevronRight size={19} />
      </button>

      {/* dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            title={`Slide ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index ? "w-7 bg-emids-tealsky" : "w-2 bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
