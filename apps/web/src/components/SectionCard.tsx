import { type ReactNode } from "react";
import bg from "../assets/images/bg.svg";

// Wrapper qui applique le pattern visuel du Hero a une section quelconque :
// container arrondi w-[98vw] avec le motif decoratif `bg.svg` en fond a faible
// opacite. Garde la structure semantique <section> avec id/className passes.
//
// A noter : pas de scale au scroll ici (cf. Hero), pour eviter le cout perf
// d'un useTransform sur N sections. Le visuel reste coherent grace au meme
// rounded-[30px] et au meme fond.

type Props = {
  id?: string;
  className?: string;
  innerClassName?: string;
  children: ReactNode;
};

export function SectionCard({ id, className = "", innerClassName = "", children }: Props) {
  return (
    <section
      id={id}
      className={`relative flex flex-col items-center justify-center w-full transition-colors duration-500 dark:text-white text-black py-4 sm:py-6 ${className}`}
    >
      <div className="relative w-[98vw] rounded-[24px] sm:rounded-[30px] bg-surface/40 dark:bg-black/20">
        {/* Motif decoratif clippe au rounded · couche separee */}
        <div className="absolute inset-0 rounded-[24px] sm:rounded-[30px] overflow-hidden pointer-events-none">
          <div
            aria-hidden
            style={{ backgroundImage: `url('${bg}')` }}
            className="bg-contain bg-bottom bg-no-repeat w-full h-full opacity-10 dark:opacity-20 absolute inset-0"
          />
        </div>
        {/* Contenu · sans overflow-hidden pour preserver sticky / scroll local */}
        <div className={`relative z-10 ${innerClassName}`}>{children}</div>
      </div>
    </section>
  );
}
