import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus2,
  ShieldCheck,
  Compass,
  Settings2,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../lib/cn";

type Item = { to: string; label: string; icon: LucideIcon };
type Section = { title: string; items: Item[] };

const sections: Section[] = [
  {
    title: "Pilotage",
    items: [{ to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard }],
  },
  {
    title: "Notarisation",
    items: [
      { to: "/notariser", label: "Notariser un acte", icon: FilePlus2 },
      { to: "/verifier", label: "Vérifier un document", icon: ShieldCheck },
    ],
  },
  {
    title: "Public",
    items: [{ to: "/explorer", label: "Explorer foncier", icon: Compass }],
  },
];

const systemItems: Item[] = [
  { to: "/parametres", label: "Paramètres", icon: Settings2 },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: Props) {
  return (
    <aside
      className={cn(
        "fixed lg:sticky top-16 z-50 lg:z-0",
        "w-64 lg:w-60 h-[calc(100vh-4rem)] overflow-y-auto",
        "bg-bg border-r border-border px-3 py-4",
        "transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
    >
      {sections.map((section) => (
        <div key={section.title} className="mb-4">
          <div className="px-3 py-2 text-[0.7rem] tracking-widest uppercase text-muted font-medium">
            {section.title}
          </div>
          <ul>
            {section.items.map((item) => (
              <SidebarLink key={item.to} {...item} onClose={onClose} />
            ))}
          </ul>
        </div>
      ))}

      <div className="mt-auto pt-3 border-t border-border">
        <div className="px-3 py-2 text-[0.7rem] tracking-widest uppercase text-muted font-medium">
          Système
        </div>
        <ul>
          {systemItems.map((item) => (
            <SidebarLink key={item.to} {...item} onClose={onClose} />
          ))}
          <li>
            <NavLink
              to="/"
              onClick={onClose}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium text-muted hover:bg-surface-2 hover:text-text transition-colors"
            >
              <LogOut className="w-4 h-4" strokeWidth={2} />
              <span>Quitter l'app</span>
            </NavLink>
          </li>
        </ul>
      </div>
    </aside>
  );
}

function SidebarLink({ to, label, icon: Icon, onClose }: Item & { onClose: () => void }) {
  return (
    <li>
      <NavLink
        to={to}
        onClick={onClose}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
            isActive
              ? "bg-surface-2 text-text"
              : "text-muted hover:bg-surface-2 hover:text-text",
          )
        }
      >
        <Icon className="w-4 h-4" strokeWidth={2} />
        <span>{label}</span>
      </NavLink>
    </li>
  );
}
