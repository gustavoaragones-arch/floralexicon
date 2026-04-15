import { buildPlantsSitemapXml, xmlResponse } from "@/lib/sitemapBuild";
import { SITEMAP_ORIGIN } from "@/lib/site";

export function GET(): Response {
  return xmlResponse(buildPlantsSitemapXml(SITEMAP_ORIGIN));
}
