import { getTrafficLinkPreview } from "@/lib/traffic-link-preview";
import type { Metadata } from "next";
import { ChatLandingClient } from "./chat-landing-client";

type PageProps = {
  params: { slug: string };
  searchParams: { key?: string };
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const preview = await getTrafficLinkPreview(params.slug, searchParams.key ?? "");
  const title = preview?.title ?? "Chat";
  const description = preview?.description ?? "Discutez avec notre assistant en ligne.";
  const image = preview?.imageUrl ?? undefined;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "website",
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: title }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ChatLandingPage({ params, searchParams }: PageProps) {
  const preview = await getTrafficLinkPreview(params.slug, searchParams.key ?? "");

  return (
    <ChatLandingClient
      slug={params.slug}
      widgetKey={searchParams.key ?? ""}
      previewTitle={preview?.title}
      primaryColor={preview?.primaryColor}
    />
  );
}
