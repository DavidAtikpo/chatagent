import type { ReactNode } from "react";

const PLACEHOLDER_VALUES = /^(numéro|numero|number|adresse@email\.com|email)$/i;

const CONTACT_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  phone: "Téléphone",
  email: "Email",
};

/** Retire blocs invisibles (qualification, handoff) — aligné widget. */
export function stripAssistantChatMetadata(raw: string): string {
  return raw
    .replace(/<!--QUALIFICATION:\{[\s\S]*?\}-->/g, "")
    .replace(/<!--HANDOFF:[a-z_]+-->/gi, "")
    .replace(/<!--QUALIFICATION:[\s\S]*$/g, "")
    .replace(
      /(?:^|\s)(?:"(?:country|experience|availability|budget)"\s*:\s*"[^"]*"\s*,?\s*)+\}-->/gi,
      ""
    )
    .trim();
}

export function stripHumanIntroPrefix(raw: string): string {
  return raw.replace(/^\*\*[^*\n]+\*\*\s*:\s*/u, "").trimStart();
}

function contactHref(type: string, value: string): string | null {
  const v = value.trim();
  if (!v || PLACEHOLDER_VALUES.test(v)) return null;
  if (type === "whatsapp") {
    const digits = v.replace(/\D/g, "");
    return digits ? `https://wa.me/${digits}` : null;
  }
  if (type === "phone") return `tel:${v.replace(/\s/g, "")}`;
  if (type === "email") return v.includes("@") ? `mailto:${v}` : null;
  return null;
}

function prepareMessageText(content: string, role: string): string {
  let text = content;
  if (role === "assistant" || role === "human") {
    text = stripAssistantChatMetadata(text);
  }
  if (role === "human") {
    text = stripHumanIntroPrefix(text);
  }
  return text;
}

/** Affichage fil dashboard : tokens contact/session, gras markdown, sans [[CONTACT:…]] bruts. */
export function ChatMessageContent({ content, role }: { content: string; role: string }) {
  const text = prepareMessageText(content, role);
  const nodes: ReactNode[] = [];
  const pattern =
    /\[\[CONTACT:(whatsapp|phone|email)\|([^\]]+)\]\]|\[\[SESSION:([^|]+)\|([^\]]+)\]\]|\*\*([^*]+)\*\*/gi;

  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(<span key={key++}>{text.slice(last, match.index)}</span>);
    }

    if (match[1]) {
      const type = match[1].toLowerCase();
      const value = match[2].trim();
      const href = contactHref(type, value);
      const label = CONTACT_LABELS[type] ?? type;
      const isPlaceholder = PLACEHOLDER_VALUES.test(value);
      const display = isPlaceholder ? `${label} (non renseigné)` : value;

      nodes.push(
        href ? (
          <a
            key={key++}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="my-0.5 mr-1 inline-flex rounded-md bg-white/80 px-2 py-1 text-xs font-medium text-brand-800 ring-1 ring-slate-200 hover:bg-brand-50"
          >
            {label}: {display}
          </a>
        ) : (
          <span
            key={key++}
            className="my-0.5 mr-1 inline-flex rounded-md bg-slate-100/90 px-2 py-1 text-xs text-slate-700 ring-1 ring-slate-200"
          >
            {display}
          </span>
        )
      );
    } else if (match[3]) {
      const sessionLabel = match[3].trim();
      const url = match[4].trim();
      nodes.push(
        <a
          key={key++}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="my-1 block text-sm font-medium text-brand-700 hover:underline"
        >
          {sessionLabel}
        </a>
      );
    } else if (match[5]) {
      nodes.push(<strong key={key++}>{match[5]}</strong>);
    }

    last = pattern.lastIndex;
  }

  if (last < text.length) {
    nodes.push(<span key={key++}>{text.slice(last)}</span>);
  }

  return (
    <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{nodes.length ? nodes : text}</div>
  );
}

function renderRichInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /\[\[CONTACT:(whatsapp|phone|email)\|([^\]]+)\]\]|\*\*([^*]+)\*\*/gi;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(<span key={`${keyPrefix}-${key++}`}>{text.slice(last, match.index)}</span>);
    }
    if (match[1]) {
      const type = match[1].toLowerCase();
      const value = match[2].trim();
      const label = CONTACT_LABELS[type] ?? type;
      nodes.push(
        <span
          key={`${keyPrefix}-${key++}`}
          className="inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-brand-800"
        >
          {label}: {value}
        </span>
      );
    } else if (match[3]) {
      nodes.push(<strong key={`${keyPrefix}-${key++}`}>{match[3]}</strong>);
    }
    last = pattern.lastIndex;
  }
  if (last < text.length) {
    nodes.push(<span key={`${keyPrefix}-${key++}`}>{text.slice(last)}</span>);
  }
  return nodes.length ? nodes : [text];
}

/** Aperçu widget / message d'accueil — titres, listes, gras (pas de markdown brut). */
export function WidgetChatMarkdown({ content }: { content: string }) {
  const text = stripAssistantChatMetadata(content);
  const lines = text.split("\n");

  return (
    <div className="space-y-1.5 text-sm leading-relaxed text-slate-800">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={`ln-${i}`} className="h-1" aria-hidden />;
        }
        if (/^-{3,}$/.test(trimmed)) {
          return <hr key={`ln-${i}`} className="my-2 border-slate-200" />;
        }
        if (trimmed.startsWith("### ")) {
          return (
            <p key={`ln-${i}`} className="pt-1 text-xs font-bold uppercase tracking-wide text-slate-600">
              {renderRichInline(trimmed.slice(4), `ln-${i}`)}
            </p>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <p key={`ln-${i}`} className="pt-1.5 text-sm font-bold text-slate-900">
              {renderRichInline(trimmed.slice(3), `ln-${i}`)}
            </p>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <p key={`ln-${i}`} className="text-base font-bold text-slate-900">
              {renderRichInline(trimmed.slice(2), `ln-${i}`)}
            </p>
          );
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={`ln-${i}`} className="flex gap-2 pl-0.5">
              <span className="shrink-0 text-slate-400" aria-hidden>
                •
              </span>
              <span className="min-w-0 flex-1 break-words">{renderRichInline(trimmed.slice(2), `ln-${i}`)}</span>
            </div>
          );
        }
        return (
          <p key={`ln-${i}`} className="break-words">
            {renderRichInline(trimmed, `ln-${i}`)}
          </p>
        );
      })}
    </div>
  );
}
