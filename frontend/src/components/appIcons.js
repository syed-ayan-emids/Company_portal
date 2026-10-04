import { Clock, FolderClosed, Mail, MessagesSquare, Sparkles, UsersRound } from "lucide-react";

export const APP_ICONS = {
  mail: { icon: Mail, tint: "text-sky-500", bg: "bg-sky-50" },
  teams: { icon: MessagesSquare, tint: "text-indigo-500", bg: "bg-indigo-50" },
  folder: { icon: FolderClosed, tint: "text-emids-tealdeep", bg: "bg-emids-tealsoft" },
  users: { icon: UsersRound, tint: "text-violet-500", bg: "bg-violet-50" },
  sparkles: { icon: Sparkles, tint: "text-emids-red", bg: "bg-red-50" },
  clock: { icon: Clock, tint: "text-amber-600", bg: "bg-amber-50" },
  default: { icon: Mail, tint: "text-emids-navy", bg: "bg-emids-mist" },
};

export function appMeta(iconName) {
  return APP_ICONS[iconName] || APP_ICONS.default;
}
