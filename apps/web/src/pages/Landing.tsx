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
    <section className="relative pt-20 lg:pt-28 pb-16 lg:pb-20 overflow-hidden">
      <div className="grid-bg" />
      <div className="container relative">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tighter max-w-5xl">
          La parole et l'empreinte.<br />
          <span className="hl-accent">Scellées</span> dans Bitcoin.
        </h1>

        <p className="mt-6 text-base md:text-lg text-muted max-w-2xl leading-relaxed">
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

        <div className="mt-14 pt-8 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-6">
          <Stat label="Coût d'ancrage" value="0" suffix=" FCFA" />
          <Stat label="Langues locales" value="4" suffix="+" hint="Fon · Yoruba · Adja…" />
          <Stat label="Vérification" value="<2s" hint="hash recomputé local" />
          <Stat label="Durée de preuve" value="∞" hint="tant que Bitcoin vit" />
        </div>
      </div>
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
