"use client";

import { KnowledgeDescriptionPreview } from "@/components/dashboard/knowledge-description-preview";
import { useT } from "@/i18n/context";
import { useCallback, useEffect, useMemo, useState } from "react";

const DESCRIPTION_FIELD_CLASS =
  "mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";
const DESCRIPTION_LABEL_CLASS = "text-xs font-medium text-slate-600";

type SiteDocument = {
  id: string;
  filename: string;
  status: string;
  chunk_count: number;
  error_message: string | null;
  cloudinary_url: string | null;
  created_at: string;
};

export function SiteKnowledgePanel({
  siteId,
  initialDescription,
  hasUrl,
  variant = "default",
}: {
  siteId: string;
  initialDescription?: string | null;
  hasUrl: boolean;
  variant?: "default" | "emploi";
}) {
  const t = useT();
  const isEmploi = variant === "emploi";
  const descriptionLabel = isEmploi
    ? t("dashboard.sites.knowledge.descriptionLabelEmploi")
    : t("dashboard.sites.knowledge.descriptionLabel");
  const descriptionPlaceholder = isEmploi
    ? t("dashboard.sites.knowledge.descriptionPlaceholderEmploi")
    : t("dashboard.sites.knowledge.descriptionPlaceholder");
  const panelSubtitle = isEmploi
    ? t("dashboard.sites.knowledge.subtitleEmploi")
    : t("dashboard.sites.knowledge.subtitle");
  const [description, setDescription] = useState(initialDescription ?? "");
  const trimmedLen = useMemo(() => description.trim().length, [description]);
  const [savingDesc, setSavingDesc] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<SiteDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/documents`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setDocuments(data.documents ?? []);
      }
    } finally {
      setLoadingDocs(false);
    }
  }, [siteId]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    setDescription(initialDescription ?? "");
  }, [initialDescription]);

  async function saveDescription() {
    setSavingDesc(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/knowledge/description`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("dashboard.sites.knowledge.saveFailed"));
        return;
      }
      setMessage(t("dashboard.sites.knowledge.saved"));
    } catch {
      setError(t("common.unexpectedError"));
    } finally {
      setSavingDesc(false);
    }
  }

  async function uploadPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/sites/${siteId}/documents`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("dashboard.sites.knowledge.uploadFailed"));
      } else {
        setMessage(t("dashboard.sites.knowledge.uploadOk"));
        await loadDocuments();
      }
    } catch {
      setError(t("common.unexpectedError"));
    } finally {
      setUploading(false);
    }
  }

  async function removeDocument(documentId: string) {
    if (!confirm(t("dashboard.sites.knowledge.deleteConfirm"))) return;
    setError(null);
    const res = await fetch(`/api/sites/${siteId}/documents/${documentId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? t("dashboard.sites.deleteFailed"));
      return;
    }
    await loadDocuments();
  }

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
      <h3 className="text-sm font-semibold text-slate-900">{t("dashboard.sites.knowledge.title")}</h3>
      <p className="mt-0.5 text-xs text-slate-500">{panelSubtitle}</p>

      {hasUrl ? (
        <p className="mt-2 text-xs text-brand-700">{t("dashboard.sites.knowledge.webHint")}</p>
      ) : null}

      {error ? (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      ) : null}
      {message ? (
        <p className="mt-2 text-xs text-green-700">{message}</p>
      ) : null}

      <div className="mt-3 space-y-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50/90 p-3 ring-1 ring-slate-100">
          <label className={DESCRIPTION_LABEL_CLASS} htmlFor={`knowledge-desc-${siteId}`}>
            {descriptionLabel}
          </label>
          <textarea
            id={`knowledge-desc-${siteId}`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={isEmploi ? 10 : 6}
            className={`${DESCRIPTION_FIELD_CLASS} max-h-72 min-h-[8.5rem] resize-y overflow-y-auto leading-relaxed font-normal`}
            placeholder={descriptionPlaceholder}
          />
          <p className="mt-2 text-xs text-slate-500">
            {t("dashboard.sites.knowledge.descriptionHint")}
          </p>
          {trimmedLen > 0 && trimmedLen < 30 ? (
            <p className="mt-1 text-xs text-amber-700">
              {t("dashboard.sites.knowledge.descriptionMinChars", { count: 30 - trimmedLen })}
            </p>
          ) : null}
          <button
            type="button"
            disabled={savingDesc || trimmedLen < 30}
            onClick={() => void saveDescription()}
            className="mt-3 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {savingDesc ? t("common.saving") : t("dashboard.sites.knowledge.saveDescription")}
          </button>
        </div>
        <KnowledgeDescriptionPreview content={description} />
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-600">
            {t("dashboard.sites.knowledge.documents")}
          </span>
          <label className="cursor-pointer rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-200">
            {uploading ? t("dashboard.sites.knowledge.uploading") : t("dashboard.sites.knowledge.uploadDocument")}
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              disabled={uploading}
              onChange={(e) => void uploadPdf(e)}
            />
          </label>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">{t("dashboard.sites.knowledge.pdfHint")}</p>

        {loadingDocs ? (
          <p className="mt-2 text-xs text-slate-400">{t("common.loading")}</p>
        ) : documents.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">{t("dashboard.sites.knowledge.noDocuments")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-100 bg-slate-50 px-2 py-1.5 text-xs"
              >
                <div className="min-w-0 flex-1">
                  {doc.cloudinary_url ? (
                    <a
                      href={doc.cloudinary_url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate font-medium text-brand-700 hover:underline"
                    >
                      {doc.filename}
                    </a>
                  ) : (
                    <span className="truncate font-medium text-slate-800">{doc.filename}</span>
                  )}
                  <span className="ml-2 text-slate-500">
                    {doc.status === "ready"
                      ? t("dashboard.sites.knowledge.statusReady", { count: doc.chunk_count })
                      : doc.status === "error"
                        ? t("dashboard.sites.knowledge.statusError")
                        : t("dashboard.sites.knowledge.statusProcessing")}
                  </span>
                  {doc.error_message ? (
                    <p className="mt-0.5 text-[11px] text-red-600">{doc.error_message}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => void removeDocument(doc.id)}
                  className="shrink-0 text-red-600 hover:underline"
                >
                  {t("common.delete")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
