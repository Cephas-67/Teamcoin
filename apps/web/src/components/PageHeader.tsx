import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Eyebrow } from "./Eyebrow";

type Props = {
  eyebrowIcon?: LucideIcon;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ eyebrowIcon, eyebrow, title, subtitle, actions }: Props) {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 pb-5 mb-7 border-b border-border">
      <div>
        {eyebrow && (
          <div className="mb-2">
            <Eyebrow icon={eyebrowIcon}>{eyebrow}</Eyebrow>
          </div>
        )}
        <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
        {subtitle && <p className="text-muted text-sm mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
