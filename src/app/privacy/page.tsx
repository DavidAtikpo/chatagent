import { SAAS_NAME } from "@/lib/branding";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Politique de confidentialité — ${SAAS_NAME}`,
  description:
    "Politique de confidentialité de l'application ChatAgent Conseiller et de la plateforme ChatAgent.",
};

const LAST_UPDATED = "12 juin 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/"
          className="text-sm text-[#D4A83A] hover:underline"
        >
          ← Retour à l&apos;accueil
        </Link>

        <h1 className="mt-8 text-3xl font-bold text-[#D4A83A]">
          Politique de confidentialité
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Dernière mise à jour : {LAST_UPDATED}
        </p>

        <div className="prose prose-invert mt-10 max-w-none space-y-8 text-neutral-200">
          <section>
            <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
            <p>
              La présente politique décrit comment <strong>{SAAS_NAME}</strong> (« nous »)
              traite les données personnelles dans le cadre de la plateforme SaaS {SAAS_NAME}
              (dashboard web, widget de chat) et de l&apos;application mobile{" "}
              <strong>ChatAgent Conseiller</strong> (« l&apos;Application »).
            </p>
            <p>
              L&apos;Application est réservée aux conseillers et propriétaires de compte
              invités par une organisation cliente. Elle n&apos;est pas destinée au grand
              public.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">2. Responsable du traitement</h2>
            <p>
              Le responsable du traitement est l&apos;éditeur de la plateforme {SAAS_NAME}.
              Pour toute question : contactez l&apos;administrateur de votre compte
              organisation ou l&apos;équipe support via votre dashboard.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">3. Données collectées</h2>
            <h3 className="text-lg font-medium text-[#E8C96A]">Application mobile Conseiller</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Adresse e-mail et identifiant de compte</strong> — authentification
                (Supabase Auth).
              </li>
              <li>
                <strong>Token de notification push (FCM)</strong> — alertes lorsqu&apos;un
                visiteur demande à parler à un conseiller.
              </li>
              <li>
                <strong>Messages de conversation</strong> — contenus échangés avec les
                visiteurs du site web lors d&apos;un transfert humain (handoff).
              </li>
              <li>
                <strong>Données d&apos;usage</strong> — statistiques agrégées pour les
                propriétaires de compte (conversations, leads, clics sur liens trackés).
              </li>
            </ul>
            <h3 className="mt-6 text-lg font-medium text-[#E8C96A]">Ce que nous ne collectons pas</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>Localisation GPS précise</li>
              <li>Contacts du téléphone</li>
              <li>Photos, caméra ou microphone (hors saisie clavier dans le chat)</li>
              <li>Identifiant publicitaire (pas de publicité dans l&apos;app)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">4. Finalités</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>Permettre aux conseillers de répondre aux clients en direct</li>
              <li>Envoyer des notifications push pour les demandes urgentes</li>
              <li>Afficher les statistiques au propriétaire du compte</li>
              <li>Assurer la sécurité et la maintenance du service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">5. Base légale</h2>
            <p>
              Le traitement repose sur l&apos;exécution du contrat entre {SAAS_NAME} et
              l&apos;organisation cliente, ainsi que sur l&apos;intérêt légitime à assurer
              le bon fonctionnement du service de messagerie professionnelle.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">6. Partage des données</h2>
            <p>Nous ne vendons pas vos données. Elles peuvent être traitées par :</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Supabase</strong> — hébergement base de données et authentification
                (UE / conformité RGPD).
              </li>
              <li>
                <strong>Google Firebase Cloud Messaging</strong> — envoi des notifications
                push sur l&apos;appareil du conseiller.
              </li>
              <li>
                <strong>Hébergeurs API</strong> — traitement des requêtes de l&apos;application
                (chiffrement HTTPS).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">7. Conservation</h2>
            <p>
              Les données sont conservées tant que le compte organisation est actif. Les
              conversations et messages sont conservés selon la politique de l&apos;organisation
              cliente. Vous pouvez demander la suppression via l&apos;administrateur de votre
              compte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">8. Sécurité</h2>
            <p>
              Les échanges entre l&apos;application et nos serveurs sont chiffrés (TLS/HTTPS).
              L&apos;accès aux données est restreint par authentification et politiques de
              sécurité au niveau base de données (RLS).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">9. Vos droits (RGPD)</h2>
            <p>
              limitation, d&apos;opposition et de portabilité. Pour les exercer, contactez
              l&apos;administrateur de votre organisation ou{" "}
              <Link href="/delete-account" className="text-[#D4A83A] hover:underline">
                demandez la suppression de votre compte
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">10. Permissions Android</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Internet</strong> — communication avec les serveurs
              </li>
              <li>
                <strong>Notifications</strong> — alertes de transfert client (demande
                explicite sur Android 13+)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">11. Modifications</h2>
            <p>
              Nous pouvons mettre à jour cette politique. La date de dernière mise à jour
              figure en haut de cette page.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
