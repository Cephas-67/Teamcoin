import { motion } from "motion/react";
import type { ReactNode } from "react";

interface SoftGradientProps {
    children: ReactNode;
    className?: string;
}

const orbs = [
    // Large mint — top center, dominant bloom
    {
        color: "#A8D5BA",
        size: 620,
        opacity: 0.75,
        initial: { top: "-5%", left: "25%" },
        animate: { x: [0, 50, -30, 0], y: [0, 60, -40, 0], scale: [1, 1.08, 0.96, 1] },
        duration: 14,
    },
    // Soft sage — mid right
    {
        color: "#B2DFC8",
        size: 480,
        opacity: 0.65,
        initial: { top: "30%", left: "55%" },
        animate: { x: [0, -70, 40, 0], y: [0, 50, -50, 0], scale: [1, 1.15, 0.92, 1] },
        duration: 18,
    },
    // Pale aqua-green — bottom left
    {
        color: "#C4EBD8",
        size: 580,
        opacity: 0.7,
        initial: { top: "60%", left: "-5%" },
        animate: { x: [0, 90, -50, 0], y: [0, -60, 70, 0], scale: [1, 1.1, 0.95, 1] },
        duration: 22,
    },
    // Warm celadon — bottom right accent
    {
        color: "#D0EDE0",
        size: 420,
        opacity: 0.6,
        initial: { top: "65%", left: "60%" },
        animate: { x: [0, -50, 60, 0], y: [0, -80, 30, 0], scale: [1, 1.2, 0.9, 1] },
        duration: 16,
    },
    // Tiny bright spearmint — top right sparkle
    {
        color: "#8ECFA8",
        size: 300,
        opacity: 0.45,
        initial: { top: "5%", left: "70%" },
        animate: { x: [0, -40, 30, 0], y: [0, 70, -30, 0], scale: [1, 1.25, 0.88, 1] },
        duration: 11,
    },
];

export default function SoftGradient({ children, className }: SoftGradientProps) {
    return (
        <div className={`relative w-full ${className ?? ""}`}>
            {/* Orbs en position fixe : suivent le viewport, restent visibles sur toute la page */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                {orbs.map((orb, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            width: orb.size,
                            height: orb.size * 1.4,
                            top: orb.initial.top,
                            left: orb.initial.left,
                            opacity: orb.opacity,
                            background: `radial-gradient(ellipse, ${orb.color} 0%, transparent 68%)`,
                        }}
                        animate={orb.animate}
                        transition={{
                            duration: orb.duration,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 1.8,
                        }}
                    />
                ))}
            </div>

            {/* Voile flou en mode sombre, au-dessus des orbs */}
            <div className="hidden dark:block fixed inset-0 z-[1] backdrop-blur-[120px] pointer-events-none" />

            {/* Contenu, au-dessus du background */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}