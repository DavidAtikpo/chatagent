"use client";

import {
  handoffNotifyPermission,
  handoffNotifySupported,
  playHandoffChime,
  requestHandoffNotifyPermission,
  showHandoffBrowserNotification,
} from "@/lib/browser-handoff-notify";
import { useT } from "@/i18n/context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type PendingRow = {
  id: string;
  site_name?: string;
  handoff_requested_at?: string | null;
  updated_at?: string;
};

type HandoffAlertContextValue = {
  pendingCount: number;
  notifyPermission: NotificationPermission | "unsupported";
  requestNotifications: () => Promise<boolean>;
};

const HandoffAlertContext = createContext<HandoffAlertContextValue | null>(null);

export function useHandoffAlerts() {
  return useContext(HandoffAlertContext);
}

const POLL_MS = 12_000;

export function HandoffAlertProvider({ children }: { children: ReactNode }) {
  const t = useT();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const [banner, setBanner] = useState<{ id: string; title: string; body: string } | null>(null);
  const [notifyPermission, setNotifyPermission] = useState<NotificationPermission | "unsupported">(
    "unsupported"
  );

  const knownPendingRef = useRef<Record<string, string>>({});
  const initializedRef = useRef(false);

  useEffect(() => {
    setNotifyPermission(handoffNotifyPermission());
  }, []);

  const requestNotifications = useCallback(async () => {
    const ok = await requestHandoffNotifyPermission();
    setNotifyPermission(handoffNotifyPermission());
    return ok;
  }, []);

  const alertForConversation = useCallback(
    (conv: PendingRow) => {
      const site = conv.site_name ?? t("dashboard.overview.siteFallback");
      const title = t("dashboard.inbox.alertTitle");
      const body = t("dashboard.inbox.alertBody", { site });

      setBanner({ id: conv.id, title, body });

      if (document.visibilityState === "visible") {
        playHandoffChime();
      }

      showHandoffBrowserNotification({
        title,
        body,
        conversationId: conv.id,
        onClick: () => {
          router.push(`/dashboard/conversations/${conv.id}`);
        },
      });
    },
    [router, t]
  );

  const pollInbox = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/inbox", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { pending?: PendingRow[] };
      const pending = json.pending ?? [];
      setPendingCount(pending.length);

      const pendingAt: Record<string, string> = {};
      for (const row of pending) {
        pendingAt[row.id] = row.handoff_requested_at ?? row.updated_at ?? "new";
      }

      if (!initializedRef.current) {
        knownPendingRef.current = pendingAt;
        initializedRef.current = true;
        return;
      }

      const prev = knownPendingRef.current;
      for (const row of pending) {
        const ts = pendingAt[row.id];
        if (prev[row.id] === undefined || prev[row.id] !== ts) {
          if (Object.keys(prev).length > 0) {
            if (notifyPermission === "default" && handoffNotifySupported()) {
              await requestHandoffNotifyPermission();
              setNotifyPermission(handoffNotifyPermission());
            }
            alertForConversation(row);
          }
        }
      }
      knownPendingRef.current = pendingAt;
    } catch {
      /* réseau / session */
    }
  }, [alertForConversation, notifyPermission]);

  useEffect(() => {
    void pollInbox();
    const id = window.setInterval(() => void pollInbox(), POLL_MS);
    return () => window.clearInterval(id);
  }, [pollInbox]);

  return (
    <HandoffAlertContext.Provider value={{ pendingCount, notifyPermission, requestNotifications }}>
      {banner ? (
        <div
          className="fixed inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top))] z-[190] px-3 pt-2 lg:top-12 lg:pl-[calc(4.5rem+0.75rem)]"
          role="status"
        >
          <div className="mx-auto flex max-w-6xl items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 shadow-md ring-1 ring-blue-100">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-blue-950">{banner.title}</p>
              <p className="mt-0.5 text-xs text-blue-900">{banner.body}</p>
              <Link
                href={`/dashboard/conversations/${banner.id}`}
                className="mt-2 inline-block text-xs font-semibold text-brand-700 hover:underline"
                onClick={() => setBanner(null)}
              >
                {t("dashboard.inbox.alertOpen")} →
              </Link>
            </div>
            <button
              type="button"
              className="shrink-0 rounded p-1 text-blue-800 hover:bg-blue-100"
              aria-label={t("dashboard.inbox.alertDismiss")}
              onClick={() => setBanner(null)}
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
      {children}
    </HandoffAlertContext.Provider>
  );
}
