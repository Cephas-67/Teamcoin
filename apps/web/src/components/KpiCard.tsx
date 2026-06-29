import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

type Props = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendColor?: "up" | "down" | "muted";
  to?: string;
};

export function KpiCard({ label, value, icon: Icon, trend, trendColor = "muted", to }: Props) {
  const trendCls =
    trendColor === "up" ? "text-accent" : trendColor === "down" ? "text-danger" : "text-muted";

  const inner = (
    <>
      <div className="flex justify-between items-start mb-3">
        <span className="text-sm text-muted">{label}</span>
        <span className="inline-flex items-center justify-center w-9 h-9 border border-border rounded-md text-muted">
          <Icon className="w-4 h-4" strokeWidth={2} />
        </span>
      </div>
      <div className="text-3xl font-bold tracking-tight leading-none mb-1">{value}</div>
      {trend && <div className={`text-sm ${trendCls}`}>{trend}</div>}
    </>
  );

  const baseCls =
    "block bg-surface border border-border rounded-xl p-5 h-full transition-colors";

  if (to) {
    return (
      <Link to={to} className={`${baseCls} hover:border-accent hover:-translate-y-0.5`}>
        {inner}
      </Link>
    );
  }

  return <div className={`${baseCls} hover:border-border-strong`}>{inner}</div>;
}
