import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import React from 'react'
import { Link } from 'react-router-dom';
import logo from "../assets/logo.svg";


function PortalNav() {
    return (
        <div className="p-6 md:p-10 flex flex-row items-center justify-between w-full">

            {/* ── Logo ─────────────────────────────────────────────────────────── */}
            <Link to={"/"}>
                <img src={logo} alt="" className="min-w-[100px] w-[8vw] max-w-[300px]" />
            </Link>

            {/* ── Right cluster ────────────────────────────────────────────────── */}
            <div className="ml-auto md:ml-3 flex items-center gap-8">
                <Link
                    to={"/"}
                    className="px-5 py-3 bg-black dark:bg-white dark:text-black dark:hover:bg-white/30 dark:hover:text-white hover:bg-green-400 text-white transition-colors duration-500 text-lg rounded-2xl flex flex-row items-center gap-3"                >


                    <ArrowLeft />
                    Retour
                </Link>

                {/* Dark mode toggle */}
                <ThemeToggle />
            </div>
        </div>
    );
}


export default function CitizenPortal() {

    return (
        <div>
            <PortalNav />
            CitizenPortal vgbjnmp
        </div>
    )
}
