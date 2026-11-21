import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { ProjectRecord, ProjectResult } from "./project-types";
import { imageUrl } from "./project-types";

type Row = Database["public"]["Tables"]["projects"]["Row"];

export const ADMIN_EMAIL = "alexxalphatv@gmail.com";

export function createPublicClient() {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY environment variable.");
  }
  return createClient<Database>(url, key, {
    global: {
      fetch: (input, init) => {
        const headers = new Headers(
          typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
        );
        if (init?.headers) {
          new Headers(init.headers).forEach((v, k) => headers.set(k, v));
        }
        if (
          (key.startsWith("sb_publishable_") || key.startsWith("sb_secret_")) &&
          headers.get("Authorization") === `Bearer ${key}`
        ) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export function mapRow(row: Row, resolveImages = true): ProjectRecord {
  const results = Array.isArray(row.results) ? (row.results as unknown as ProjectResult[]) : [];
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    client: row.client,
    year: row.year,
    category: row.category,
    blurb: row.blurb,
    brief: row.brief,
    role: row.role ?? [],
    deliverables: row.deliverables ?? [],
    results,
    cover: resolveImages ? imageUrl(row.cover) : row.cover,
    width: row.width,
    height: row.height,
    gallery: (row.gallery ?? []).map((g) => (resolveImages ? imageUrl(g) : g)),
    sort_order: row.sort_order,
    published: row.published,
  };
}
