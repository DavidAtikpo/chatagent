import { ReactNode } from "react";

/** Scroll horizontal sur mobile pour les tableaux larges. */
export function ResponsiveTable({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 sm:mx-0 sm:px-0">
      <div className="min-w-[640px]">{children}</div>
    </div>
  );
}
