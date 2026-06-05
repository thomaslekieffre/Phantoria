"use client";

export type ToastVariant = "success" | "error" | "info" | "reward";

export type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

const VARIANT_LABEL: Record<ToastVariant, string> = {
  success: "OK",
  error: "Erreur",
  info: "Info",
  reward: "Récompense",
};

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.variant}`}>
          <span className="toast__tag">{VARIANT_LABEL[t.variant]}</span>
          <p className="toast__msg">{t.message}</p>
          <button type="button" className="toast__close" aria-label="Fermer" onClick={() => onDismiss(t.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
