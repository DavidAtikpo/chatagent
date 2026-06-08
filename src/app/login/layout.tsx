import { SITE_NAME, absoluteUrl } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion",
  description: `Connectez-vous à votre compte ${SITE_NAME} pour gérer vos agents IA, leads et campagnes.`,
  alternates: { canonical: "/login" },
  openGraph: {
    title: `Connexion — ${SITE_NAME}`,
    url: absoluteUrl("/login"),
  },
  robots: { index: true, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
