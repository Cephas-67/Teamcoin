import { Bitcoin, Clock, FileText, FileWarning, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Status chips for the gandehou charte.
 *
 * Covers the two status columns from the schema (p.14) plus a "nouveau"
 * priority badge for dashboards:
 *   - dossiers.statut    : brouillon | atteste_cq | valide_mairie
 *   - documents.ots_status: pending | confirmed | mismatch
 *
 * Charte colours (p.12): green = officiel/authentique, yellow = provisoire/
 * en attente, red = falsifié/litige. Yellow text is darkened for legibility
 * on the light "paper" background — #FCD20F on paper would fail contrast.
 */
export type ChipStatus =
  | 'brouillon'
  | 'soumis'
  | 'atteste_cq'
  | 'valide_mairie'
  | 'ots_pending'
  | 'ots_confirmed'
  | 'ots_mismatch'
  | 'nouveau'

type Tone = 'green' | 'yellow' | 'red' | 'neutral'

const TONE: Record<Tone, string> = {
  green:
    'bg-gandehou-green/10 text-gandehou-green ring-gandehou-green/20 dark:bg-gandehou-green/15 dark:text-gandehou-green',
  yellow:
    'bg-gandehou-yellow/20 text-amber-900 ring-gandehou-yellow/40 dark:bg-gandehou-yellow/15 dark:text-gandehou-yellow',
  red: 'bg-gandehou-red/10 text-gandehou-red ring-gandehou-red/25 dark:bg-gandehou-red/15',
  neutral: 'bg-black/[0.06] text-black/60 ring-black/10 dark:bg-white/10 dark:text-white/60 dark:ring-white/10',
}

const CONFIG: Record<ChipStatus, { label: string; tone: Tone; icon: typeof FileText }> = {
  brouillon: { label: 'Brouillon', tone: 'neutral', icon: FileText },
  soumis: { label: 'Soumis · en attente CQ', tone: 'yellow', icon: Clock },
  atteste_cq: { label: 'Attesté CQ · provisoire', tone: 'yellow', icon: FileWarning },
  valide_mairie: { label: 'Validé Mairie', tone: 'green', icon: ShieldCheck },
  ots_pending: { label: 'Ancrage en attente', tone: 'yellow', icon: Clock },
  ots_confirmed: { label: 'Ancré sur Bitcoin', tone: 'green', icon: Bitcoin },
  ots_mismatch: { label: 'Altéré', tone: 'red', icon: ShieldAlert },
  nouveau: { label: 'Nouveau', tone: 'green', icon: Sparkles },
}

export function StatusChip({
  status,
  label,
  className,
}: {
  status: ChipStatus
  /** Override the default copy (e.g. a shorter label on mobile). */
  label?: string
  className?: string
}) {
  const { label: defaultLabel, tone, icon: Icon } = CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        TONE[tone],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {label ?? defaultLabel}
    </span>
  )
}