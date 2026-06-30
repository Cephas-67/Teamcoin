import React, { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { ThemeToggle } from "./ThemeToggle";
import { LinkButton } from "./Button";

// interface HeroNavProps {
//     tabs: string[];
//     defaultIndex?: number;
//     onChange?: (index: number) => void;
// }

// interface CursorPosition {
//     left: number;
//     width: number;
//     opacity: number;
// }

// // ── Cursor ───────────────────────────────────────────────────────────────────
// function Cursor({ position }: { position: CursorPosition }) {
//     return (
//         <motion.li
//             animate={{ ...position }}
//             transition={{ type: "spring", stiffness: 400, damping: 30 }}
//             className="absolute z-0 h-8 md:h-10 rounded-full bg-black"
//             aria-hidden
//         />
//     );
// }

// // ── Tab ──────────────────────────────────────────────────────────────────────
// interface TabProps {
//     children: React.ReactNode;
//     setPosition: (pos: CursorPosition) => void;
//     onClick: () => void;
// }

// const Tab = React.forwardRef<HTMLLIElement, TabProps>(
//     ({ children, setPosition, onClick }, ref) => {
//         return (
//             <li
//                 ref={ref}
//                 onClick={onClick}
//                 onMouseEnter={() => {
//                     const el = (ref as React.RefObject<HTMLLIElement>).current;
//                     if (!el) return;
//                     const { width } = el.getBoundingClientRect();
//                     setPosition({ left: el.offsetLeft, width, opacity: 1 });
//                 }}
//                 className="relative z-10 cursor-pointer px-4 py-2 md:px-6 md:py-2.5
//                    text-xs md:text-sm font-semibold uppercase tracking-wider
//                    text-white mix-blend-difference select-none"
//                 style={{ fontFamily: "Montserrat, sans-serif" }}
//             >
//                 {children}
//             </li>
//         );
//     }
// );
// Tab.displayName = "Tab";

// // ── SlideTabs ────────────────────────────────────────────────────────────────
// export default function HeroNav({
//     tabs,
//     defaultIndex = 0,
//     onChange,
// }: HeroNavProps) {
//     const [position, setPosition] = useState<CursorPosition>({
//         left: 0,
//         width: 0,
//         opacity: 0,
//     });
//     const [selected, setSelected] = useState(defaultIndex);
//     const tabsRef = useRef<(HTMLLIElement | null)[]>([]);

//     // Initialise cursor on mount + whenever selected changes
//     useEffect(() => {
//         const el = tabsRef.current[selected];
//         if (!el) return;
//         const { width } = el.getBoundingClientRect();
//         setPosition({ left: el.offsetLeft, width, opacity: 1 });
//     }, [selected]);

//     const handleSelect = (i: number) => {
//         setSelected(i);
//         onChange?.(i);
//     };

//     const resetToSelected = () => {
//         const el = tabsRef.current[selected];
//         if (!el) return;
//         const { width } = el.getBoundingClientRect();
//         setPosition({ left: el.offsetLeft, width, opacity: 1 });
//     };

//     return (
//         <div>
//             <ul
//                 onMouseLeave={resetToSelected}
//                 className="flex items-center rounded-full
//                  border-2 border-black/10 dark:border-white/10 p-1 w-fit mx-auto backdrop-blur-lg"
//             >
//                 {tabs.map((tab, i) => (
//                     <Tab
//                         key={tab}
//                         ref={(el) => { tabsRef.current[i] = el; }}
//                         setPosition={setPosition}
//                         onClick={() => handleSelect(i)}
//                     >
//                         {tab}
//                     </Tab>
//                 ))}
//                 <Cursor position={position} />
//                 <nav className="ml-auto hidden md:flex items-center gap-6 text-sm text-muted">
//                     <a href="#fonctionnalites" className="hover:text-text transition-colors">Fonctionnalités</a>
//                     <a href="#how" className="hover:text-text transition-colors">Comment ça marche</a>
//                     <a href="#faq" className="hover:text-text transition-colors">FAQ</a>
//                 </nav>

//             </ul>
//             <div className="ml-auto md:ml-3 flex items-center gap-2">

//             </div>
//         </div>
//     );
// }

import { Moon, Sun, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface HeroNavProps {
    isDark: boolean;
    onToggleDark: () => void;
}

export default function HeroNav() {
    return (
        <div className="z-40 fixed top-0 left-0 p-6 md:p-10 flex flex-row items-center justify-between w-full">

            {/* ── Logo ─────────────────────────────────────────────────────────── */}
            <h2
                className="font-semibold text-[24px] transition-colors duration-300 dark:text-white text-black"
            >
                KandoFoncier
            </h2>

            {/* ── Nav links ────────────────────────────────────────────────────── */}
            <nav
                className="hidden md:flex items-center gap-8 text-sm font-medium transition-colors duration-300 p-3 rounded-full backdrop-blur-xl dark:text-white/70 text-black/70"
            >
                <a href="#fonctionnalites" className="hover:text-text transition-colors">
                    Fonctionnalités
                </a>
                <a href="#how" className="hover:text-text transition-colors">
                    Comment ça marche
                </a>
                <a href="#faq" className="hover:text-text transition-colors">
                    FAQ
                </a>
            </nav>

            {/* ── Right cluster ────────────────────────────────────────────────── */}
            <div className="ml-auto md:ml-3 flex items-center gap-2">

                {/* Dark mode toggle */}
                <ThemeToggle />


                <Link
                    to="/connexion"
                    className="px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 dark:text-white/80 dark:hover:text-white text-black/70 hover:text-black"
                >
                    Connexion
                </Link>

                <Link
                    to="/connexion"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
                      transition-colors duration-300 dark:bg-white dark:text-black dark:hover:bg-white/90 bg-black text-white hover:bg-black/85"
                        
                >
                    <span>Accéder à l'app</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}