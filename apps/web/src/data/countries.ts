// Pays UEMOA + voisins anglophones (sous-région ouest-africaine).
// `digits` = nb total de chiffres APRÈS l'indicatif (ce qu'on demande à l'user).
// `groups` = découpage visuel (somme === digits).
// `flag` = emoji drapeau (rendu natif partout).

export type Country = {
  code: string;     // ISO 3166-1 alpha-2
  name: string;
  dial: string;     // ex. "+229"
  digits: number;   // ex. 8 (BJ)
  groups: number[]; // ex. [2,2,2,2]
  flag: string;
};

export const countries: Country[] = [
  { code: "BJ", name: "Bénin",          dial: "+229", digits: 10, groups: [2,2,2,2,2], flag: "🇧🇯" },
  { code: "TG", name: "Togo",           dial: "+228", digits: 8,  groups: [2,2,2,2],   flag: "🇹🇬" },
  { code: "CI", name: "Côte d'Ivoire",  dial: "+225", digits: 10, groups: [2,2,2,2,2], flag: "🇨🇮" },
  { code: "SN", name: "Sénégal",        dial: "+221", digits: 9,  groups: [2,3,2,2],   flag: "🇸🇳" },
  { code: "BF", name: "Burkina Faso",   dial: "+226", digits: 8,  groups: [2,2,2,2],   flag: "🇧🇫" },
  { code: "ML", name: "Mali",           dial: "+223", digits: 8,  groups: [2,2,2,2],   flag: "🇲🇱" },
  { code: "NE", name: "Niger",          dial: "+227", digits: 8,  groups: [2,2,2,2],   flag: "🇳🇪" },
  { code: "GN", name: "Guinée",         dial: "+224", digits: 9,  groups: [3,2,2,2],   flag: "🇬🇳" },
  { code: "GH", name: "Ghana",          dial: "+233", digits: 9,  groups: [2,3,4],     flag: "🇬🇭" },
  { code: "NG", name: "Nigeria",        dial: "+234", digits: 10, groups: [3,3,4],     flag: "🇳🇬" },
];

export const defaultCountry = countries[0]; // Bénin

export function formatPhone(country: Country, digitsOnly: string): string {
  const d = digitsOnly.slice(0, country.digits);
  const parts: string[] = [];
  let cursor = 0;
  for (const g of country.groups) {
    if (cursor >= d.length) break;
    parts.push(d.slice(cursor, cursor + g));
    cursor += g;
  }
  return parts.join(" ");
}

export function isComplete(country: Country, digitsOnly: string): boolean {
  return digitsOnly.length === country.digits;
}

export function toE164(country: Country, digitsOnly: string): string {
  return `${country.dial}${digitsOnly}`;
}
