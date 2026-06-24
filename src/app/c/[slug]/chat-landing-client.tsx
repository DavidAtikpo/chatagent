"use client";

import { useT } from "@/i18n/context";
import { getDisplayApiHealthUrl } from "@/lib/render-api";
import { useEffect, useState } from "react";

type Props = {
  slug: string;
  widgetKey: string;
  previewTitle?: string;
  primaryColor?: string;
};

const DEFAULT_PRIMARY = "#C9922A";

function ReloadButton({ primaryColor }: { primaryColor?: string }) {
  const t = useT();
  const color = primaryColor || DEFAULT_PRIMARY;

  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:brightness-95 active:brightness-90"
      style={{ backgroundColor: color }}
    >
      {t("chatLanding.reload")}
    </button>
  );
}

export function ChatLandingClient({ slug, widgetKey, previewTitle, primaryColor }: Props) {
  const t = useT();
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "no-key">(
    widgetKey ? "loading" : "no-key"
  );
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const apiHealthUrl = getDisplayApiHealthUrl();

  useEffect(() => {
    if (!widgetKey) return;

    const apiUrl = `${window.location.origin}/api/backend`;
    const widgetUrl =
      process.env.NEXT_PUBLIC_WIDGET_URL?.startsWith("http")
        ? process.env.NEXT_PUBLIC_WIDGET_URL
        : `${window.location.origin}${process.env.NEXT_PUBLIC_WIDGET_URL || "/widget.js"}`;
    const SCRIPT_ID = "chatagent-widget-script";

    const onReady = () => setStatus("ready");
    const onError = (e: Event) => {
      setErrorDetail((e as CustomEvent<string>).detail ?? t("chatLanding.loadError"));
      setStatus("error");
    };

    window.addEventListener("chatagent:ready", onReady);
    window.addEventListener("chatagent:error", onError);

    const visitKey = `chatagent_visit_${widgetKey}_${slug}`;
    if (!sessionStorage.getItem(visitKey)) {
      sessionStorage.setItem(visitKey, "1");
      fetch(`${apiUrl}/widget/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widget_key: widgetKey,
          event_type: "open",
          placement: "dock",
          page_url: window.location.href,
          traffic_slug: slug,
        }),
        keepalive: true,
      }).catch(() => {});
    }

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
        setErrorDetail(t("chatLanding.widgetMissing"));
        setStatus("error");
      };

      document.body.appendChild(script);
    }

    return () => {
      window.removeEventListener("chatagent:ready", onReady);
      window.removeEventListener("chatagent:error", onError);
    };
  }, [widgetKey, slug, t]);

  if (status === "ready") {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
      {status === "no-key" && (
        <div className="max-w-md rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {t("chatLanding.missingKey")}
        </div>
      )}

      {status === "loading" && (
        <div className="w-full max-w-sm text-center">
          {previewTitle && (
            <p className="mb-2 text-base font-semibold text-slate-900">{previewTitle}</p>
          )}
          <p className="text-sm text-slate-500">{t("chatLanding.loading")}</p>
          <ReloadButton primaryColor={primaryColor} />
        </div>
      )}

      {status === "error" && (
        <div className="max-w-md text-center">
          <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-medium">{t("chatLanding.unavailable")}</p>
            {errorDetail && <p className="mt-1">{errorDetail}</p>}
            <p className="mt-2 text-xs text-amber-800/80">
              {t("chatLanding.apiCheck")}{" "}
              <code className="break-all">{apiHealthUrl}</code>
              <br />
              {t("chatLanding.freePlanHint")}
            </p>
          </div>
          <ReloadButton primaryColor={primaryColor} />
        </div>
      )}
    </div>
  );
}
