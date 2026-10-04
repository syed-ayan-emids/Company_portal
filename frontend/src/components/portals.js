import { BookOpen, Boxes, Clock, HandHeart, LifeBuoy, UserPlus } from "lucide-react";

/**
 * Company portals surfaced from the left sidebar's "More" menu.
 * Single entry "click" behaviour:
 *   - action: "projects"  -> opens the Projects module (real data)
 *   - no url defined      -> fires the "link pending" toast
 *   - url set             -> opens the target
 */
export const PORTALS = [
  { slug: "projects", name: "Projects", icon: Boxes, tint: "text-emids-tealdeep", bg: "bg-emids-tealsoft", action: "projects" },
  { slug: "timesheets", name: "Timesheets", icon: Clock, tint: "text-amber-600", bg: "bg-amber-50" },
  { slug: "ray", name: "Refer Another You (RAY)", icon: UserPlus, tint: "text-violet-500", bg: "bg-violet-50" },
  { slug: "lnd", name: "Learning & Development", icon: BookOpen, tint: "text-sky-500", bg: "bg-sky-50" },
  { slug: "wellness", name: "Wellness Hub", icon: HandHeart, tint: "text-rose-500", bg: "bg-rose-50" },
  { slug: "support", name: "Support Hub", icon: LifeBuoy, tint: "text-emids-red", bg: "bg-red-50" },
];
