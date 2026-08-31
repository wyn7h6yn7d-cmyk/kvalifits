"use client";

import { useState, type ReactNode } from "react";

type Props = {
  cvRef: string;
  className?: string;
  errorLabel: string;
  children: ReactNode;
};

/**
 * Opens a private CV via a short-lived signed URL. Never uses a public Storage URL.
 */
export function PrivateCvOpenLink({ cvRef, className, errorLabel, children }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onOpen() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/resumes/signed-url?path=${encodeURIComponent(cvRef)}`);
      const json = (await res.json().catch(() => ({}))) as { signedUrl?: string; error?: string };
      if (!res.ok || !json.signedUrl) {
        setError(errorLabel);
        return;
      }
      window.open(json.signedUrl, "_blank", "noopener,noreferrer");
    } catch {
      setError(errorLabel);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={() => void onOpen()} disabled={busy} className={className}>
        {children}
      </button>
      {error ? <span className="text-xs text-muted-2">{error}</span> : null}
    </span>
  );
}
