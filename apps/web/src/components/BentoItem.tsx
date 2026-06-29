import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  span?: 4 | 6 | 8 | 12;
  className?: string;
};

const spanMap: Record<NonNullable<Props["span"]>, string> = {
  4: "md:col-span-4",
  6: "md:col-span-6",
  8: "md:col-span-8",
  12: "md:col-span-12",
};

export function BentoItem({ icon: Icon, title, description, span = 6, className }: Props) {
  return (
    <div
      className={cn(
        "col-span-12",
        spanMap[span],
        "bg-surface border border-border rounded-xl p-6 transition-colors hover:border-border-strong",
        className,
      )}
    >
      <span className="inline-flex items-center justify-center w-10 h-10 border border-border rounded-md mb-4 text-accent">
        <Icon className="w-5 h-5" strokeWidth={2} />
      </span>
      <h3 className="text-base font-semibold mb-1.5">{title}</h3>
      <p className="text-muted text-sm leading-relaxed">{description}</p>
    </div>
  );
}
