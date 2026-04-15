import { buildNamesSitemapXml, xmlResponse } from "@/lib/sitemapBuild";
import { SITEMAP_ORIGIN } from "@/lib/site";

export function GET(): Response {
  return xmlResponse(buildNamesSitemapXml(SITEMAP_ORIGIN));
}
