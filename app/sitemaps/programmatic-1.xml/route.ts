import { buildProgrammaticSitemapXml, xmlResponse } from "@/lib/sitemapBuild";
import { SITEMAP_ORIGIN } from "@/lib/site";

export function GET(): Response {
  return xmlResponse(buildProgrammaticSitemapXml(SITEMAP_ORIGIN));
}
