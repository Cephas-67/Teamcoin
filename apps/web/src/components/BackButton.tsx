import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Props = {
  fallback?: string;
  label?: string;
};

// Back button universel · navigate(-1) si historique dispo, sinon fallback.
// Toujours positionné à gauche par convention (mobile-first thumb zone).
export function BackButton({ fallback = "/", label = "Retour" }: Props) {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className="flex items-center justify-center gap-2 rounded-2xl bg-gandehou-green px-8 py-3.5 text-lg font-medium text-white transition-colors duration-300 hover:bg-gandehou-green/90"
    >
      <ArrowLeft className="w-4 h-4" />
      <span className="hidden md:flex">{label}</span>
    </button>
  );
}
