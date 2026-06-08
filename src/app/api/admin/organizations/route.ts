import { fetchPlatformOrganizations, requirePlatformAdmin } from "@/lib/platform-admin-server";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await requirePlatformAdmin();
  if (!user) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const organizations = await fetchPlatformOrganizations();
    return NextResponse.json({ organizations });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
