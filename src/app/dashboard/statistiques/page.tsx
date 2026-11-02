import { redirect } from "next/navigation";

/** Alias FR → page statistiques (URL canonique : /dashboard/overview). */
export default function StatistiquesRedirectPage() {
  redirect("/dashboard/overview");
}
