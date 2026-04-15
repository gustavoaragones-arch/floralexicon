import { buildSitemapIndexXml, xmlResponse } from "@/lib/sitemapBuild";
import { SITEMAP_ORIGIN } from "@/lib/site";

export function GET(): Response {
  return xmlResponse(buildSitemapIndexXml(SITEMAP_ORIGIN));
}
