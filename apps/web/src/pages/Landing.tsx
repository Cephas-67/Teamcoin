import {
  ArrowRight,
  Play,
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
import { LinkButton } from "../components/Button";
import { HowItWorks } from "../components/sections/HowItWorks";
import { FAQ } from "../components/sections/FAQ";
import HeroNav from "@/components/HeroNav";
import { SectionCard } from "@/components/SectionCard";
import { Reveal } from "@/components/Reveal";
import bg from "../assets/images/bg.svg";
import img1 from "../assets/images/img1.webp";
import img2 from "../assets/images/img2.webp";
import img3 from "../assets/images/img3.webp";
import img4 from "../assets/images/img4.webp";
import img5 from "../assets/images/img5.webp";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useScroll, useTransform } from "motion/react";
import { useRef } from "react";

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
    </>
  );
}

function Hero() {

  const ref = useRef(null);
  const { scrollYProgress } = useScroll();
  // Anime SCALE (GPU, no layout reflow) au lieu de WIDTH (declenche layout a chaque frame).
  const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.92]);

  return (
    <section
      className="relative flex flex-col items-center justify-center
              overflow-hidden w-full min-h-screen
              transition-colors duration-500 dark:text-white text-black "
    >
      <motion.div
        ref={ref}
        style={{ scale, willChange: "transform" }}
        className="relative bg-cover bg-bottom w-[98vw] h-[98vh] rounded-[30px] group origin-top"
      >
        <div
          style={{ backgroundImage: `url('${bg}')` }}
          className="bg-contain bg-bottom w-full h-full opacity-10 dark:opacity-20 absolute top-1/2 left-0 pointer-events-none"
        />


        {/* ── Top nav ──────────────────────────────────────────────────────── */}
        <HeroNav />

        {/* ── Content ──────────────────────────────────────────────────────── */}

        <div
          className="relative flex flex-col items-center justify-center
             w-full min-h-[88vh] dark:text-white text-black
             px-4 sm:px-6 pb-12 sm:pb-16 pt-28 sm:pt-32 md:pt-36 transition-colors duration-600"
        >

          <Reveal as="h1" delay={0.1} className="text-3xl sm:text-4xl md:text-6xl text-center font-semibold max-w-4xl mt-4 sm:mt-5 leading-tight">
            Sécurisez chaque transaction foncière grâce à{" "}
            <span className="text-green-800 dark:text-green-600">Gandéhou</span>
          </Reveal>
          <Reveal as="p" delay={0.25} className="text-sm sm:text-base text-center max-w-2xl mt-3 px-2">
            La confiance devient vérifiable. Des documents fonciers sécurisés, traçables et vérifiables grâce aux principes de sécurité de Bitcoin.
          </Reveal>

          <Reveal delay={0.4} className="grid grid-cols-2 gap-2 sm:gap-3 mt-6 sm:mt-8">
            <Link
              to="/onboarding"
              className="group px-4 sm:px-8 py-2.5 sm:py-3 font-medium bg-black dark:bg-[#008850] dark:hover:bg-white dark:hover:text-black hover:bg-green-400 text-white transition-colors duration-500 text-sm sm:text-lg rounded-2xl flex flex-row items-center justify-center gap-2"
            >
              Commencer
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <a
              href="#fonctionnalites"
              className="group flex items-center justify-center gap-2 dark:bg-white/10 border text-sm sm:text-lg border-black/15 dark:border-white/15 rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3"
            >
              <span className="font-medium">En savoir plus</span>
              <svg
                className="mt-0.5 group-hover:translate-x-2 transition-transform"
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
          </Reveal>

          <div
            aria-label="Photos"
            className="mt-8 sm:mt-12 flex overflow-x-auto sm:overflow-visible gap-3 sm:gap-6 max-w-4xl w-full pb-4 sm:pb-6 mx-auto px-2 sm:px-0 sm:justify-center snap-x"
          >
            {heroImages.map((src, i) => (
              <Reveal key={src} delay={0.6 + i * 0.1}>
                <img
                  alt=""
                  src={src}
                  width={144}
                  height={176}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="w-28 h-36 sm:w-36 sm:h-44 rounded-lg hover:-translate-y-1 transition duration-300 object-cover flex-shrink-0 snap-start"
                />
              </Reveal>
            ))}
          </div>
        </div>
      </motion.div>

    </section>
  );
}

