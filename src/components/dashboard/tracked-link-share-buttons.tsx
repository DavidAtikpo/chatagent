"use client";

import { InstagramShareDialog } from "@/components/dashboard/instagram-share-dialog";
import {
  IconFacebook,
  IconInstagram,
  IconLinkedIn,
  IconThreads,
  IconWhatsApp,
} from "@/components/dashboard/social-network-icons";
import { useT } from "@/i18n/context";
import { copyToClipboard } from "@/lib/copy-to-clipboard";
import {
  absoluteShareUrl,
  buildShareText,
  openSocialShare,
  SOCIAL_SHARE_NETWORKS,
  type SocialShareNetwork,
  type SocialShareNoticeKey,
} from "@/lib/social-share";
import { useState, type ReactNode } from "react";

const NETWORK_STYLE: Record<SocialShareNetwork, string> = {
  whatsapp: "bg-[#25D366] hover:bg-[#1fb855] text-white",
  facebook: "bg-[#1877F2] hover:bg-[#166fe0] text-white",
  linkedin: "bg-[#0A66C2] hover:bg-[#0958a8] text-white",
  instagram:
    "bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] hover:opacity-95 text-white",
  threads: "bg-[#101010] hover:bg-[#2a2a2a] text-white",
};

const NETWORK_ICON: Record<SocialShareNetwork, (props: { className?: string }) => ReactNode> = {
  whatsapp: IconWhatsApp,
  facebook: IconFacebook,
  linkedin: IconLinkedIn,
  instagram: IconInstagram,
  threads: IconThreads,
};

type Props = {
  url: string;
  shareMessage?: string;
  compact?: boolean;
  inline?: boolean;
};

export function TrackedLinkShareButtons({ url, shareMessage, compact, inline }: Props) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [instagramOpen, setInstagramOpen] = useState(false);
  const message = shareMessage ?? t("dashboard.links.shareDefaultMessage");
  const shareUrl = absoluteShareUrl(url);
  const shareText = buildShareText(message, shareUrl);

  async function copyUrl() {
    const ok = await copyToClipboard(shareUrl);
    setCopied(ok);
    if (!ok) setNotice(t("dashboard.links.shareCopyFailed"));
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare(network: SocialShareNetwork) {
    setNotice(null);
    if (network === "instagram") {
      setInstagramOpen(true);
      return;
    }
    const result = await openSocialShare(network, shareUrl, message);
    if (result.noticeKey && result.noticeKey !== "dashboard.links.shareInstagramDialog") {
      setNotice(t(result.noticeKey as SocialShareNoticeKey));
    }
    if (!result.ok && !result.noticeKey) {
      setNotice(t("dashboard.links.shareCopyFailed"));
    }
  }

  const iconSize = inline ? "h-4 w-4" : "h-5 w-5";
  const btnSize = inline
    ? "inline-flex h-8 w-8 items-center justify-center rounded-full"
    : "inline-flex h-10 w-10 items-center justify-center rounded-full";

  return (
    <>
      <div className={inline ? "min-w-0 max-w-full" : compact ? "space-y-2" : "space-y-3"}>
        {!inline ? (
          <p className="text-xs font-medium text-slate-700">{t("dashboard.links.shareOn")}</p>
        ) : null}
        <div className="flex flex-wrap gap-1.5">
          {SOCIAL_SHARE_NETWORKS.map((network) => {
            const Icon = NETWORK_ICON[network];
            const label = t(`dashboard.links.shareNetworks.${network}`);
            return (
              <button
                key={network}
                type="button"
                title={label}
                aria-label={label}
                onClick={() => void handleShare(network)}
                className={`${btnSize} shadow-sm transition ${NETWORK_STYLE[network]}`}
              >
                <Icon className={iconSize} />
              </button>
            );
          })}
        </div>
        {notice ? (
          <p className="mt-1 text-[10px] leading-snug text-slate-700" role="status">
            {notice}
          </p>
        ) : null}
        {!inline ? (
          <div className="flex flex-wrap items-center gap-2">
            <code className="max-w-full truncate rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-700">
              {shareUrl}
            </code>
            <button
              type="button"
              onClick={() => void copyUrl()}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {copied ? t("dashboard.links.copied") : t("dashboard.links.copyUrl")}
            </button>
          </div>
        ) : null}
      </div>
      <InstagramShareDialog
        open={instagramOpen}
        shareText={shareText}
        onClose={() => setInstagramOpen(false)}
      />
    </>
  );
}

export function TrackedLinkSharePanel({
  url,
  onContinue,
  continueLabel,
}: {
  url: string;
  onContinue?: () => void;
  continueLabel?: string;
}) {
  const t = useT();

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-4">
      <p className="text-sm font-semibold text-emerald-950">{t("dashboard.links.sharePanelTitle")}</p>
      <p className="mt-1 text-sm text-emerald-900/90">{t("dashboard.links.sharePanelHint")}</p>
      <div className="mt-3">
        <TrackedLinkShareButtons url={url} />
      </div>
      {onContinue ? (
        <button
          type="button"
          onClick={onContinue}
          className="mt-4 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          {continueLabel ?? t("dashboard.links.shareContinue")}
        </button>
      ) : null}
    </div>
  );
}
