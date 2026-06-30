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
import SoftGradient from "@/components/backgrounds/SoftGradient";
import HeroNav from "@/components/HeroNav";
import btc from "../assets/BTCIcon.png"
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <SoftGradient>
      <Hero />
      <Features />
      <HowItWorks />
      <Stack />
      <FAQ />
      <FinalCta />
    </SoftGradient>
  );
}

function Hero() {
  return (
    <section
      className="relative flex flex-col items-center justify-center
              pt-20 lg:pt-28 pb-16 lg:pb-20 overflow-hidden w-full min-h-screen
              transition-colors duration-500 dark:text-white text-black"
    >
      {/* ── Top nav ──────────────────────────────────────────────────────── */}
      <HeroNav />

          {/* ── Content ──────────────────────────────────────────────────────── */}
          {/* <div className="container flex flex-row items-start justify-center relative">
            <div className="w-[60%]">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tighter max-w-5xl">
                La parole et l'empreinte.<br />
                <span className="hl-accent">Scellées</span> dans Bitcoin.
              </h1>

              <p
                className="mt-6 text-base md:text-lg max-w-2xl leading-relaxed transition-colors duration-500 dark:text-white/60 text-black/60"
              >
                KandoFoncier élimine les doubles ventes et les actes falsifiés.
                Audio dans la langue locale, biométrie sur smartphone, ancrage cryptographique
                éternel via OpenTimestamps. Pensé pour les 40 % de Béninois qui ne lisent pas.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton to="/notariser" variant="primary" size="lg">
                  Notariser un acte
                  <ArrowRight className="w-4 h-4" />
                </LinkButton>
                <LinkButton to="/explorer" variant="outline" size="lg">
                  <Play className="w-4 h-4" />
                  Explorer le ledger
                </LinkButton>
              </div>

              <div
                className="mt-14 pt-8 border-t grid grid-cols-2 md:grid-cols-4 gap-6 transition-colors duration-500 dark:border-white/15 border-border"
              >
                <Stat label="Coût d'ancrage" value="0" suffix=" FCFA" />
                <Stat label="Langues locales" value="4" suffix="+" hint="Fon · Yoruba · Adja…" />
                <Stat label="Vérification" value="<2s" hint="hash recomputé local" />
                <Stat label="Durée de preuve" value="∞" hint="tant que Bitcoin vit" />
              </div>
            </div>

            <div className="w-[40%] h-full">
              <img src={btc} alt="Bitcoin" />
            </div>
          </div> */}

          {/* <section className=" w-full bg-no-repeat bg-cover bg-center text-sm pb-44">

            <div className="flex items-center gap-2 border border-slate-300 hover:border-slate-400/70 rounded-full w-max mx-auto px-4 py-2 mt-40 md:mt-32">
              <span>New announcement on your inbox</span>
              <button className="flex items-center gap-1 font-medium">
                <span>Read more</span>
                <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M3.959 9.5h11.083m0 0L9.501 3.958M15.042 9.5l-5.541 5.54" stroke="#050040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <h5 className="text-4xl md:text-7xl font-medium max-w-[850px] text-center mx-auto mt-8">
              Build apps faster with ui components
            </h5>

            <p className="text-sm md:text-base mx-auto max-w-2xl text-center mt-6 max-md:px-2">
              Build sleek, consistent UIs without wrestling with design systems, our components handle the heavy lifting so you can ship faster.
            </p>

            <div className="mx-auto w-full flex items-center justify-center gap-3 mt-4">
              <button className="bg-slate-800 hover:bg-black text-white px-6 py-3 rounded-full font-medium transition">
                Get Started
              </button>
              <button className="flex items-center gap-2 border border-slate-300 hover:bg-slate-200/30 rounded-full px-6 py-3">
                <span>Learn More</span>
                <svg width="6" height="8" viewBox="0 0 6 8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M1.25.5 4.75 4l-3.5 3.5" stroke="#050040" strokeOpacity=".4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </section> */}

          <section
            className="relative flex flex-col items-center justify-center 
             w-full min-h-screen  dark:text-white text-black
             bg-center bg-cover pb-16 pt-8 transition-colors duration-600"
          >

            <h1 className="text-4xl md:text-6xl text-center font-semibold max-w-4xl mt-5">
              Sécurisez chaque transaction foncière grâce à Bitcoin
            </h1>
            <p className="md:text-base line-clamp-3 max-md:px-2 text-center max-w-2xl mt-3">
              La confiance devient vérifiable.

              Des documents fonciers sécurisés, traçables et vérifiables grâce aux principes de sécurité de Bitcoin.            </p>

            <div className="grid grid-cols-2 gap-2 mt-8 text-sm">
              <Link to={"/connexion"} className="px-8 py-3 font-medium bg-black dark:bg-green-500 dark:hover:bg-white dark:hover:text-black hover:bg-green-400 text-white transition-colors duration-500 text-lg rounded-full flex flex-row items-center justify-center">Commencer</Link>
              <a href={"#fonctionnalites"} className="group flex items-center gap-2 dark:bg-white/10 border text-lg border-black/15 dark:border-white/15 rounded-full px-6 py-3">
                <span className="font-medium">En savoir plus</span>
                <svg className="mt-0.5 group-hover:translate-x-2 transition-transform" width="6" height="8" viewBox="0 0 6 8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden >
                  <path d="M1.25.5 4.75 4l-3.5 3.5" stroke="currentColor" strokeOpacity=".4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>

            <div aria-label="Photos of leaders" className="mt-12 flex max-md:overflow-x-auto gap-6 max-w-4xl w-full pb-6 mx-auto">
              <img alt="" className="w-36 h-44 rounded-lg hover:-translate-y-1 transition duration-300 object-cover flex-shrink-0" height={140} src="https://images.unsplash.com/flagged/photo-1573740144655-bbb6e88fb18a?q=80&w=735&auto=format&fit=crop" width={120} />
              <img alt="" className="w-36 h-44 rounded-lg hover:-translate-y-1 transition duration-300 object-cover flex-shrink-0" height={140} src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=687&auto=format&fit=crop" width={120} />
              <img alt="" className="w-36 h-44 rounded-lg hover:-translate-y-1 transition duration-300 object-cover flex-shrink-0" height={140} src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=687&auto=format&fit=crop" width={120} />
              <img alt="" className="w-36 h-44 rounded-lg hover:-translate-y-1 transition duration-300 object-cover flex-shrink-0" height={140} src="https://images.unsplash.com/photo-1546961329-78bef0414d7c?q=80&w=687&auto=format&fit=crop" width={120} />
              <img alt="" className="w-36 h-44 rounded-lg hover:-translate-y-1 transition duration-300 object-cover flex-shrink-0" height={140} src="https://images.unsplash.com/photo-1639149888905-fb39731f2e6c?q=80&w=764&auto=format&fit=crop" width={120} />
            </div>
          </section>

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
    <section id="fonctionnalites" className="w-full py-20 lg:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            Tout ce qu'il faut pour sécuriser une transaction foncière.
          </h2>
          <p className="mt-4 text-muted md:text-lg">
            Outils sobres pensés pour le terrain. Aucune fioriture, juste les preuves
            au bon endroit, vérifiables par n'importe qui.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col items-start gap-4 rounded-2xl border border-border/60 bg-white/5 dark:bg-black/30 p-6 backdrop-blur-lg shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:border-accent/40 hover:bg-white/10 dark:hover:bg-black/40"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-background/60 text-accent">
                <Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
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
        <div className="group relative mx-auto max-w-[960px] overflow-hidden rounded-[36px] border border-border/60 bg-gradient-to-b from-white/60 to-white/30 dark:from-black/40 dark:to-black/60 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_30px_80px_-30px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_2px_0_rgba(255,255,255,0.07),0_40px_100px_-30px_rgba(0,0,0,0.6)]">
          {/* Glows ambiants */}
          <div className="pointer-events-none absolute -top-28 -left-28 h-80 w-80 rounded-full blur-3xl bg-[radial-gradient(closest-side,hsl(var(--brand-blue)/0.18),transparent_70%)]" />
          <div className="pointer-events-none absolute -bottom-24 -right-28 h-96 w-96 rounded-full blur-3xl bg-[radial-gradient(closest-side,hsl(var(--brand-orange)/0.16),transparent_70%)]" />

          <div className="relative p-10 md:p-14 lg:p-16">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                Une stack pensée pour durer trente ans.
              </h2>
              <p className="mt-5 text-base md:text-lg leading-relaxed text-muted">
                Bitcoin pour l'incorruptibilité temporelle, Supabase pour la souplesse opérationnelle,
                Web Crypto pour vérifier dans le navigateur sans serveur. Si nos serveurs meurent demain,
                les preuves restent décodables par n'importe quel outil open-source.
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-[640px] grid-cols-2 gap-6 sm:grid-cols-4">
              {items.map(({ Icon, name, sub }) => (
                <div
                  key={name}
                  className="group/tile relative flex flex-col items-center gap-3 rounded-[24px] border border-border/60 bg-gradient-to-b from-white/80 to-white/40 dark:from-white/[0.04] dark:to-white/[0.02] p-5 backdrop-blur-md shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_20px_50px_-20px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_2px_2px_rgba(255,255,255,0.08),inset_0_-2px_1px_rgba(0,0,0,0.4),0_26px_70px_-22px_rgba(0,0,0,0.6)] transition-transform duration-300 ease-out hover:-translate-y-1"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background/60 ring-1 ring-border/60">
                    <Icon className="h-6 w-6 text-accent" strokeWidth={1.8} aria-hidden />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold tracking-tight">{name}</div>
                    <div className="mt-0.5 text-xs text-muted">{sub}</div>
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
      <div className="container text-center max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
          Prêt à sceller votre première vente ?
        </h2>
        <p className="text-muted text-base mb-7">
          Trois minutes pour notariser un acte. Une preuve qui survit à votre téléphone, votre serveur
          et notre entreprise.
        </p>
        <LinkButton to="/notariser" variant="primary" size="lg">
          Commencer maintenant
          <ArrowRight className="w-4 h-4" />
        </LinkButton>
      </div>
    </section>
  );
}
