import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Video } from "lucide-react";
import { fmtTime } from "../api.js";
import CollapsibleCard from "./CollapsibleCard.jsx";

const WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarCard({ calendarEvents, nextMeeting, collapsed, onToggle, privacyOn }) {
  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);

  const cursor = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    return d;
  }, [monthOffset]);

  const grid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const startCol = (first.getDay() + 6) % 7; // Monday-first
    const cells = [];
    for (let i = 0; i < startCol; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    return cells;
  }, [cursor]);

  const daysWithEvents = useMemo(() => {
    const map = new Map();
    for (const ev of calendarEvents || []) {
      const d = new Date(ev.start_datetime);
      if (d.getMonth() === cursor.getMonth() && d.getFullYear() === cursor.getFullYear()) {
        const key = d.getDate();
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
    return map;
  }, [calendarEvents, cursor]);

  const isSameDay = (a, b) => a && b && a.toDateString() === b.toDateString();

  const selectedEvents = selectedDay
    ? (calendarEvents || []).filter((ev) => {
        const d = new Date(ev.start_datetime);
        return d.getDate() === selectedDay.getDate() && d.getMonth() === selectedDay.getMonth();
      })
    : [];

  const visibleEvent = selectedDay ? selectedEvents : null;
  const nextUp = selectedEvents?.length ? selectedEvents : nextMeeting ? [{ title: nextMeeting.title, start_datetime: nextMeeting.start_datetime, platform: nextMeeting.platform, meeting_url: nextMeeting.meeting_url }] : [];

  return (
    <CollapsibleCard
      title="Calendar"
      subtitle={`${cursor.toLocaleDateString("en-US", { month: "long" })} ${cursor.getFullYear()}`}
      collapsed={collapsed}
      onToggle={onToggle}
      privacyOn={privacyOn}
      headerRight={
        <div className="flex gap-1 -mt-0.5">
          <button
            onClick={() => setMonthOffset((o) => o - 1)}
            className="w-7 h-7 rounded-lg hover:bg-emids-mist flex items-center justify-center text-emids-navy/50"
            title="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setMonthOffset((o) => o + 1)}
            className="w-7 h-7 rounded-lg hover:bg-emids-mist flex items-center justify-center text-emids-navy/50"
            title="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-7 gap-y-1.5 text-center mb-1">
        {WD.map((d) => (
          <span key={d} className="text-[10px] font-bold tracking-wider uppercase text-emids-navy/35">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1.5 text-center">
        {grid.map((day, i) => {
          if (!day) return <span key={`pad-${i}`} />;
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDay);
          const hasEvents = daysWithEvents.get(day.getDate()) || 0;
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className={`relative mx-auto w-8 h-8 rounded-full text-[12.5px] font-semibold transition-all
                ${isToday ? "emids-gradient-red text-white shadow-pop" : isSelected ? "bg-emids-tealsoft text-emids-tealdeep" : "text-emids-navy/75 hover:bg-emids-mist"}`}
            >
              {day.getDate()}
              {hasEvents && !isToday ? (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emids-tealdeep" />
              ) : null}
            </button>
          );
        })}
      </div>

      {privacyOn ? null : (
        <div className="mt-4 pt-4 border-t border-emids-line/70">
          <div className="bg-emids-mist/70 border border-emids-line/60 rounded-2xl px-4 py-3.5 flex items-center gap-3.5">
            <span className="w-10 h-10 rounded-xl bg-emids-tealsoft flex items-center justify-center shrink-0">
              <Video size={18} className="text-emids-tealdeep" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-emids-navy truncate">
                {nextUp.length ? nextUp[0].title : "No events scheduled"}
              </p>
              <p className="text-[12px] text-emids-navy/50 mt-0.5">
                {nextUp.length
                  ? selectedDay
                    ? `${new Date(nextUp[0].start_datetime).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · ${fmtTime(nextUp[0].start_datetime)}`
                    : `${fmtTime(nextUp[0].start_datetime)} · ${nextUp[0].platform || "Teams Meeting"}`
                  : ""}
              </p>
            </div>
            {nextUp[0]?.meeting_url ? (
              <a
                href={nextUp[0].meeting_url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold tracking-widest text-emids-tealdeep hover:text-emids-red uppercase transition-colors"
              >
                Join
              </a>
            ) : null}
          </div>
          {visibleEvent && visibleEvent.length > 1 ? (
            <p className="text-[11.5px] text-emids-navy/45 mt-2 pl-1">
              + {visibleEvent.length - 1} more on this day
            </p>
          ) : null}
        </div>
      )}
    </CollapsibleCard>
  );
}
