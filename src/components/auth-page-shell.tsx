import type { ReactNode } from "react";

/** Conteneur commun des pages login / signup / mot de passe. */
export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full max-w-[100vw] items-center justify-center overflow-x-hidden bg-gradient-to-b from-brand-50 to-slate-50 px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

export function AuthPageCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-full rounded-2xl bg-white p-6 shadow-sm sm:p-8">{children}</div>
  );
}
