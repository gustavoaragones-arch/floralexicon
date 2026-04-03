/**
 * Descriptive alt text for plant photos (image SEO + accessibility).
 * Prefers a distinct common/query label; otherwise uses uses or plant type.
 */
export function buildPlantImageAlt(
  scientificName: string,
  opts: {
    queryLabel?: string;
    primaryUses?: string[];
    plantType?: string;
  } = {}
): string {
  const binomial = scientificName.toLowerCase();
  const q = opts.queryLabel?.trim();

  let context = "";
  if (q && q.length > 1 && !binomial.includes(q.toLowerCase())) {
    context = q;
  } else if (opts.primaryUses?.length) {
    context = opts.primaryUses.slice(0, 2).join(" ");
  } else if (opts.plantType) {
    context = opts.plantType;
  }

  if (context) {
    return `${scientificName} ${context} plant`;
  }
  return `${scientificName} plant`;
}
