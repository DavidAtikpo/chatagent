"use client";

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
      className={`flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 ${className}`}
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
                ? "shrink-0 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm"
                : "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function DashboardPanel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function StatGrid({
  items,
}: {
  items: { label: string; value: string | number; hint?: string; highlight?: boolean }[];
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={
            item.highlight
              ? "rounded-lg bg-brand-50 p-3 ring-1 ring-brand-100"
              : "rounded-lg bg-slate-50 p-3"
          }
        >
          <p className={`text-xs ${item.highlight ? "text-brand-800" : "text-slate-500"}`}>
            {item.label}
          </p>
          <p
            className={`mt-0.5 text-xl font-bold ${item.highlight ? "text-brand-900" : "text-slate-900"}`}
          >
            {item.value}
          </p>
          {item.hint && (
            <p className={`text-[11px] ${item.highlight ? "text-brand-700/80" : "text-slate-400"}`}>
              {item.hint}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