function Stat({ label, value, suffix, hint }: { label: string; value: string; suffix?: string; hint?: string }) {
  return (
    <div>
      <div className="text-sm text-muted">{label}</div>
      <div className="text-3xl md:text-4xl font-extrabold tracking-tight mt-1">
        {value}
        {suffix && <span className="text-accent">{suffix}</span>}
      </div>
      {hint && <div className="text-xs text-muted mt-0.5">{hint}</div>}
    </div>
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
    <SectionCard id="fonctionnalites" innerClassName="px-4 sm:px-6 md:px-10 lg:px-14 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal as="h2" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
          Tout ce qu'il faut pour sécuriser une transaction foncière.
        </Reveal>
        <Reveal as="p" delay={0.15} className="mt-4 text-muted text-sm sm:text-base md:text-lg">
          Outils sobres pensés pour le terrain. Aucune fioriture, juste les preuves
          au bon endroit, vérifiables par n'importe qui.
        </Reveal>
      </div>

      <div className="mt-10 sm:mt-14 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map(({ Icon, title, description }, i) => (
          <Reveal key={title} delay={i * 0.08}>
            <div className="group flex flex-col items-start gap-3 sm:gap-4 rounded-2xl border border-border bg-surface dark:bg-black/30 p-5 sm:p-6 backdrop-blur-lg shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-accent/40 hover:bg-surface-2 dark:hover:bg-black/40 h-full">
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl border border-border/60 bg-bg/60 text-accent transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.8} aria-hidden />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold tracking-tight">{title}</h3>
                <p className="mt-1.5 sm:mt-2 text-sm leading-relaxed text-muted">{description}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </SectionCard>
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
    <SectionCard id="stack" innerClassName="px-4 sm:px-6 md:px-10 lg:px-14 py-16 sm:py-20 lg:py-24">
      <div className="group relative mx-auto max-w-[960px] overflow-hidden rounded-[24px] sm:rounded-[36px] border border-border bg-surface/60 dark:bg-black/30 backdrop-blur-xl">
        {/* Glows ambiants charte */}
        <div className="pointer-events-none absolute -top-20 -left-20 h-60 w-60 sm:h-80 sm:w-80 rounded-full blur-3xl bg-[radial-gradient(closest-side,hsl(155_100%_18%/0.25),transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 sm:h-96 sm:w-96 rounded-full blur-3xl bg-[radial-gradient(closest-side,hsl(25_92%_54%/0.16),transparent_70%)]" />

        <div className="relative p-6 sm:p-10 md:p-14 lg:p-16">
          <div className="max-w-2xl">
            <Reveal as="h2" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-text">
              Une stack pensée pour durer trente ans.
            </Reveal>
            <Reveal as="p" delay={0.15} className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg leading-relaxed text-muted">
              Bitcoin pour l'incorruptibilité temporelle, Supabase pour la souplesse opérationnelle,
              Web Crypto pour vérifier dans le navigateur sans serveur. Si nos serveurs meurent demain,
              les preuves restent décodables par n'importe quel outil open-source.
            </Reveal>
          </div>

          <div className="mx-auto mt-10 sm:mt-14 grid max-w-[640px] grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-4">
            {items.map(({ Icon, name, sub }, i) => (
              <Reveal key={name} delay={0.3 + i * 0.08}>
                <div className="group/tile relative flex flex-col items-center gap-2 sm:gap-3 rounded-[20px] sm:rounded-[24px] border border-border bg-surface dark:bg-white/[0.04] p-4 sm:p-5 backdrop-blur-md transition-transform duration-300 ease-out hover:-translate-y-1 h-full">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-bg/60 ring-1 ring-border/60 transition-transform duration-300 group-hover/tile:scale-110">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-accent" strokeWidth={1.8} aria-hidden />
                  </div>
                  <div className="text-center">
                    <div className="text-xs sm:text-sm font-semibold tracking-tight">{name}</div>
                    <div className="mt-0.5 text-[11px] sm:text-xs text-muted">{sub}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function FinalCta() {
  return (
    <SectionCard innerClassName="px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto text-center max-w-2xl">
        <Reveal as="h2" className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 tracking-tight">
          Prêt à sceller votre première vente ?
        </Reveal>
        <Reveal as="p" delay={0.15} className="text-muted text-sm sm:text-base mb-6 sm:mb-7">
          Trois minutes pour notariser un acte. Une preuve qui survit à votre téléphone, votre serveur
          et notre entreprise.
        </Reveal>
        <Reveal delay={0.3}>
          <Link
            to="/citizen-portal"
            className="group px-6 sm:px-8 py-3 w-fit mx-auto font-medium bg-black dark:bg-[#008850] dark:hover:bg-white dark:hover:text-black hover:bg-green-400 text-white transition-colors duration-500 text-base sm:text-lg rounded-2xl flex flex-row items-center justify-center gap-2"
          >
            Commencer maintenant
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>
    </SectionCard>
  );
}
