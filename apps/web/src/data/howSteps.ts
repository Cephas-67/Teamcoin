// 5 étapes de la notarisation KandoFoncier.
// Structure miroir de GemmaS HowItWorks (sticky scroll + crossfade).
import {
  ClipboardList,
  Mic,
  Fingerprint,
  Bitcoin,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type HowStep = {
  n: string;
  label: string;
  description: string;
  icon: LucideIcon;
  tone: string; // couleur de fond illustrative
};

export const howSteps: HowStep[] = [
  {
    n: "01.",
    label: "Référencer la parcelle",
    description:
      "L'agent foncier saisit la référence cadastrale, la ville, les noms du vendeur et de l'acheteur.",
    icon: ClipboardList,
    tone: "from-[#2a2233] to-[#3a3540]",
  },
  {
    n: "02.",
    label: "Enregistrer le consentement",
    description:
      "La cliente parle dans sa langue locale (Fon, Yoruba, Adja). L'audio devient une preuve d'intention.",
    icon: Mic,
    tone: "from-[#352f2a] to-[#4a3f30]",
  },
  {
    n: "03.",
    label: "Capturer la signature",
    description:
      "L'empreinte digitale débloque une clé cryptographique gérée par l'enclave sécurisée du smartphone.",
    icon: Fingerprint,
    tone: "from-[#2a323a] to-[#34424f]",
  },
  {
    n: "04.",
    label: "Sceller sur Bitcoin",
    description:
      "Le hash SHA-256 du couple (document + audio) est ancré dans la blockchain via OpenTimestamps.",
    icon: Bitcoin,
    tone: "from-[#3a2f1f] to-[#4f3a1f]",
  },
  {
    n: "05.",
    label: "Vérifier à tout moment",
    description:
      "N'importe qui peut recharger le document. Un seul octet modifié rend la preuve invalide.",
    icon: ShieldCheck,
    tone: "from-[#1f3a2a] to-[#1f4f30]",
  },
];
