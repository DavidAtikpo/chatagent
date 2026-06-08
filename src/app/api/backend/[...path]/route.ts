import { getBackendApiUrl } from "@/lib/api-backend";
import { NextResponse } from "next/server";

const ALLOWED_PREFIXES = ["widget/", "chat", "widget/event"];

function isAllowedPath(path: string, method: string): boolean {
  if (path.startsWith("widget/") && method === "GET") return true;
  if (path === "chat" && method === "POST") return true;
  if (path === "widget/event" && method === "POST") return true;
  return ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(p));
}

async function proxy(request: Request, pathSegments: string[]) {
  const path = pathSegments.join("/");
  if (!isAllowedPath(path, request.method)) {
    return NextResponse.json({ error: "Route non autorisée" }, { status: 404 });
  }

  const api = getBackendApiUrl();
  const target = `${api}/${path}${new URL(request.url).search}`;

  try {
    const headers = new Headers();
    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);
    const accept = request.headers.get("accept");
    if (accept) headers.set("Accept", accept);

    const init: RequestInit = {
      method: request.method,
      headers,
      signal: AbortSignal.timeout(120000),
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = await request.arrayBuffer();
    }

    const res = await fetch(target, init);
    const resHeaders = new Headers();
    const resType = res.headers.get("content-type");
    if (resType) resHeaders.set("Content-Type", resType);
    resHeaders.set("Cache-Control", "no-cache");

    return new NextResponse(res.body, {
      status: res.status,
      headers: resHeaders,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.name === "TimeoutError"
        ? "API trop lente — Render peut mettre ~1 min à démarrer"
        : err instanceof Error
          ? err.message
          : "API inaccessible";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  return proxy(request, params.path);
}

export async function POST(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  return proxy(request, params.path);
}
