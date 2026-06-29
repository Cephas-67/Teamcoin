import type { LucideIcon } from "lucide-react";

type Props = {
  icon?: LucideIcon;
  children: React.ReactNode;
};

export function Eyebrow({ icon: Icon, children }: Props) {
  return (
    <span className="eyebrow">
      {Icon && <Icon className="w-3.5 h-3.5 text-accent" strokeWidth={2.2} />}
      <span>{children}</span>
    </span>
  );
}
