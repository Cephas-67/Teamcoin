import React, { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { ThemeToggle } from "./ThemeToggle";
import { LinkButton } from "./Button";
import logo from "../assets/logo.svg";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface HeroNavProps {
    isDark: boolean;
    onToggleDark: () => void;
}

export default function HeroNav() {
    return (
        <div className="z-40 fixed top-0 left-0 p-6 md:p-10 flex flex-row items-center justify-between w-full">

            {/* ── Logo ─────────────────────────────────────────────────────────── */}
            <img src={logo} alt="" className="min-w-[100px] w-[8vw] lg:w-[10vw] max-w-[300px]"/>
            {/* ── Nav links ────────────────────────────────────────────────────── */}
            <nav
                className="absolute left-1/2 -translate-x-1/2 hidden w-fit md:flex items-center gap-8 lg:gap-10 text-lg font-medium transition-colors duration-300 py-3 px-5 rounded-full backdrop-blur-xl dark:text-white/70 text-black/70"
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
            <div className="ml-auto md:ml-3 flex items-center gap-8">

                {/* Dark mode toggle */}
                <ThemeToggle />


                <Link
                    to="/onboarding"
                    className="px-8 py-3 bg-black dark:bg-white dark:text-black dark:hover:bg-white/30 dark:hover:text-white hover:bg-green-400 text-white transition-colors duration-500 text-lg rounded-2xl flex flex-row items-center gap-3"                >
                    Accéder à l'app
                    <ArrowRight className="w-5 h-5"/>
                </Link>
            </div>
        </div>
    );
}