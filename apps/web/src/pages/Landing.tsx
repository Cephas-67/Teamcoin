import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="container py-16 space-y-20">
      <section className="text-center max-w-3xl mx-auto space-y-6">
        <span className="inline-block text-xs uppercase tracking-widest text-primary font-mono">
          Confiance Foncière · Bénin 🇧🇯
        </span>
        <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight">
          La parole et l'empreinte de chacun, <span className="text-primary">scellées dans Bitcoin.</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          KandoFoncier élimine les doubles ventes et les actes falsifiés en combinant audio dans la langue locale,
          biométrie sur smartphone et ancrage cryptographique éternel sur la blockchain Bitcoin.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/notariser" className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition">
            Notariser une vente
          </Link>
          <Link to="/verifier" className="px-6 py-3 rounded-lg border border-border font-medium hover:bg-muted transition">
            Vérifier un document
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        <Card title="🎙️ L'intention" desc="La cliente s'enregistre dans sa langue (Fon, Yoruba, Adja) pour attester son consentement éclairé." />
        <Card title="👆 L'action" desc="L'empreinte digitale débloque une clé cryptographique locale qui signe l'acte." />
        <Card title="⛓️ La vérité" desc="Le hash combiné (contrat + audio) est ancré sur Bitcoin via OpenTimestamps. Frais : 0 FCFA." />
      </section>

      <section className="bg-muted rounded-2xl p-8 md:p-12">
        <h2 className="font-display text-3xl font-bold mb-4">L'histoire de Maman Chantal</h2>
        <p className="text-muted-foreground leading-relaxed">
          Vendeuse de poisson à Dantokpa, Chantal ne sait ni lire ni écrire. Elle achète une parcelle à
          Abomey-Calavi. L'agent foncier téléverse le contrat, Chantal enregistre 10 secondes en Fon,
          pose son doigt sur l'écran. Deux ans plus tard, le vendeur tente une double vente avec un
          document légèrement modifié. Le nouvel acheteur scanne le document sur KandoFoncier :
          <span className="text-danger font-semibold"> Alerte Rouge.</span> La fraude est bloquée, la vidéo originale témoigne devant le tribunal.
        </p>
      </section>
    </div>
  );
}

function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-6 rounded-xl border border-border bg-background hover:border-primary/40 transition">
      <h3 className="font-display text-xl font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
