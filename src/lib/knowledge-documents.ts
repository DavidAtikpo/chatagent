/** Types de fichiers « sources de connaissance » (upload dashboard). */

export const KNOWLEDGE_DOC_MAX_BYTES = 10 * 1024 * 1024;

const PPT_LEGACY_MIME = "application/vnd.ms-powerpoint";
const PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

export function isLegacyPptFile(name: string, mime: string): boolean {
  const n = name.toLowerCase();
  return mime === PPT_LEGACY_MIME || (n.endsWith(".ppt") && !n.endsWith(".pptx"));
}

export function isPowerPointFile(name: string, mime: string): boolean {
  const n = name.toLowerCase();
  return (
    mime === PPTX_MIME ||
    n.endsWith(".pptx") ||
    isLegacyPptFile(name, mime)
  );
}

export function isAllowedKnowledgeDocument(name: string, mime: string): boolean {
  const n = name.toLowerCase();
  if (isPowerPointFile(name, mime)) return false;
  if (mime === "application/pdf" || n.endsWith(".pdf")) return true;
  return false;
}

export const KNOWLEDGE_DOC_ACCEPT = "application/pdf,.pdf";
