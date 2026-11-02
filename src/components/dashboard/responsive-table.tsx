import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Petit texte affiché uniquement sur mobile quand le tableau défile horizontalement */
  scrollHint?: ReactNode;
  /** Largeur minimale du contenu (défaut 640px) */
  minWidthClassName?: string;
};

/** Scroll horizontal sur mobile pour les tableaux larges. */
export function ResponsiveTable({
  children,
  scrollHint,
  minWidthClassName = "min-w-[640px]",
}: Props) {
  return (
    <div className="max-w-full">
      {scrollHint ? (
        <p className="mb-1.5 text-[11px] leading-snug text-slate-500 md:hidden">{scrollHint}</p>
      ) : null}
      <div className="w-full max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
        <div className={`inline-block min-w-full align-middle ${minWidthClassName}`}>{children}</div>
      </div>
    </div>
  );
}
