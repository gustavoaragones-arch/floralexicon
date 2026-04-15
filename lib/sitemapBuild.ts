import processedNames from "@/data/processed/names.json";
import processedPlants from "@/data/processed/plants.json";
import {
  getAllNameUrlSlugsIncludingVariants,
  getNameEntryUrlSlug,
  getNamesByNormalized,
  loadPlants,
} from "@/lib/data";

type ProcessedNameRow = { normalized?: string };
type ProcessedPlantRow = { id?: string };

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Routable `/[lang]/name/[slug]` slugs: live index + variants, merged with processed names rows. */
export function getSitemapNameSlugs(): string[] {
  const out = new Set(getAllNameUrlSlugsIncludingVariants());
  for (const row of processedNames as ProcessedNameRow[]) {
    const entries = getNamesByNormalized(String(row.normalized ?? ""));
    if (!entries.length) continue;
    const slug = getNameEntryUrlSlug(entries[0]!);
    if (slug) out.add(slug);
  }
  return [...out].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

/**
 * Routable `/[lang]/plant/[slug]` ids: prefer intersection with processed merge file;
 * if any slim index plant is missing from processed, fall back to full slim list.
 */
export function getSitemapPlantIds(): string[] {
  const processedIds = new Set(
    (processedPlants as ProcessedPlantRow[])
      .map((p) => String(p.id ?? "").trim())
      .filter(Boolean)
  );
  const slimIds = loadPlants()
    .map((p) => p.id.trim())
    .filter(Boolean);
  const inter = slimIds.filter((id) => processedIds.has(id));
  const list = inter.length === slimIds.length ? inter : slimIds;
  return [...new Set(list)].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

function nameUrls(origin: string, slug: string): { en: string; es: string } {
  const en = `${origin}/en/name/${slug}`;
  const es = `${origin}/es/name/${slug}`;
  return { en, es };
}

function plantUrls(origin: string, id: string): { en: string; es: string } {
  return {
    en: `${origin}/en/plant/${id}`,
    es: `${origin}/es/plant/${id}`,
  };
}

const URLSET_NS = `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`;
const XHTML_NS = `xmlns:xhtml="http://www.w3.org/1999/xhtml"`;

export function buildSitemapIndexXml(origin: string): string {
  const namesLoc = escapeXml(`${origin}/sitemaps/names-1.xml`);
  const plantsLoc = escapeXml(`${origin}/sitemaps/plants-1.xml`);
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    `  <sitemap>`,
    `    <loc>${namesLoc}</loc>`,
    `  </sitemap>`,
    `  <sitemap>`,
    `    <loc>${plantsLoc}</loc>`,
    `  </sitemap>`,
    `</sitemapindex>`,
    "",
  ].join("\n");
}

export function buildNamesSitemapXml(origin: string): string {
  const slugs = getSitemapNameSlugs();
  const lines: string[] = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset ${URLSET_NS} ${XHTML_NS}>`,
  ];
  for (const slug of slugs) {
    const { en, es } = nameUrls(origin, slug);
    lines.push("  <url>");
    lines.push(`    <loc>${escapeXml(en)}</loc>`);
    lines.push(`    <changefreq>weekly</changefreq>`);
    lines.push(`    <priority>0.9</priority>`);
    lines.push(`    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(en)}"/>`);
    lines.push(`    <xhtml:link rel="alternate" hreflang="es" href="${escapeXml(es)}"/>`);
    lines.push(
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(en)}"/>`
    );
    lines.push("  </url>");
  }
  lines.push("</urlset>");
  lines.push("");
  return lines.join("\n");
}

export function buildPlantsSitemapXml(origin: string): string {
  const ids = getSitemapPlantIds();
  const lines: string[] = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset ${URLSET_NS} ${XHTML_NS}>`,
  ];
  for (const id of ids) {
    const { en, es } = plantUrls(origin, id);
    lines.push("  <url>");
    lines.push(`    <loc>${escapeXml(en)}</loc>`);
    lines.push(`    <changefreq>monthly</changefreq>`);
    lines.push(`    <priority>0.7</priority>`);
    lines.push(`    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(en)}"/>`);
    lines.push(`    <xhtml:link rel="alternate" hreflang="es" href="${escapeXml(es)}"/>`);
    lines.push(
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(en)}"/>`
    );
    lines.push("  </url>");
  }
  lines.push("</urlset>");
  lines.push("");
  return lines.join("\n");
}

export function xmlResponse(body: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
