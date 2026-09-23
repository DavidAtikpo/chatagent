import type { ReactNode } from "react";

/** Pages légales (confidentialité, suppression de compte). */
export function LegalPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#0A0A0A] text-[#F5F5F5]">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">{children}</div>
    </main>
  );
}
