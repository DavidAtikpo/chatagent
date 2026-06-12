"use client";

import { SAAS_NAME } from "@/lib/branding";
import { accountDeletionMailto, getSupportEmail } from "@/lib/support";
import Link from "next/link";
import { useState } from "react";

export function DeleteAccountForm() {
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");
  const supportEmail = getSupportEmail();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    window.location.href = accountDeletionMailto(email.trim(), details.trim());
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="text-sm text-[#D4A83A] hover:underline">
          ← Retour à l&apos;accueil
        </Link>

        <h1 className="mt-8 text-3xl font-bold text-[#D4A83A]">
          Suppression de compte et des données
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          {SAAS_NAME} — application ChatAgent Conseiller et dashboard web
        </p>

        <div className="mt-10 space-y-8 text-neutral-200">
          <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
            <h2 className="text-lg font-semibold text-white">Comment demander la suppression</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm">
              <li>Remplissez le formulaire ci-dessous ou envoyez un e-mail à {supportEmail}.</li>
              <li>Indiquez l&apos;e-mail utilisé pour vous connecter.</li>
              <li>
                Précisez si la demande concerne l&apos;app mobile <strong>ChatAgent Conseiller</strong>,
                le dashboard web, ou les deux.
              </li>
              <li>Nous traitons la demande sous <strong>30 jours</strong> et confirmons par e-mail.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Données supprimées</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm">
              <li>Compte utilisateur (authentification)</li>
              <li>Profil conseiller et appartenance à l&apos;organisation</li>
              <li>Token de notification push (app mobile)</li>
              <li>Messages envoyés en tant que conseiller (selon politique de l&apos;organisation)</li>
            </ul>
            <p className="mt-3 text-sm text-neutral-400">
              Les données de conversation côté visiteur peuvent être conservées par l&apos;entreprise
              cliente conformément à ses obligations légales. Le propriétaire du compte organisation
              peut aussi retirer un conseiller depuis le dashboard sans supprimer l&apos;organisation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Conseillers invités</h2>
            <p className="mt-2 text-sm">
              Si vous êtes conseiller invité par une entreprise, vous pouvez aussi demander au
              propriétaire du compte de vous retirer depuis{" "}
              <strong>Dashboard → Conseillers</strong>. Pour une suppression complète de vos
              données personnelles, utilisez ce formulaire.
            </p>
          </section>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6"
          >
            <h2 className="text-lg font-semibold text-white">Formulaire de demande</h2>
            <div>
              <label className="block text-sm font-medium text-neutral-300">
                E-mail du compte à supprimer
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-[#D4A83A]"
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300">
                Précisions (optionnel)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-[#D4A83A]"
                placeholder="App mobile, dashboard, les deux…"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-[#D4A83A] py-3 text-sm font-semibold text-[#0A0A0A] hover:bg-[#E8C96A]"
            >
              Envoyer la demande par e-mail
            </button>
            <p className="text-xs text-neutral-500">
              Ouvre votre client mail avec un message prérempli à {supportEmail}.
            </p>
          </form>

          <p className="text-sm text-neutral-400">
            <Link href="/privacy" className="text-[#D4A83A] hover:underline">
              Politique de confidentialité
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
