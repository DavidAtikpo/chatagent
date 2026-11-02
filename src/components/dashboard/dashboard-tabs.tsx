"use client";

import { useId, useState } from "react";

type Tab<T extends string> = {
  id: T;
  label: string;
};

type Props<T extends string> = {
  tabs: Tab<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
};

export function DashboardTabs<T extends string>({
  tabs,
  active,
  onChange,
  className = "",
}: Props<T>) {
  return (
    <div
      className={`flex w-full gap-0.5 overflow-x-auto rounded-md bg-slate-100 p-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={
              selected
                ? "min-w-[5.5rem] flex-1 rounded px-2 py-1.5 text-center text-xs font-semibold text-slate-900 shadow-sm bg-white sm:min-w-0"
                : "min-w-[5.5rem] flex-1 rounded px-2 py-1.5 text-center text-xs font-medium text-slate-600 hover:text-slate-900 sm:min-w-0"
            }
          >
            <span className="block truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function PanelChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DashboardPanel({
  title,
  description,
  action,
  headerExtra,
  children,
  className = "",
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Bloc sous le titre (ex. métadonnées compactes) — pleine largeur */
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Fermé par défaut ; ouverture au clic sur l'en-tête */
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const showBody = !collapsible || open;

  return (
    <section className={`rounded-lg border border-slate-200 bg-white ${className}`}>
      <div
        className={`flex flex-wrap items-start justify-between gap-1.5 px-3 py-2 ${
          showBody ? "border-b border-slate-100" : ""
        }`}
      >
        {collapsible ? (
          <button
            type="button"
            id={`${panelId}-trigger`}
            aria-expanded={open}
            aria-controls={`${panelId}-body`}
            onClick={() => setOpen((v) => !v)}
            className="flex min-w-0 flex-1 items-start gap-2 rounded-md text-left hover:bg-slate-50/80 -mx-1 px-1 py-0.5"
          >
            <PanelChevron open={open} />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
              {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
            </div>
          </button>
        ) : (
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
        )}
        {action ? (
          <div
            className="w-full min-w-0 basis-full sm:w-auto sm:basis-auto sm:shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {action}
          </div>
        ) : null}
        {headerExtra ? <div className="w-full min-w-0 basis-full">{headerExtra}</div> : null}
      </div>
      {showBody ? (
        <div id={`${panelId}-body`} role="region" aria-labelledby={`${panelId}-trigger`} className="p-3">
          {children}
        </div>
      ) : null}
    </section>
  );
}

export function StatGrid({
  items,
  equalCells = false,
  className = "",
}: {
  items: { label: string; value: string | number; hint?: string; highlight?: boolean }[];
  /** Même typo pour toutes les cartes (évite une tuile « Statut » trop dominante sur mobile). */
  equalCells?: boolean;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-2 gap-1.5 sm:grid-cols-4 ${className}`.trim()}>
      {items.map((item) => {
        const highlighted = item.highlight && !equalCells;
        return (
          <div
            key={item.label}
            className={
              highlighted
                ? "rounded-md bg-brand-50 p-2 ring-1 ring-brand-100"
                : item.highlight && equalCells
                  ? "rounded-md bg-brand-50/80 p-2 ring-1 ring-brand-100/80"
                  : "rounded-md bg-slate-50 p-2"
            }
          >
            <p
              className={`text-[11px] font-medium sm:text-xs ${
                item.highlight ? "text-brand-800" : "text-slate-500"
              }`}
            >
              {item.label}
            </p>
            <p
              className={
                equalCells
                  ? `mt-0.5 text-base font-semibold ${
                      item.highlight ? "text-brand-900" : "text-slate-900"
                    }`
                  : `mt-0.5 text-base font-semibold sm:text-xl sm:font-bold ${
                      item.highlight ? "text-brand-900" : "text-slate-900"
                    }`
              }
            >
              {item.value}
            </p>
            {item.hint ? (
              <p
                className={`mt-0.5 text-[10px] leading-snug sm:text-[11px] ${
                  item.highlight ? "text-brand-700/80" : "text-slate-400"
                }`}
              >
                {item.hint}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
