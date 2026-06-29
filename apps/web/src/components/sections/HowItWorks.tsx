import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Silk } from "../backgrounds/Silk";
import { useInViewport } from "../../hooks/useInViewport";
import { howSteps, type HowStep } from "../../data/howSteps";

// HowItWorks · port adapté à KandoFoncier.
// Desktop : sticky-scroll dans une carte arrondie avec Silk en fond.
// Mobile  : stack vertical simple.

function StepRow({
  step,
  index,
  total,
  progress,
}: {
  step: HowStep;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const center = total <= 1 ? 0.5 : index / (total - 1);
  const w = 0.5 / Math.max(1, total - 1);

  let input: number[];
  let output: number[];
  if (index === 0) {
    input = [0, w, 2 * w];
    output = [1, 1, 0.4];
  } else if (index === total - 1) {
    input = [1 - 2 * w, 1 - w, 1];
    output = [0.4, 1, 1];
  } else {
    input = [center - w, center, center + w];
    output = [0.4, 1, 0.4];
  }

  const opacity = useTransform(progress, input, output, { clamp: true });

  return (
    <motion.li
      style={{ opacity, willChange: "opacity" }}
      className="flex items-center gap-2 text-white"
    >
      <span className="font-display text-[1.25rem]">{step.n}</span>
      <span className="font-display text-[1.25rem]">{step.label}</span>
    </motion.li>
  );
}

function StepIllustration({ step }: { step: HowStep }) {
  const Icon = step.icon;
  return (
    <div
      className={`relative aspect-[1.6/1] w-full overflow-hidden rounded-2xl ring-1 ring-white/15 shadow-2xl bg-gradient-to-br ${step.tone}`}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        <Icon className="w-16 h-16 text-white/90 mb-4" strokeWidth={1.4} />
        <p className="text-white/85 text-sm max-w-xs leading-relaxed">
          {step.description}
        </p>
      </div>
      <span className="absolute top-4 left-5 font-display text-white/60 text-sm tabular-nums">
        {step.n}
      </span>
    </div>
  );
}

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { ref: viewRef, inView } = useInViewport<HTMLDivElement>("400px", { once: true });
  const { ref: visRef, inView: visible } = useInViewport<HTMLDivElement>("0px");

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // 5 steps · gap-[18rem] entre chaque illustration → 4 gaps × 18rem = 72rem
  // + 4 illustrations supplémentaires à scroller (chacune ≈ 22.5rem en aspect 1.6/1 sur 36rem max).
  // Valeur translatée empirique alignée sur la durée du sticky (500vh).
  const imgY = useTransform(scrollYProgress, [0, 1], ["0rem", "-162rem"]);
  const lineFill = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="how" ref={viewRef} className="relative bg-bg">
      {/* DESKTOP — sticky-scroll */}
      <div ref={ref} className="relative hidden h-[500vh] md:block">
        <div
          ref={visRef}
          className="sticky top-0 flex h-screen items-center px-3 py-3 sm:px-4 sm:py-4"
        >
          <div className="relative h-full w-full overflow-hidden rounded-3xl bg-[#3a3540] [contain:layout_paint] [transform:translateZ(0)]">
            <div aria-hidden className="absolute inset-0 z-0">
              {inView && (
                <Silk
                  speed={2}
                  scale={1}
                  color="#7B7481"
                  noiseIntensity={0.8}
                  rotation={0}
                  paused={!visible}
                />
              )}
            </div>

            <div aria-hidden className="absolute inset-0 z-[1] bg-black/15" />

            <div className="relative z-[2] grid h-full grid-cols-2 items-center">
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-[80%] w-px -translate-x-1/2 -translate-y-1/2"
              >
                <div className="absolute inset-0 bg-white/15" />
                <motion.div
                  style={{ height: lineFill, willChange: "height" }}
                  className="absolute inset-x-0 top-0 bg-gradient-to-b from-transparent via-accent to-warn"
                />
              </div>

              <div className="relative flex h-full items-center justify-center px-[10%]">
                <div className="relative w-full max-w-[29rem]">
                  <h2 className="absolute -top-20 left-0 font-display text-[clamp(2rem,3.5vw,3rem)] font-normal leading-[1.15] tracking-[-0.02em] text-white">
                    Comment ça marche ?
                  </h2>

                  <ol className="flex flex-col gap-[1.7rem] pt-4">
                    {howSteps.map((s, i) => (
                      <StepRow
                        key={s.n}
                        step={s}
                        index={i}
                        total={howSteps.length}
                        progress={scrollYProgress}
                      />
                    ))}
                  </ol>
                </div>
              </div>

              <div className="relative flex h-full items-center justify-center overflow-hidden px-[5%]">
                <div className="relative aspect-[1.6/1] w-full max-w-[36rem] overflow-hidden">
                  <motion.div
                    style={{ y: imgY, willChange: "transform" }}
                    className="flex flex-col gap-[18rem]"
                  >
                    {howSteps.map((s) => (
                      <StepIllustration key={s.n} step={s} />
                    ))}
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE — stack */}
      <div className="md:hidden px-4 py-20 sm:px-6 sm:py-28">
        <h2 className="font-display text-[clamp(1.75rem,7vw,2.5rem)] font-normal leading-[1.15] tracking-[-0.02em] text-text">
          Comment ça marche ?
        </h2>

        <ol className="mt-12 flex flex-col gap-10 sm:gap-12">
          {howSteps.map((s) => (
            <li key={s.n} className="flex flex-col gap-4">
              <StepIllustration step={s} />
              <div className="flex items-center gap-2">
                <span className="font-display text-[1.25rem] text-text">{s.n}</span>
                <span className="font-display text-[1.25rem] text-text">{s.label}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
