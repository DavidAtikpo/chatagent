import { ReactNode } from "react";

/** Scroll horizontal sur mobile pour les tableaux larges. */
export function ResponsiveTable({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
      <div className="min-w-[640px]">{children}</div>
    </div>
  );
}
