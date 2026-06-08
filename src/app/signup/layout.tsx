import { SITE_NAME, absoluteUrl } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer votre agent IA",
  description: `Inscrivez-vous sur ${SITE_NAME} : entrez l'URL de votre site et déployez un chatbot commercial intelligent en quelques minutes.`,
  alternates: { canonical: "/signup" },
  openGraph: {
    title: `Inscription — ${SITE_NAME}`,
    url: absoluteUrl("/signup"),
  },
  robots: { index: true, follow: true },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
