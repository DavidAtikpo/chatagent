"use client";

import { getWidgetScriptUrl } from "@/lib/app-url";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const SCRIPT_ID = "chatagent-widget-script";

type Props = {
  /** Clé lue côté serveur depuis layout (build Vercel). */
  embedKey?: string;
};

function resolveWidgetKey(propKey?: string): string | undefined {
  const key = (propKey || process.env.NEXT_PUBLIC_EMBED_WIDGET_KEY || "").trim();
  return key || undefined;
}

function shouldSkipWidget(pathname: string): boolean {
  if (pathname.startsWith("/dashboard")) return true;
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/c/")) return true;
  if (pathname === "/login" || pathname === "/signup" || pathname === "/integration") return true;
  return false;
}

function hideWidget() {
  const root = document.getElementById("chatbot-root");
  if (root) root.style.display = "none";
}

function showWidget() {
  const root = document.getElementById("chatbot-root");
  if (root) root.style.display = "";
}

function loadWidgetScript(widgetKey: string) {
  const api = `${window.location.origin}/api/backend`;
  const fromEnv = getWidgetScriptUrl();
  const widgetUrl = fromEnv.startsWith("http")
    ? fromEnv
    : `${window.location.origin}${process.env.NEXT_PUBLIC_WIDGET_URL || "/widget.js"}`;

  window.ChatAgentBoot = {
    key: widgetKey,
    api,
  };

  if (document.getElementById("chatbot-root")) {
    showWidget();
    return;
  }

  if (document.getElementById(SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.src = widgetUrl;
  script.async = true;
  script.setAttribute("data-key", widgetKey);
  script.setAttribute("data-api", api);
  document.body.appendChild(script);
}

export function WidgetEmbed({ embedKey }: Props) {
  const pathname = usePathname();
  const widgetKey = resolveWidgetKey(embedKey);
  const loadedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!widgetKey) {
      if (process.env.NODE_ENV === "development") {
        console.info(
          "[ChatAgent] Widget désactivé — définissez NEXT_PUBLIC_EMBED_WIDGET_KEY dans .env.local"
        );
      }
      return;
    }

    if (shouldSkipWidget(pathname)) {
      hideWidget();
      return;
    }

    showWidget();
    if (loadedKeyRef.current === widgetKey && document.getElementById("chatbot-root")) {
      return;
    }

    loadWidgetScript(widgetKey);
    loadedKeyRef.current = widgetKey;
  }, [pathname, widgetKey]);

  return null;
}
