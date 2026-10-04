import { ChevronDown, EyeOff } from "lucide-react";

/**
 * Card with a collapsible body. Privacy mode globally collapses it and swaps
 * content for a "hidden" placeholder instead of raw personal data.
 */
export default function CollapsibleCard({
  title,
  subtitle,
  icon,
  headerRight,
  collapsed: collapsedProp,
  onToggle,
  privacyOn = false,
  children,
  className = "",
}) {
  const collapsed = privacyOn || collapsedProp;

  return (
    <section className={`bg-emids-paper border border-emids-line rounded-[26px] shadow-card flex flex-col ${className}`}>
      <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h2 className="card-title">{title}</h2>
            {headerRight}
          </div>
          {subtitle ? <p className="card-sub mt-1">{subtitle}</p> : null}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {icon}

          <button
            onClick={onToggle}
            title={collapsed ? "Expand" : "Collapse for privacy"}
            disabled={privacyOn}
            className={`w-7 h-7 -mr-1 -mt-1 rounded-lg flex items-center justify-center transition-all
              ${privacyOn ? "opacity-30 cursor-not-allowed" : "hover:bg-emids-mist text-emids-navy/45 hover:text-emids-navy"}`}
          >
            <ChevronDown
              size={18}
              className={`transition-transform duration-300 ${collapsed ? "-rotate-90" : ""}`}
            />
          </button>
        </div>
      </header>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out pb-2`}
        style={{ gridTemplateRows: collapsed ? "0fr" : "1fr" }}
      >
        <div className="overflow-hidden min-h-0">
          <div className="px-6 pb-5">
            {privacyOn ? (
              <div className="flex flex-col items-center justify-center py-10 text-center rounded-2xl bg-emids-mist/70 border border-dashed border-emids-line">
                <EyeOff size={22} className="text-emids-navy/30 mb-2.5" />
                <p className="text-[13px] font-semibold text-emids-navy/50">Personal info hidden</p>
                <p className="text-[11.5px] text-emids-navy/35 mt-1 max-w-[200px]">
                  Privacy mode is on — turn it off from the top bar to see this card.
                </p>
              </div>
              ) : (
                children
              )}
          </div>
        </div>
      </div>
    </section>
  );
}
