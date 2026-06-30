import {
  Children,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Step({ children }: { children: ReactNode }) {
  return <div className="px-1">{children}</div>
}

type StepperProps = {
  children: ReactNode
  currentStep: number
  labels?: string[]
  onStepClick?: (step: number) => void
  onBack?: () => void
  onNext?: () => void
  onComplete?: () => void
  canGoToStep?: (target: number) => boolean
  isSubmitting?: boolean
  backLabel?: string
  nextLabel?: string
  completeLabel?: string
}

export default function Stepper({
  children,
  currentStep,
  labels,
  onStepClick,
  onBack,
  onNext,
  onComplete,
  canGoToStep = (target) => target <= currentStep,
  isSubmitting = false,
  backLabel = 'Précédent',
  nextLabel = 'Suivant',
  completeLabel = 'Soumettre',
}: StepperProps) {
  const steps = Children.toArray(children)
  const total = steps.length
  const isLast = currentStep === total

  const prev = useRef(currentStep)
  const direction = currentStep >= prev.current ? 1 : -1
  useEffect(() => {
    prev.current = currentStep
  }, [currentStep])

  return (
    <div className="mx-auto w-full max-w-xl">
      <p aria-live="polite" className="sr-only">
        Étape {currentStep} sur {total}
        {labels?.[currentStep - 1] ? ` : ${labels[currentStep - 1]}` : ''}
      </p>

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03] md:p-8">
        <ol className="mb-8 flex w-full items-center">
          {steps.map((_, i) => {
            const step = i + 1
            const status =
              step < currentStep ? 'complete' : step === currentStep ? 'active' : 'upcoming'
            const reachable = canGoToStep(step)
            const label = labels?.[i] ? `Étape ${step} : ${labels[i]}` : `Étape ${step}`
            return (
              <li key={step} className={cn('flex items-center', i < total - 1 && 'flex-1')}>
                <button
                  type="button"
                  disabled={!reachable || step === currentStep}
                  aria-current={status === 'active' ? 'step' : undefined}
                  aria-label={label}
                  onClick={() => onStepClick?.(step)}
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold outline-none transition-colors',
                    'focus-visible:ring-4 focus-visible:ring-gandehou-green/30',
                    status === 'complete' && 'bg-gandehou-green text-white',
                    status === 'active' &&
                      'bg-gandehou-green/15 text-gandehou-green ring-2 ring-gandehou-green',
                    status === 'upcoming' &&
                      'bg-black/5 text-black/40 dark:bg-white/10 dark:text-white/40',
                    reachable && step !== currentStep && 'cursor-pointer',
                  )}
                >
                  {status === 'complete' ? <Check className="h-4 w-4" /> : step}
                </button>

                {i < total - 1 && (
                  <div className="mx-2 h-0.5 flex-1 overflow-hidden rounded bg-black/10 dark:bg-white/10">
                    <motion.div
                      className="h-full bg-gandehou-green"
                      initial={false}
                      animate={{ width: step < currentStep ? '100%' : '0%' }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                )}
              </li>
            )
          })}
        </ol>

        <StepContent currentStep={currentStep} direction={direction}>
          {steps[currentStep - 1]}
        </StepContent>

        <div className={cn('mt-8 flex items-center', currentStep === 1 ? 'justify-end' : 'justify-between')}>
          {currentStep !== 1 && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl px-4 py-2.5 font-medium text-black/60 outline-none transition-colors hover:text-black focus-visible:ring-4 focus-visible:ring-gandehou-green/30 dark:text-white/60 dark:hover:text-white"
            >
              {backLabel}
            </button>
          )}
          <button
            type="button"
            onClick={isLast ? onComplete : onNext}
            disabled={isSubmitting}
            className="rounded-2xl bg-gandehou-green px-6 py-2.5 font-medium text-white outline-none transition-colors hover:bg-gandehou-green/90 focus-visible:ring-4 focus-visible:ring-gandehou-green/40 disabled:opacity-60"
          >
            {isLast ? (isSubmitting ? 'Envoi…' : completeLabel) : nextLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function StepContent({
  currentStep,
  direction,
  children,
}: {
  currentStep: number
  direction: number
  children: ReactNode
}) {
  const reduce = useReducedMotion()
  const [height, setHeight] = useState<number>(0)

  if (reduce) return <div className="px-1">{children}</div>

  return (
    <motion.div
      style={{ position: 'relative', overflow: 'hidden' }}
      animate={{ height }}
      transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
    >
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        <Slide key={currentStep} direction={direction} onHeight={setHeight}>
          {children}
        </Slide>
      </AnimatePresence>
    </motion.div>
  )
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir >= 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: '0%', opacity: 1 },
  exit: (dir: number) => ({ x: dir >= 0 ? '-50%' : '50%', opacity: 0 }),
}

function Slide({
  children,
  direction,
  onHeight,
}: {
  children: ReactNode
  direction: number
  onHeight: (h: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (ref.current) onHeight(ref.current.offsetHeight)
  }, [children, onHeight])

  return (
    <motion.div
      ref={ref}
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: 'absolute', left: 0, right: 0, top: 0 }}
      className="px-1"
    >
      {children}
    </motion.div>
  )
}