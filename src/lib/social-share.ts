import { copyToClipboard } from "@/lib/copy-to-clipboard";

export type SocialShareNetwork =
  | "whatsapp"
  | "facebook"
  | "linkedin"
  | "instagram"
  | "threads";

export function absoluteShareUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (typeof window !== "undefined" && window.location?.origin) {
    const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return `${window.location.origin}${path}`;
  }
  return trimmed;
}

export function buildShareText(message: string, url: string): string {
  const absolute = absoluteShareUrl(url);
  return message.trim() ? `${message.trim()}\n${absolute}` : absolute;
}

export function buildSocialShareUrl(
  network: SocialShareNetwork,
  url: string,
  message: string
): string | null {
  const absolute = absoluteShareUrl(url);
  const text = buildShareText(message, absolute);
  switch (network) {
    case "whatsapp":
      return `https://wa.me/?text=${encodeURIComponent(text)}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(absolute)}&display=popup`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(absolute)}`;
    case "threads":
      return `https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`;
    case "instagram":
      return null;
    default:
      return null;
  }
}

export const SOCIAL_SHARE_NETWORKS: SocialShareNetwork[] = [
  "whatsapp",
  "facebook",
  "linkedin",
  "instagram",
  "threads",
];

export type SocialShareNoticeKey =
  | "dashboard.links.shareInstagramCopied"
  | "dashboard.links.shareInstagramShared"
  | "dashboard.links.shareFacebookCopied"
  | "dashboard.links.shareFacebookUrlOnly"
  | "dashboard.links.shareCopyFailed"
  | "dashboard.links.shareInstagramPopupBlocked"
  | "dashboard.links.shareInstagramDialog";

export async function openSocialShare(
  network: SocialShareNetwork,
  url: string,
  message: string
): Promise<{ ok: boolean; noticeKey?: SocialShareNoticeKey }> {
  const absolute = absoluteShareUrl(url);
  const text = buildShareText(message, absolute);

  if (network === "instagram") {
    return { ok: true, noticeKey: "dashboard.links.shareInstagramDialog" };
  }

  if (network === "facebook") {
    const href = buildSocialShareUrl(network, absolute, message);
    if (href) {
      window.open(href, "_blank", "noopener,noreferrer,width=600,height=640");
    }
    const copied = await copyToClipboard(text);
    if (!copied) {
      return { ok: Boolean(href), noticeKey: "dashboard.links.shareFacebookUrlOnly" };
    }
    return { ok: true, noticeKey: "dashboard.links.shareFacebookCopied" };
  }

  const href = buildSocialShareUrl(network, absolute, message);
  if (!href) return { ok: false };
  window.open(href, "_blank", "noopener,noreferrer,width=600,height=640");
  return { ok: true };
}
