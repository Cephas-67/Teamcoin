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
import { BentoItem } from "../components/BentoItem";
import { HowItWorks } from "../components/sections/HowItWorks";
import { FAQ } from "../components/sections/FAQ";
import SoftGradient from "@/components/backgrounds/SoftGradient";
import HeroNav from "@/components/HeroNav";
import btc from "../assets/BTCIcon.png"
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "react-router-dom";

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
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center">
      <SoftGradient className="w-[98vw] min-h-[98vh] rounded-[36px]">
        <section
          className="relative flex flex-col items-center justify-center
                  pt-20 lg:pt-28 pb-16 lg:pb-20 overflow-hidden w-full h-[98vh]
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
      </SoftGradient>
    </div>
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
  return (
    <section id="fonctionnalites" className="py-16 lg:py-24">
      <div className="container">
        <div className="max-w-2xl mb-12">
          <span className="text-accent text-sm font-medium">Fonctionnalités</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-3 tracking-tight">
            Tout ce qu'il faut pour sécuriser une transaction foncière.
          </h2>
          <p className="text-muted text-base leading-relaxed">
            Outils sobres pensés pour le terrain. Aucune fioriture, juste les preuves
            au bon endroit, vérifiables par n'importe qui.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-3 lg:gap-4">
          <BentoItem
            icon={Mic}
            span={6}
            title="Consentement audio"
            description="La cliente s'enregistre dans sa langue (Fon, Yoruba, Adja, Mina). Aucune dépendance à la lecture ou à l'écrit."
          />
          <BentoItem
            icon={Fingerprint}
            span={6}
            title="Signature biométrique"
            description="Empreinte sur l'écran du smartphone via WebAuthn/Passkey. Clé cryptographique gérée par l'enclave sécurisée."
          />
          <BentoItem
            icon={LinkIcon}
            span={4}
            title="Ancrage Bitcoin"
            description="Hash SHA-256 du couple (contrat + audio) scellé via OpenTimestamps. Coût réseau : zéro FCFA."
          />
          <BentoItem
            icon={ShieldAlert}
            span={4}
            title="Détection de fraude"
            description="Tout document modifié d'un seul octet est rejeté instantanément. La preuve originale reste opposable."
          />
          <BentoItem
            icon={Eye}
            span={4}
            title="Explorer public"
            description="Liste de tous les actes notarisés. N'importe quel acquéreur peut vérifier l'historique d'une parcelle."
          />
          <BentoItem
            icon={Languages}
            span={6}
            title="Inclusion linguistique"
            description="Pas d'interface bardée de texte juridique. Les enregistrements oraux portent l'intention, le code porte la preuve."
          />
          <BentoItem
            icon={FileSearch}
            span={6}
            title="Vérification universelle"
            description="Le hash recomputé localement vous dit en moins de deux secondes si un document est authentique ou modifié."
          />
        </div>
      </div>
    </section>
  );
}

function Stack() {
  const items = [
    { icon: Bitcoin, name: "OpenTimestamps", sub: "Ancrage Bitcoin sans frais" },
    { icon: Database, name: "Supabase Postgres", sub: "Ledger des actes" },
    { icon: Code2, name: "Express · Node 20", sub: "API + hashing serveur" },
    { icon: Layout, name: "React · Vite · Tailwind", sub: "UI mobile-first" },
  ];

  return (
    <section id="stack" className="py-16 lg:py-24 border-t border-border">
      <div className="container">
        <div className="p-6 lg:p-10 rounded-xl border border-border">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-accent text-sm font-medium">Architecture</span>
              <h2 className="text-2xl md:text-3xl font-bold mt-2 mb-3 tracking-tight">
                Une stack pensée pour durer trente ans.
              </h2>
              <p className="text-muted text-base leading-relaxed">
                Bitcoin pour l'incorruptibilité temporelle, Supabase pour la souplesse opérationnelle,
                Web Crypto pour vérifier dans le navigateur sans serveur. Si nos serveurs meurent demain,
                les preuves restent décodables par n'importe quel outil open-source.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {items.map((it) => (
                <div key={it.name} className="p-4 rounded-xl border border-border bg-surface text-center">
                  <it.icon className="w-7 h-7 text-accent mx-auto mb-2" strokeWidth={1.8} />
                  <div className="font-semibold text-sm">{it.name}</div>
                  <div className="text-xs text-muted mt-0.5">{it.sub}</div>
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
    <section className="py-16 lg:py-24 border-t border-border">
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
