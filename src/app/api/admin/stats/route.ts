import { fetchPlatformStats, requirePlatformAdmin } from "@/lib/platform-admin-server";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await requirePlatformAdmin();
  if (!user) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const stats = await fetchPlatformStats();
    return NextResponse.json({ stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
