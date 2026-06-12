import type { Metadata } from "next";
import { SAAS_NAME } from "@/lib/branding";
import { DeleteAccountForm } from "./delete-account-form";

export const metadata: Metadata = {
  title: `Suppression de compte — ${SAAS_NAME}`,
  description:
    "Demandez la suppression de votre compte ChatAgent et des données associées (app mobile et dashboard).",
};

export default function DeleteAccountPage() {
  return <DeleteAccountForm />;
}
