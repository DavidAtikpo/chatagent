import { uploadToCloudinary } from "@/lib/cloudinary";
import { queryOne, queryRows } from "@/lib/db";
import {
  isAllowedKnowledgeDocument,
  isPowerPointFile,
  KNOWLEDGE_DOC_MAX_BYTES,
} from "@/lib/knowledge-documents";
import { userOwnsSite } from "@/lib/site-access";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MAX_DOCS = 10;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (!(await userOwnsSite(user.id, siteId))) {
      return NextResponse.json({ error: "Site non autorisé" }, { status: 403 });
    }

    const documents = await queryRows(
      `SELECT id, filename, mime_type, cloudinary_url, status, chunk_count, error_message, created_at
       FROM site_documents
       WHERE site_id = $1
       ORDER BY created_at DESC`,
      [siteId]
    );

    return NextResponse.json({ documents });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (!(await userOwnsSite(user.id, siteId))) {
      return NextResponse.json({ error: "Site non autorisé" }, { status: 403 });
    }

    const countRow = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM site_documents WHERE site_id = $1`,
      [siteId]
    );
    if (Number(countRow?.count ?? 0) >= MAX_DOCS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_DOCS} documents par site` },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    }

    const mime = file.type || "application/octet-stream";
    if (isPowerPointFile(file.name, mime)) {
      return NextResponse.json(
        {
          error:
            "Les présentations PowerPoint (.ppt / .pptx) ne sont pas acceptées. Exportez votre fichier en PDF.",
        },
        { status: 400 }
      );
    }
    if (!isAllowedKnowledgeDocument(file.name, mime)) {
      return NextResponse.json({ error: "Format accepté : PDF uniquement" }, { status: 400 });
    }
    if (file.size > KNOWLEDGE_DOC_MAX_BYTES) {
      return NextResponse.json({ error: "Fichier trop lourd (max 10 Mo)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 80);

    const doc = await queryOne<{ id: string }>(
      `INSERT INTO site_documents (site_id, filename, mime_type, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id`,
      [siteId, safeName, mime]
    );
    if (!doc) {
      return NextResponse.json({ error: "Impossible d'enregistrer le document" }, { status: 500 });
    }

    const { url, publicId } = await uploadToCloudinary(buffer, {
      folder: `yayra/knowledge/${siteId}`,
      publicId: `doc-${doc.id}`,
      resourceType: "raw",
      mimeType: mime,
    });

    await queryOne(
      `UPDATE site_documents
       SET cloudinary_public_id = $1, cloudinary_url = $2, status = 'processing'
       WHERE id = $3`,
      [publicId, url, doc.id]
    );

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const ingestRes = await fetch(`${apiUrl}/ingest/document`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ site_id: siteId, document_id: doc.id }),
    });
    const ingestData = await ingestRes.json().catch(() => ({}));
    if (!ingestRes.ok) {
      return NextResponse.json(
        {
          document: { id: doc.id, filename: safeName, status: "error", error_message: ingestData.detail ?? ingestData.error },
          error: ingestData.detail ?? ingestData.error ?? "Indexation échouée",
        },
        { status: 502 }
      );
    }

    const row = await queryOne(
      `SELECT id, filename, mime_type, cloudinary_url, status, chunk_count, error_message, created_at
       FROM site_documents WHERE id = $1`,
      [doc.id]
    );

    return NextResponse.json({ document: row });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
