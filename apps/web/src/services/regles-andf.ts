import type { Dossier, DossierInput } from "../lib/types";

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ Moteur de règles ANDF · version hackathon simplifiée                     ║
// ║                                                                          ║
// ║ Le dossier de cadrage (section 7.2) recommande explicitement de réduire  ║
// ║ ce moteur à 2-3 cas représentatifs plutôt que de coder les 6 paliers     ║
// ║ complets. Un jury de hackathon valorise la clarté sur ce qui est réel.   ║
// ║                                                                          ║
// ║ Règles couvertes :                                                       ║
// ║   1. Zone rurale + acheteur non béninois → BLOQUE (art. 17 CFD)          ║
// ║   2. Zone urbaine + étranger → bail 50 ans non renouvelable (flag UI)    ║
// ║   3. Zone rurale + superficie > 2 ha → avis CoGeF requis (flag UI)       ║
// ║   4. Acquisition > 1000 ha → INTERDITE                                   ║
// ╚══════════════════════════════════════════════════════════════════════════╝

export type EvaluationAndf = {
  etrangerZoneRurale: boolean;     // BLOQUANT
  superficieSeuil: boolean;        // FLAG (avis requis)
  acquisitionInterdite: boolean;   // BLOQUANT (> 1000 ha)
  baillStrangerUrbain: boolean;    // FLAG (bail 50 ans seulement)
  alertes: AlerteAndf[];
};

export type AlerteAndf = {
  niveau: "bloquant" | "info";
  message: string;
  reference: string;  // article CFD pour traçabilité
};

const SUPERFICIE_SEUIL_HA = 2;
const SUPERFICIE_INTERDITE_HA = 1000;
const M2_PAR_HA = 10_000;

function estBeninois(nationalite: string | null | undefined): boolean {
  if (!nationalite) return true; // défaut tolérant pour la saisie
  return nationalite.trim().toLowerCase().startsWith("benin"); // "beninoise", "béninois"...
}

export function evaluerReglesAndf(d: DossierInput | Dossier): EvaluationAndf {
  const alertes: AlerteAndf[] = [];
  const beninois = estBeninois(d.acheteur_nationalite);
  const superficieHa = d.superficie_m2 ? d.superficie_m2 / M2_PAR_HA : 0;

  // Règle 4 · plafond absolu 1000 ha
  const acquisitionInterdite = superficieHa > SUPERFICIE_INTERDITE_HA;
  if (acquisitionInterdite) {
    alertes.push({
      niveau: "bloquant",
      message: `Acquisition de plus de ${SUPERFICIE_INTERDITE_HA} ha interdite (toutes zones).`,
      reference: "Art. 367 CFD",
    });
  }

  // Règle 1 · étranger en zone rurale = bloqué
  const etrangerZoneRurale = d.zone === "rurale" && !beninois;
  if (etrangerZoneRurale) {
    alertes.push({
      niveau: "bloquant",
      message:
        "En zone rurale, seules les personnes de nationalité béninoise peuvent acquérir.",
      reference: "Art. 17 CFD",
    });
  }

  // Règle 2 · étranger en zone urbaine = bail 50 ans seulement
  const baillStrangerUrbain = d.zone === "urbaine" && !beninois;
  if (baillStrangerUrbain) {
    alertes.push({
      niveau: "info",
      message:
        "Acheteur non béninois en zone urbaine : bail de 50 ans non renouvelable, pas de pleine propriété.",
      reference: "Régime CFD",
    });
  }

  // Règle 3 · seuil de superficie en zone rurale = avis CoGeF requis
  const superficieSeuil = d.zone === "rurale" && superficieHa >= SUPERFICIE_SEUIL_HA;
  if (superficieSeuil) {
    alertes.push({
      niveau: "info",
      message: `Superficie ≥ ${SUPERFICIE_SEUIL_HA} ha en zone rurale : avis du CoGeF requis avant validation.`,
      reference: "Tableau seuils ANDF · section 1.3 du dossier",
    });
  }

  return {
    etrangerZoneRurale,
    superficieSeuil,
    acquisitionInterdite,
    baillStrangerUrbain,
    alertes,
  };
}

// Helper booléen pour bloquer la soumission côté UI.
export function estBloque(evaluation: EvaluationAndf): boolean {
  return evaluation.alertes.some((a) => a.niveau === "bloquant");
}
