import {
  ClipboardList,
  UserCheck,
  FileText,
  Landmark,
  Bitcoin,
  type LucideIcon,
  Check,
} from "lucide-react";

export type HowStep = {
  n: string;
  label: string;
  description: string;
  icon: LucideIcon;
  tone: string;
};

export const howSteps: HowStep[] = [
  {
    n: "01.",
    label: "Renseigner les informations",
    description:
      "Le citoyen remplit un formulaire guidé depuis son smartphone : identité vendeur/acheteur, localisation de la parcelle, limites de voisinage et pièces justificatives.",
    icon: ClipboardList,
    tone: "from-[#2a2233] to-[#3a3540]",
  },
  {
    n: "02.",
    label: "Validation par le Chef de Quartier",
    description:
      "Le Chef de Quartier vérifie les noms des voisins déclarés sur le terrain et confirme le bon voisinage par signature OTP (code SMS).",
    icon: UserCheck,
    tone: "from-[#352f2a] to-[#4a3f30]",
  },
  {
    n: "03.",
    label: "Attestation générée, scellée et envoyée",
    description:
      "Une attestation provisoire est générée avec un QR code unique. Son empreinte SHA-256 est calculée et ancrée sur Bitcoin via OpenTimestamps.",
    icon: FileText,
    tone: "from-[#2a323a] to-[#34424f]",
  },
  {
    n: "04.",
    label: "Vérification et validation par le Notaire",
    description:
      "L'agent Mairie ou le notaire contrôle le dossier complet, approuve la transaction et déclenche la génération de la convention finale chaînée au document provisoire.",
    icon: Landmark,
    tone: "from-[#3a2f1f] to-[#4f3a1f]",
  },
  {
    n: "05.",
    label: "Convention de Vente Notarisée scellée",
    description:
      "La convention finale est ancrée sur un systeme decentralise. N'importe qui peut scanner le QR code ou glisser le PDF pour vérifier instantanément son authenticité.",
    icon: Check,
    tone: "from-[#1f3a2a] to-[#1f4f30]",
  },
];