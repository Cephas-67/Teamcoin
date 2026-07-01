import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { countries, defaultCountry, formatPhone, isComplete, toE164, type Country } from "../data/countries";

type Props = {
  value?: string;        // E.164 ex. "+22901234567"
  onChange: (e164: string, complete: boolean) => void;
  autoFocus?: boolean;
  label?: string;
  placeholder?: string;
};

// Composant qui prend l'indicatif + le numéro local, formaté en direct.
// L'utilisateur ne peut saisir que des chiffres, le placeholder montre le format.
export function PhoneInput({ value, onChange, autoFocus, label, placeholder }: Props) {
  const [country, setCountry] = useState<Country>(() => guessCountry(value) ?? defaultCountry);
  const [digits, setDigits] = useState(() => extractDigits(value, country));
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onChange(toE164(country, digits), isComplete(country, digits));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, digits]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, country.digits);
    setDigits(onlyDigits);
  };

  const placeholderFormatted = country.groups.map((g) => "0".repeat(g)).join(" ");

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium mb-2">{label}</label>}
      <div ref={wrapRef} className="relative flex items-stretch h-12 rounded-md border border-border bg-bg overflow-visible focus-within:border-accent transition-colors">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 pl-3 pr-2 text-sm font-medium hover:bg-surface-2 transition-colors rounded-l-md border-r border-border"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={`fi fi-${country.code.toLowerCase()} inline-block w-5 h-4 rounded-sm`} />
          <span className="text-text">{country.dial}</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted" />
        </button>

        <input
          type="tel"
          inputMode="numeric"
          autoFocus={autoFocus}
          value={formatPhone(country, digits)}
          onChange={handleInput}
          placeholder={placeholder ?? placeholderFormatted}
          className="flex-1 min-w-0 px-3 bg-transparent text-sm tabular-nums focus:outline-none placeholder:text-muted"
          aria-label="Numéro de téléphone"
        />

        {open && (
          <ul
            role="listbox"
            className="absolute top-full left-0 mt-1 w-72 max-h-72 overflow-y-auto bg-surface border border-border rounded-md shadow-lg z-50"
          >
            {countries.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => { setCountry(c); setDigits(""); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-surface-2 transition-colors"
                >
                  <span className={`fi fi-${c.code.toLowerCase()} inline-block w-5 h-4 rounded-sm`} />
                  <span className="flex-1 text-left">{c.name}</span>
                  <span className="text-muted font-mono text-xs">{c.dial}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-1.5 text-xs text-muted">
        Format attendu : {country.dial} {placeholderFormatted}
      </p>
    </div>
  );
}

function guessCountry(e164: string | undefined): Country | null {
  if (!e164) return null;
  return countries.find((c) => e164.startsWith(c.dial)) ?? null;
}

function extractDigits(e164: string | undefined, country: Country): string {
  if (!e164) return "";
  if (!e164.startsWith(country.dial)) return "";
  return e164.slice(country.dial.length).replace(/\D/g, "").slice(0, country.digits);
}
