"use client";

import { getWidgetScriptUrl } from "@/lib/app-url";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SCRIPT_ID = "chatagent-widget-script";
/** Démo sur le site marketing ChatAgent uniquement — pas pour les clients. */
const WIDGET_KEY = process.env.NEXT_PUBLIC_EMBED_WIDGET_KEY?.trim();

/** Chemins sans bulle (dashboard, pages chat dédiées, auth). */
function shouldSkipWidget(pathname: string | null): boolean {
  if (!pathname) return true;
  if (pathname.startsWith("/dashboard")) return true;
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/c/")) return true;
  if (pathname === "/login" || pathname === "/signup" || pathname === "/integration") return true;
  return false;
}

export function WidgetEmbed() {
  const pathname = usePathname();

  useEffect(() => {
    if (!WIDGET_KEY || shouldSkipWidget(pathname)) return;
    if (document.getElementById("chatbot-root")) return;

    const api = `${window.location.origin}/api/backend`;
    const fromEnv = getWidgetScriptUrl();
    const widgetUrl = fromEnv.startsWith("http")
      ? fromEnv
      : `${window.location.origin}${process.env.NEXT_PUBLIC_WIDGET_URL || "/widget.js"}`;

    window.ChatAgentBoot = {
      key: WIDGET_KEY,
      api,
    };

    if (document.getElementById(SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = widgetUrl;
    script.async = true;
    script.setAttribute("data-key", WIDGET_KEY);
    script.setAttribute("data-api", api);
    document.body.appendChild(script);

    return () => {
      script.remove();
      delete window.ChatAgentBoot;
    };
  }, [pathname]);

  return null;
}
