/** Notifications navigateur pour nouvelles demandes conseiller (dashboard web). */

export function handoffNotifySupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function handoffNotifyPermission(): NotificationPermission | "unsupported" {
  if (!handoffNotifySupported()) return "unsupported";
  return Notification.permission;
}

export async function requestHandoffNotifyPermission(): Promise<boolean> {
  if (!handoffNotifySupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function showHandoffBrowserNotification(options: {
  title: string;
  body: string;
  conversationId: string;
  onClick?: () => void;
}): void {
  if (!handoffNotifySupported() || Notification.permission !== "granted") return;

  try {
    const n = new Notification(options.title, {
      body: options.body,
      tag: `handoff-${options.conversationId}`,
      icon: "/favicon.ico",
    });
    n.onclick = () => {
      window.focus();
      options.onClick?.();
      n.close();
    };
  } catch {
    /* ignore — autoplay / permission edge cases */
  }
}

/** Petit signal sonore (onglet actif) — même idée que l'app mobile. */
export function playHandoffChime(): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => void ctx.close();
  } catch {
    /* ignore */
  }
}
