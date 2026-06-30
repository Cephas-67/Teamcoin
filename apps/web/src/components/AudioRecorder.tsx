import { useRef, useState } from "react";
import { Mic, Square, Trash2 } from "lucide-react";
import { Button } from "./Button";
import { toast } from "sonner";

type Props = {
  onRecorded: (blob: Blob) => void;
};

export function AudioRecorder({ onRecorded }: Props) {
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<number | null>(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        const b = new Blob(chunks, { type: "audio/webm" });
        setBlob(b);
        onRecorded(b);
        stream.getTracks().forEach((t) => t.stop());
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
      setDuration(0);
      intervalRef.current = window.setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      toast.error("Accès micro refusé");
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const reset = () => {
    setBlob(null);
    setDuration(0);
  };

  return (
    <div className="space-y-3">
      {!blob && !recording && (
        <Button variant="primary" onClick={start}>
          <Mic className="w-4 h-4" />
          Démarrer l'enregistrement
        </Button>
      )}

      {recording && (
        <div className="flex items-center gap-3">
          <Button variant="danger" onClick={stop}>
            <Square className="w-4 h-4" />
            Arrêter
          </Button>
          <span className="inline-flex items-center gap-2 text-sm text-danger">
            <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
            {String(Math.floor(duration / 60)).padStart(2, "0")}:{String(duration % 60).padStart(2, "0")}
          </span>
        </div>
      )}

      {blob && !recording && (
        <div className="space-y-3">
          <audio controls src={URL.createObjectURL(blob)} className="w-full" />
          <Button variant="outline" size="sm" onClick={reset}>
            <Trash2 className="w-3.5 h-3.5" />
            Recommencer
          </Button>
        </div>
      )}
    </div>
  );
}
