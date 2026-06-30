import {
  ArrowRight,
  Mic,
  Fingerprint,
  Link as LinkIcon,
  ShieldAlert,
  Eye,
  Languages,
  FileSearch,
  Database,
  Code2,
  Layout,
  Bitcoin,
} from "lucide-react";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { FAQ } from "@/components/sections/FAQ";
import HeroNav from "@/components/HeroNav";
import bg from "@/assets/images/bg.svg";
import img1 from "@/assets/images/img1.webp";
import img2 from "@/assets/images/img2.webp";
import img3 from "@/assets/images/img3.webp";
import img4 from "@/assets/images/img4.webp";
import img5 from "@/assets/images/img5.webp";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Footer } from "@/components/Footer";

const heroImages = [img1, img2, img3, img4, img5];

export default function Landing() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <Stack />
      <FAQ />
      <FinalCta />
      <Footer />
    </>
  );
}

function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.92]);

  return (
    <section className="relative flex flex-col items-center justify-center overflow-hidden w-full min-h-screen text-neutral-900 dark:text-white">
      <HeroNav />
      <motion.div
        ref={ref}
        style={{ scale, willChange: "transform" }}
        className="
          relative origin-top
          w-full min-h-screen
          md:w-[98vw] md:min-h-[98vh] md:rounded-[30px]
        "
      >
        {/* Background pattern */}
        <div
          style={{ backgroundImage: `url('${bg}')` }}
          className="bg-cover bg-top lg:bg-contain w-full h-full bg-repeat-x opacity-10 dark:opacity-20 absolute top-1/3 md:top-1/2 left-0 pointer-events-none"
        />


        {/* Hero content — single centered column, no nested min-h-screen */}
        <div className="relative flex flex-col items-center justify-center h-screen px-5 pb-12 pt-16 md:px-8 md:pb-16 md:pt-24">
          <h1 className="text-3xl sm:text-4xl md:text-6xl text-center font-semibold max-w-4xl">
            Sécurisez chaque transaction foncière grâce à{" "}
            <span className="text-gandehou-green">Gandéhou</span>
          </h1>

          <p className="mt-4 max-w-2xl px-2 text-center text-sm sm:text-base text-neutral-900/70 dark:text-white/70">
            La confiance devient vérifiable. Des documents fonciers sécurisés,
            traçables et vérifiables grâce aux principes de sécurité de Bitcoin.
          </p>

          {/* CTAs — stack on small screens, row on larger */}
          <div className="mt-8 flex flex-col gap-3 w-full max-w-sm sm:flex-row sm:max-w-none sm:w-auto">
            <Link
              to="/onboarding"
              className="flex items-center justify-center gap-2 rounded-2xl bg-gandehou-green px-8 py-3.5 text-lg font-medium text-white transition-colors duration-300 hover:bg-gandehou-green/90"
            >
              Commencer
            </Link>
            <a
              href="#fonctionnalites"
              className="group flex items-center justify-center gap-2 rounded-2xl border border-black/15 px-6 py-3.5 text-lg dark:border-white/15 dark:bg-white/10"
            >
              <span className="font-medium">En savoir plus</span>
              <svg
                className="mt-0.5 transition-transform group-hover:translate-x-2"
                width="6"
                height="8"
                viewBox="0 0 6 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M1.25.5 4.75 4l-3.5 3.5"
                  stroke="currentColor"
                  strokeOpacity=".4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>

          {/* Image strip — scrollable on mobile with proper edge padding */}
          <div
            aria-label="Photos"
            className="
              mt-10 md:mt-12 flex gap-4 md:gap-6
              w-full max-w-4xl mx-auto pb-4
              overflow-x-auto snap-x snap-mandatory
              px-4 md:px-0
              scrollbar-none
            "
          >
            {heroImages.map((src, i) => (
              <img
                key={src}
                alt=""
                src={src}
                width={144}
                height={176}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                className="
                  w-28 h-36 sm:w-36 sm:h-44
                  rounded-lg object-cover flex-shrink-0
                  snap-center
                  hover:-translate-y-1 transition duration-300
                "
              />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Features() {
  const features = [
    {
      Icon: Mic,
      title: "Consentement audio",
      description:
        "La cliente s'enregistre dans sa langue (Fon, Yoruba, Adja, Mina). Aucune dépendance à la lecture ou à l'écrit.",
    },
    {
      Icon: Fingerprint,
      title: "Signature biométrique",
      description:
        "Empreinte sur l'écran du smartphone via WebAuthn/Passkey. Clé cryptographique gérée par l'enclave sécurisée.",
    },
    {
      Icon: LinkIcon,
      title: "Ancrage Bitcoin",
      description:
        "Hash SHA-256 du couple (contrat + audio) scellé via OpenTimestamps. Coût réseau : zéro FCFA.",
    },
    {
      Icon: ShieldAlert,
      title: "Détection de fraude",
      description:
        "Tout document modifié d'un seul octet est rejeté instantanément. La preuve originale reste opposable.",
    },
    {
      Icon: Eye,
      title: "Explorer public",
      description:
        "Liste de tous les actes notarisés. N'importe quel acquéreur peut vérifier l'historique d'une parcelle.",
    },
    {
      Icon: Languages,
      title: "Inclusion linguistique",
      description:
        "Pas d'interface bardée de texte juridique. Les enregistrements oraux portent l'intention, le code porte la preuve.",
    },
    {
      Icon: FileSearch,
      title: "Vérification universelle",
      description:
        "Le hash recomputé localement vous dit en moins de deux secondes si un document est authentique ou modifié.",
    },
  ];

  return (
    <section id="fonctionnalites" className="w-full py-20 lg:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            Tout ce qu'il faut pour sécuriser une transaction foncière.
          </h2>
          <p className="mt-4 text-neutral-900/60 dark:text-white/60 md:text-lg">
            Outils sobres pensés pour le terrain. Aucune fioriture, juste les
            preuves au bon endroit, vérifiables par n'importe qui.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col items-start gap-4 rounded-2xl border border-black/10 bg-white/5 p-6 backdrop-blur-lg shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:border-gandehou-green/40 hover:bg-white/10 dark:border-white/10 dark:bg-black/30 dark:hover:bg-black/40"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-black/10 bg-gandehou-green/10 text-gandehou-green dark:border-white/10">
                <Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-900/60 dark:text-white/60">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stack() {
  const items = [
    { Icon: Bitcoin, name: "OpenTimestamps", sub: "Ancrage Bitcoin sans frais" },
    { Icon: Database, name: "Supabase Postgres", sub: "Ledger des actes" },
    { Icon: Code2, name: "Express · Node 20", sub: "API + hashing serveur" },
    { Icon: Layout, name: "React · Vite · Tailwind", sub: "UI mobile-first" },
  ];

  return (
    <section id="stack" className="w-full py-20 lg:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <div className="group relative mx-auto max-w-[960px] overflow-hidden rounded-[36px] border border-black/10 bg-gradient-to-b from-white/60 to-white/30 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_30px_80px_-30px_rgba(0,0,0,0.15)] dark:border-white/10 dark:from-black/40 dark:to-black/60 dark:shadow-[inset_0_2px_0_rgba(255,255,255,0.07),0_40px_100px_-30px_rgba(0,0,0,0.6)]">
          {/* Ambient glows */}
          <div className="pointer-events-none absolute -top-28 -left-28 h-80 w-80 rounded-full bg-gandehou-green/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-28 h-96 w-96 rounded-full bg-gandehou-yellow/15 blur-3xl" />

          <div className="relative p-8 md:p-14 lg:p-16">
            <div className="max-w-2xl">
              <h2 className="bg-gradient-to-b from-neutral-900 to-neutral-900/70 bg-clip-text text-2xl sm:text-3xl font-extrabold tracking-tight text-transparent dark:from-white dark:to-white/70 md:text-4xl lg:text-5xl">
                Une stack pensée pour durer trente ans.
              </h2>
              <p className="mt-4 md:mt-5 text-sm sm:text-base leading-relaxed text-neutral-900/60 dark:text-white/60 md:text-lg">
                Bitcoin pour l'incorruptibilité temporelle, Supabase pour la
                souplesse opérationnelle, Web Crypto pour vérifier dans le
                navigateur sans serveur. Si nos serveurs meurent demain, les
                preuves restent décodables par n'importe quel outil open-source.
              </p>
            </div>

            <div className="mx-auto mt-10 md:mt-14 grid max-w-[640px] grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-4">
              {items.map(({ Icon, name, sub }) => (
                <div
                  key={name}
                  className="group/tile relative flex flex-col items-center gap-3 rounded-[20px] sm:rounded-[24px] border border-black/10 bg-gradient-to-b from-white/80 to-white/40 p-4 sm:p-5 backdrop-blur-md shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_20px_50px_-20px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out hover:-translate-y-1 dark:border-white/10 dark:from-white/[0.04] dark:to-white/[0.02] dark:shadow-[inset_0_2px_2px_rgba(255,255,255,0.08),inset_0_-2px_1px_rgba(0,0,0,0.4),0_26px_70px_-22px_rgba(0,0,0,0.6)]"
                >
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gandehou-green/10 ring-1 ring-black/10 dark:ring-white/10">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-gandehou-green" strokeWidth={1.8} aria-hidden />
                  </div>
                  <div className="text-center">
                    <div className="text-xs sm:text-sm font-semibold tracking-tight">{name}</div>
                    <div className="mt-0.5 text-[11px] sm:text-xs text-neutral-900/55 dark:text-white/55">{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="py-20 lg:py-28">
      <div className="container mx-auto max-w-2xl px-4 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl">
          Prêt à sceller votre première vente ?
        </h2>
        <p className="mb-7 mt-3 text-sm sm:text-base text-neutral-900/60 dark:text-white/60">
          Trois minutes pour notariser un acte. Une preuve qui survit à votre
          téléphone, votre serveur et notre entreprise.
        </p>
        <Link
          to="/onboarding"
          className="mx-auto flex w-full sm:w-fit items-center justify-center gap-2 rounded-2xl bg-gandehou-green px-8 py-3.5 text-lg font-medium text-white transition-colors duration-300 hover:bg-gandehou-green/90"
        >
          Commencer maintenant
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}