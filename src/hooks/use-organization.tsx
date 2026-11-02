"use client";

import { createClient } from "@/lib/supabase/client";
import type { Organization, Site } from "@/lib/dashboard-data";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type OrganizationContextValue = {
  organization: Organization | null;
  sites: Site[];
  siteIds: string[];
  email: string;
  loading: boolean;
  refresh: (opts?: { silent?: boolean }) => Promise<void>;
};

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

const ORG_CACHE_KEY = "yayra-dashboard-org-v1";

function readOrgCache(): { organization: Organization | null; sites: Site[] } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ORG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { organization: Organization | null; sites: Site[] };
    if (!parsed || typeof parsed !== "object") return null;
    return {
      organization: parsed.organization ?? null,
      sites: Array.isArray(parsed.sites) ? parsed.sites : [],
    };
  } catch {
    return null;
  }
}

function writeOrgCache(organization: Organization | null, sites: Site[]) {
  try {
    sessionStorage.setItem(ORG_CACHE_KEY, JSON.stringify({ organization, sites }));
  } catch {
    /* quota / private mode */
  }
}

async function fetchOrganizationFromApi(): Promise<{
  organization: Organization | null;
  sites: Site[];
}> {
  const res = await fetch("/api/organization", { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Impossible de charger l'organisation");
  }
  return res.json();
}

function sameSites(a: Site[], b: Site[]) {
  if (a.length !== b.length) return false;
  return a.every((site, i) => {
    const other = b[i];
    return (
      site.id === other.id &&
      site.crawl_status === other.crawl_status &&
      site.is_active === other.is_active &&
      site.name === other.name &&
      site.url === other.url &&
      (site.business_description ?? "") === (other.business_description ?? "")
    );
  });
}

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const lastFetchRef = useRef(0);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    const now = Date.now();
    const minInterval = opts?.silent ? 5000 : 0;
    if (minInterval && now - lastFetchRef.current < minInterval) {
      return;
    }

    if (inFlightRef.current) {
      await inFlightRef.current;
      return;
    }

    if (!opts?.silent) setLoading(true);

    inFlightRef.current = (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setEmail(user?.email ?? "");

        const data = await fetchOrganizationFromApi();
        lastFetchRef.current = Date.now();

        setOrganization((prev) => {
          if (prev?.id === data.organization?.id && prev?.name === data.organization?.name) {
            return prev;
          }
          return data.organization;
        });
        setSites((prev) => (sameSites(prev, data.sites) ? prev : data.sites));
        writeOrgCache(data.organization, data.sites);
      } catch (err) {
        console.error("[OrganizationProvider]", err);
        setOrganization(null);
        setSites([]);
      } finally {
        setLoading(false);
        inFlightRef.current = null;
      }
    })();

    await inFlightRef.current;
  }, []);

  useEffect(() => {
    const cached = readOrgCache();
    if (cached?.organization) {
      setOrganization(cached.organization);
      setSites(cached.sites);
      setLoading(false);
      void refresh({ silent: true });
    } else {
      void refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        sites,
        siteIds: sites.map((s) => s.id),
        email,
        loading,
        refresh,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const ctx = useContext(OrganizationContext);
  if (!ctx) {
    throw new Error("useOrganization must be used within OrganizationProvider");
  }
  return ctx;
}
