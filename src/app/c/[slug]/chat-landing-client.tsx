"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    ChatAgentBoot?: {
      key: string;
      api?: string;
      trafficSlug?: string;
      autoOpen?: boolean;
      mode?: "bubble" | "page";
    };
    ChatAgent?: {
      open: () => void;
      close: () => void;
      toggle: () => void;
    };
  }
}

type Props = {
  slug: string;
  widgetKey: string;
  previewTitle?: string;
};

function ReloadButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
    >
      Recharger
    </button>
  );
}

export function ChatLandingClient({ slug, widgetKey, previewTitle }: Props) {
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "no-key">(
    widgetKey ? "loading" : "no-key"
  );
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    if (!widgetKey) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const widgetUrl = process.env.NEXT_PUBLIC_WIDGET_URL || "/widget.js";
    const SCRIPT_ID = "chatagent-widget-script";

    const onReady = () => setStatus("ready");
    const onError = (e: Event) => {
      setErrorDetail((e as CustomEvent<string>).detail ?? "Erreur de chargement");
      setStatus("error");
    };

    window.addEventListener("chatagent:ready", onReady);
    window.addEventListener("chatagent:error", onError);

    window.ChatAgentBoot = {
      key: widgetKey,
      api: apiUrl,
      trafficSlug: slug,
      autoOpen: true,
      mode: "page",
    };

    if (document.getElementById("chatbot-root")) {
      setStatus("ready");
      return () => {
        window.removeEventListener("chatagent:ready", onReady);
        window.removeEventListener("chatagent:error", onError);
      };
    }

    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = widgetUrl;
      script.async = true;
      script.setAttribute("data-key", widgetKey);
      script.setAttribute("data-api", apiUrl);
      script.setAttribute("data-traffic-slug", slug);
      script.setAttribute("data-auto-open", "true");
      script.setAttribute("data-mode", "page");

      script.onerror = () => {
        setErrorDetail("Fichier widget.js introuvable — lancez: cd widget && npm run build");
        setStatus("error");
      };

      document.body.appendChild(script);
    }

    return () => {
      window.removeEventListener("chatagent:ready", onReady);
      window.removeEventListener("chatagent:error", onError);
    };
  }, [widgetKey, slug]);

  if (status === "ready") {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
      {status === "no-key" && (
        <div className="max-w-md rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Lien incomplet : il manque la clé widget (<code>?key=...</code>). Copiez l&apos;URL depuis
          Dashboard → Liens trackés → Copier.
        </div>
      )}

      {status === "loading" && (
        <div className="w-full max-w-sm text-center">
          {previewTitle && (
            <p className="mb-2 text-base font-semibold text-slate-900">{previewTitle}</p>
          )}
          <p className="text-sm text-slate-500">Chargement du chat…</p>
          <ReloadButton />
        </div>
      )}

      {status === "error" && (
        <div className="max-w-md text-center">
          <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-medium">Chat indisponible</p>
            {errorDetail && <p className="mt-1">{errorDetail}</p>}
            <p className="mt-2 text-xs">
              1. API : <code>cd api && py -m uvicorn app.main:app --reload</code>
              <br />
              2. Widget : <code>cd widget && npm run build</code>
              <br />
              3. Redémarrez <code>npm run dev</code> dans web/
            </p>
          </div>
          <ReloadButton />
        </div>
      )}
    </div>
  );
}
