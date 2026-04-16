import conceptsData from "@/data/concepts.json";
import { localePath, type Locale } from "@/lib/i18n";
import { resolveSearchNavigation } from "@/lib/resolver";

export type ConceptSectionExplanation = { type: "explanation"; content: string };
export type ConceptSectionExample = { type: "example"; query: string };
export type ConceptSectionSystemLink = { type: "system_link"; content: string };

/** Safety / evidence ladder (aligned with herbal credibility framing). */
export type EvidenceSafetyBadge =
  | "traditional"
  | "preliminary"
  | "clinical"
  | "caution";

export type EvidenceTier = {
  badge: EvidenceSafetyBadge;
  heading: string;
  body: string;
};

export type ConceptSectionEvidenceSafety = {
  type: "evidence_safety";
  tiers: EvidenceTier[];
};

export type ConceptSection =
  | ConceptSectionExplanation
  | ConceptSectionExample
  | ConceptSectionSystemLink
  | ConceptSectionEvidenceSafety;

/** SEO + optional Spanish overrides (from JSON). */
export type ConceptSeo = {
  title: string;
  description: string;
  title_es?: string;
  description_es?: string;
};

/**
 * Raw concept record from `concepts.json` (English base + optional `*_es` fields).
 */
export type ConceptSource = {
  slug: string;
  title: string;
  title_es?: string;
  definition: string;
  definition_es?: string;
  core: boolean;
  priority: number;
  sections: ConceptSectionSource[];
  related: string[];
  seo: ConceptSeo;
};

/** Section row as stored in JSON (may include Spanish text fields). */
export type ConceptSectionSource =
  | (ConceptSectionExplanation & { content_es?: string })
  | ConceptSectionExample
  | (ConceptSectionSystemLink & { content_es?: string })
  | {
      type: "evidence_safety";
      tiers: Array<
        EvidenceTier & { heading_es?: string; body_es?: string }
      >;
    };

/** Display shape after applying locale (no `*_es` keys). */
export type Concept = {
  slug: string;
  title: string;
  definition: string;
  core: boolean;
  priority: number;
  sections: ConceptSection[];
  related: string[];
  seo: { title: string; description: string };
};

const sources = conceptsData as ConceptSource[];

function localizeSection(s: ConceptSectionSource, lang: Locale): ConceptSection {
  if (lang !== "es") {
    if (s.type === "explanation") {
      return { type: "explanation", content: s.content };
    }
    if (s.type === "system_link") {
      return { type: "system_link", content: s.content };
    }
    if (s.type === "example") {
      return s;
    }
    return {
      type: "evidence_safety",
      tiers: s.tiers.map(({ badge, heading, body }) => ({
        badge,
        heading,
        body,
      })),
    };
  }
  if (s.type === "explanation") {
    return {
      type: "explanation",
      content: s.content_es ?? s.content,
    };
  }
  if (s.type === "system_link") {
    return {
      type: "system_link",
      content: s.content_es ?? s.content,
    };
  }
  if (s.type === "example") {
    return s;
  }
  return {
    type: "evidence_safety",
    tiers: s.tiers.map((t) => ({
      badge: t.badge,
      heading: t.heading_es ?? t.heading,
      body: t.body_es ?? t.body,
    })),
  };
}

/** Resolve English/Spanish copy for UI, metadata, and JSON-LD. */
export function localizeConcept(source: ConceptSource, lang: Locale): Concept {
  return {
    slug: source.slug,
    title: lang === "es" && source.title_es ? source.title_es : source.title,
    definition:
      lang === "es" && source.definition_es
        ? source.definition_es
        : source.definition,
    core: source.core,
    priority: source.priority,
    sections: source.sections.map((s) => localizeSection(s, lang)),
    related: source.related,
    seo: {
      title:
        lang === "es" && source.seo.title_es
          ? source.seo.title_es
          : source.seo.title,
      description:
        lang === "es" && source.seo.description_es
          ? source.seo.description_es
          : source.seo.description,
    },
  };
}

function byPriorityThenTitle(a: ConceptSource, b: ConceptSource): number {
  if (a.core !== b.core) return a.core ? -1 : 1;
  if (a.core && b.core) return a.priority - b.priority;
  return a.title.localeCompare(b.title, "en");
}

/** Core concepts first (by priority), then remaining concepts A–Z (English sort of base titles). */
export function getAllConcepts(): ConceptSource[] {
  return [...sources].sort(byPriorityThenTitle);
}

export function getConceptSourceBySlug(slug: string): ConceptSource | undefined {
  return sources.find((c) => c.slug === slug);
}

export function getConceptBySlug(slug: string): ConceptSource | undefined {
  return getConceptSourceBySlug(slug);
}

export function getCoreConcepts(): ConceptSource[] {
  return sources
    .filter((c) => c.core)
    .sort((a, b) => a.priority - b.priority);
}

export function getRelatedConcepts(slug: string): ConceptSource[] {
  const c = getConceptSourceBySlug(slug);
  if (!c) return [];
  return c.related
    .map((s) => getConceptSourceBySlug(s))
    .filter((x): x is ConceptSource => Boolean(x));
}

export type ConceptContextLinks = {
  nameQueries: { href: string; label: string }[];
  plantPages: { href: string; label: string }[];
};

const CONTEXT_NAME_QUERIES: Partial<Record<string, string[]>> = {
  "plant-name-ambiguity": ["gordolobo", "manzanilla"],
  "plant-disambiguation-system": ["manzanilla", "gordolobo"],
  "regional-plant-names": ["ruda", "matico"],
  "binomial-nomenclature": ["manzanilla"],
};

export function getConceptContextLinks(
  conceptSlug: string,
  lang: Locale
): ConceptContextLinks {
  const queries = CONTEXT_NAME_QUERIES[conceptSlug] ?? [];
  const nameQueries = queries.map((query) => {
    const nav = resolveSearchNavigation(query);
    const href =
      nav.type === "name"
        ? localePath(lang, `/name/${nav.slug}`)
        : localePath(lang, `/search?q=${encodeURIComponent(query)}`);
    return { href, label: query };
  });
  return { nameQueries, plantPages: [] };
}
