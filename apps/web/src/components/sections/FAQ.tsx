import { useState } from "react";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { faqs } from "../../data/faq";
import { cn } from "../../lib/cn";

// Section FAQ · titre à gauche (sticky sur desktop), accordéon à droite.
// Plus → croix par rotation 45°, contenu révélé via height auto animé.
export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="relative bg-bg py-20 sm:py-28 lg:py-36">
      <div className="container">
        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          <div className="md:sticky md:top-24 md:self-start">
            <h2 className="font-display font-normal text-text text-[clamp(2.25rem,4.8vw,3.75rem)] leading-[1.05] tracking-[-0.025em]">
              Questions fréquentes.
            </h2>
            <p className="mt-4 text-muted text-base leading-relaxed max-w-md">
              Tout ce qu'il faut savoir avant d'utiliser KandoFoncier pour sceller votre première vente.
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {faqs.map((item, i) => {
              const open = openIdx === i;
              return (
                <li
                  key={item.q}
                  className={cn(
                    "overflow-hidden rounded-2xl border border-text/10",
                    "bg-text/[0.02] transition-colors",
                    open && "border-text/20 bg-text/[0.04]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIdx(open ? null : i)}
                    aria-expanded={open ? "true" : "false"}
                    className="flex w-full items-center justify-between gap-6 px-5 py-4 text-left sm:px-6 sm:py-5"
                  >
                    <span className="text-[15px] font-medium text-text sm:text-base">
                      {item.q}
                    </span>
                    <motion.span
                      animate={{ rotate: open ? 45 : 0 }}
                      transition={{ type: "spring", stiffness: 320, damping: 24 }}
                      className="grid size-7 shrink-0 place-items-center rounded-full text-text"
                    >
                      <Plus className="size-5" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          height: { duration: 0.32, ease: [0.4, 0, 0.2, 1] },
                          opacity: { duration: 0.2 },
                        }}
                      >
                        <p className="px-5 pb-5 pr-12 text-[14px] leading-relaxed text-muted sm:px-6 sm:pb-6 sm:pr-16 sm:text-[15px]">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
