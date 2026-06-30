import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

// Wrapper qui anime l'apparition de son enfant des qu'il entre dans le
// viewport. `once: true` -> joue une seule fois (pas de replay au scroll).
// `amount: 0.2` -> declenche des que 20% est visible.

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
  as?: "div" | "section" | "h1" | "h2" | "h3" | "p" | "li";
};

export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  duration = 0.6,
  as = "div",
}: Props) {
  const variants: Variants = {
    hidden: { opacity: 0, y },
    visible: { opacity: 1, y: 0, transition: { duration, delay, ease: [0.22, 1, 0.36, 1] } },
  };
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={variants}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

// Variante pour orchestrer plusieurs enfants en stagger.
// Usage :
//   <RevealGroup>
//     <Reveal>item 1</Reveal>
//     <Reveal>item 2</Reveal>
//   </RevealGroup>
// Plus simple : passer juste `delay` croissant a chaque Reveal directement.
export function RevealStagger({
  children,
  className,
  staggerDelay = 0.08,
}: {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <>
      {children.map((child, i) => (
        <Reveal key={i} delay={i * staggerDelay} className={className}>
          {child}
        </Reveal>
      ))}
    </>
  );
}
