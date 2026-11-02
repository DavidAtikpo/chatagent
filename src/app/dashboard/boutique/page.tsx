import { redirect } from "next/navigation";

/** Legacy URL — boutique n'est plus proposée ; profils shop existants sont listés sous Autres. */
export default function BoutiqueLegacyRedirect() {
  redirect("/dashboard/autres");
}
