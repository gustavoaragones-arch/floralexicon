import { SITE_URL } from "@/lib/site";

export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isLocale(s: string): s is Locale {
  return locales.includes(s as Locale);
}

/** Path without locale prefix, e.g. `/name/foo` or `/` */
export function localePath(lang: Locale, path: string): string {
  const p = path === "/" || path === "" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `/${lang}${p}`;
}

export function t(lang: Locale, key: I18nKey): string {
  const pack = dictionary[lang] ?? dictionary.en;
  return pack[key] ?? dictionary.en[key] ?? key;
}

export type I18nKey = keyof typeof dictionary.en;

/** Interpolate `{name}`-style placeholders in dictionary strings. */
export function ti(lang: Locale, key: I18nKey, vars: Record<string, string>): string {
  let s = t(lang, key);
  for (const [k, v] of Object.entries(vars)) {
    s = s.replaceAll(`{${k}}`, v);
  }
  return s;
}

export function alternateLanguageUrls(pathWithoutLocale: string): {
  en: string;
  es: string;
  xDefault: string;
} {
  const p = pathWithoutLocale.startsWith("/") ? pathWithoutLocale : `/${pathWithoutLocale}`;
  const base = SITE_URL.replace(/\/$/, "");
  return {
    en: `${base}/en${p === "/" ? "" : p}`,
    es: `${base}/es${p === "/" ? "" : p}`,
    xDefault: `${base}/en${p === "/" ? "" : p}`,
  };
}

const dictionary = {
  en: {
    nav_home: "Home",
    nav_plant_names: "Herb names",
    nav_plants: "Plants",
    nav_concepts: "Concepts",
    concepts_meta_index_title: "Understanding Plant Names | FloraLexicon",
    concepts_meta_index_desc:
      "Structured glossary: ambiguity, binomial names, synonyms, regional usage, evidence levels, and how FloraLexicon disambiguates.",
    concepts_hero_h1: "Understanding Plant Names",
    concepts_hero_lead:
      "Reference notes on how common names, science, and regions interact—without long articles.",
    concepts_core_heading: "Core concepts",
    concepts_all_heading: "All concepts",
    concepts_related_heading: "Related concepts",
    concepts_example_label: "Example in the index",
    concepts_try_query: "Open name resolution →",
    concepts_system_label: "In FloraLexicon",
    concepts_appears_heading: "This concept appears in",
    concepts_name_queries_label: "Name queries",
    concepts_plant_pages_label: "Plant pages",
    concepts_no_name_examples: "No curated name examples for this concept yet.",
    concepts_plant_pages_pending: "Species pages are not yet tagged to glossary concepts.",
    concepts_cta_title: "Explore plant names across languages",
    concepts_cta_link: "Browse the name index →",
    concept_hint_multiple_plants:
      "This name may refer to multiple plants. Learn why →",
    concept_hint_evidence_levels:
      "How evidence labels relate to safety →",
    concepts_evidence_badge_traditional: "[Traditional]",
    concepts_evidence_badge_preliminary: "[Studied]",
    concepts_evidence_badge_clinical: "[Clinical]",
    concepts_evidence_badge_caution: "[Caution]",
    plant_ontology_crosslinks_aria: "Related glossary topics",
    plant_ontology_synonyms_link: "Plant synonyms & naming",
    plant_ontology_synonyms_desc:
      "why one species can carry many labels in sources and indexes.",
    plant_ontology_regions_link: "Regional plant names",
    plant_ontology_regions_desc:
      "why the same or different species share names across countries.",
    concepts_core_badge: "Core",
    concepts_jsonld_about: "Botanical nomenclature",

    search_meta_title: "Search plant names | FloraLexicon",
    search_meta_desc:
      "Disambiguated plant name search: see every indexed species for a common name, ranked with confidence and safety context.",
    search_ambiguity_notice:
      "This name is used for different plants depending on region and tradition.",
    search_subtitle_multi: "This name may refer to multiple plants",
    search_subtitle_single: "This name matches one species in our index",
    search_rank_intro: "{name} may refer to these plants:",
    search_tier_most_likely: "Most likely",
    search_tier_possible: "Possible match",
    search_tier_less_common: "Less common",
    search_conf_bar_high: "High",
    search_conf_bar_medium: "Medium",
    search_conf_bar_low: "Low",
    search_confidence_visual: "Confidence",
    search_disamb_common_in: "Most common in {country}",
    search_inline_reason_region: "Common in {country}",
    search_inline_reason_region_specific: "Common in {regionLabel}",
    search_tooltip_lookalike:
      "Often confused with similar species—verify identification before use.",
    search_card_sources_extra: "(+{count} more)",
    search_card_sources_less: "Show less",
    search_geo_label_us_ne: "Northeast US",
    search_geo_label_us_se: "Southeast US",
    search_geo_label_us_nw: "Northwest US",
    search_geo_label_us_sw: "Southwest US",
    search_geo_label_us_nc: "North Central US",
    search_geo_label_us_sc: "South Central US",
    search_geo_label_us_ec: "East Central US",
    search_geo_label_us_wc: "West Central US",
    search_geo_label_us_pnw: "Pacific Northwest (US)",
    search_geo_label_mx_baja: "Baja California (MX)",
    search_inline_reason_usage: "Based on common usage",
    search_evidence_clinical: "Clinical literature (where indexed)",
    search_evidence_tramil: "Regional / TRAMIL-style sources",
    search_evidence_traditional: "Traditional use (indexed)",
    search_evidence_empirical:
      "Empirical / observational reports (indexed; not TRAMIL-specific)",
    search_safety_toxic: "Toxicity or caution may apply — verify before use.",
    search_safety_abort:
      "May be associated with reproductive risk in traditional sources — seek professional advice.",
    search_card_badge_toxic: "⚠️ Toxic",
    search_card_badge_caution: "⚠️ Caution",
    search_card_badge_precaution: "⚠️ Potentially unsafe",
    search_card_badge_lookalike: "⚠️ Confusable species",
    search_card_sub_toxic: "Not for self-use",
    search_card_sub_caution: "Use with guidance",
    search_facts_family: "Family",
    search_facts_region: "Native / range (index)",
    search_facts_evidence: "Evidence level",
    search_global_safety_multi:
      "This name may refer to multiple plants—uses and safety can differ by species. Compare each match and verify before use.",
    search_global_safety_combined:
      "This name refers to multiple plants—some may be toxic or easy to confuse with a similar species. Compare species carefully and seek qualified advice when in doubt.",
    search_global_safety_toxic_only:
      "This plant may be toxic or unsafe under some uses. Do not self-treat; consult a qualified professional.",
    search_global_lookalike_soft:
      "Some results may be confused with similar species—verify the scientific name and illustration before use.",
    search_card_sources: "Sources: {list}",
    search_source_label_mexico: "Mexico",
    search_source_label_north_america: "North America",
    search_source_label_catalog: "Catalog merge",
    search_inline_why_lead: "Why are there multiple results?",
    search_inline_why_cta: "Learn why →",
    search_why_heading: "Why this result?",
    search_why_top_country: "Strongest regional signal in our index: {country}",
    search_why_user_country: "Appears with your region focus ({country}) in name records",
    search_why_freq_high: "Frequently tied to this name across countries in our data",
    search_why_freq_mid: "Moderately associated with this name in regional records",
    search_why_freq_low: "A less common mapping for this label in our index",
    search_why_evidence_traditional: "Supported by traditional-use context in the index",
    search_why_evidence_empirical:
      "Indexed as empirical / observational (not the same as TRAMIL protocol evidence)",
    search_why_evidence_tramil: "Regional / compendia-style evidence where indexed",
    search_why_evidence_clinical:
      "Stronger indexed evidence type (clinical / structured sources)",
    search_why_tea_fit:
      "Indexed uses include tea or culinary contexts—closer fit for infusion-style questions",
    search_why_tea_uncertain:
      "Not prominently indexed as tea or culinary—use extra care before infusions",
    search_why_medicinal_fit: "Indexed with medicinal / wellness-related use",
    search_why_safety_focus:
      "Ranking considers your question about toxicity or safety",
    search_empty_no_hub_title: "No exact match found",
    search_empty_no_hub_body:
      "Try another spelling, a regional name, or browse the plant index.",
    search_empty_browse_plants: "Browse all plants",
    search_empty_browse_names: "Browse plant names",
    search_prompt_title: "Search a plant name",
    search_prompt_body:
      "Enter a common name. We show every indexed species and how common each association is—without guessing a single winner.",

    lang_en: "EN",
    lang_es: "ES",

    search_placeholder:
      "Search a herb name (e.g. ruda, cedrón, manzanilla)",
    search_placeholder_short: "e.g. manzanilla, chamomile",
    search_button: "Search",
    search_label_sr: "Herb name",
    hero_title: "Find what your herb is called in different countries",
    hero_lead:
      "Translate traditional herb names used in teas, remedies, and local medicine. Discover local names across cultures — and verify the exact plant when needed.",
    hero_search_helper:
      "Use common or regional names. Results show how the herb is known in different countries.",
    examples_label: "Examples:",
    home_how_title: "How FloraLexicon works",
    home_how_1_title: "Enter a herb name",
    home_how_1_body:
      "— commonly used in teas, remedies, or traditional medicine.",
    home_how_2_title: "See how it’s called in different countries",
    home_how_2_body:
      "— we group local and regional herb names with the countries where each label is used.",
    home_how_3_title: "Confirm the correct plant using the scientific name",
    home_how_3_body:
      "— when you need certainty, use the scientific name as a stable check—not the starting point for browsing.",
    home_why_title: "Why names are confusing",
    home_popular_title: "Popular medicinal herb searches",
    home_popular_cta: "View resolution →",
    home_browse_title: "Browse herbs & species",
    home_browse_lead:
      "Explore traditional and medicinal herb names in the index, or open species pages for herb identification context.",
    home_all_plants: "All plants",
    home_all_names: "All plant names",
    home_browse_by_use_title: "Browse by use",
    home_link_medicinal_herbs: "Medicinal herbs",
    home_link_culinary_herbs: "Culinary-medicinal herbs",
    home_link_ritual_herbs: "Ritual herbs",
    home_country_hub_title: "Browse herbs by country",
    home_country_hub_lead:
      "Explore herbs commonly used in each country and their local names.",

    plant_categories_label: "Categories:",
    category_name_medicinal: "Medicinal",
    category_name_culinary_medicinal: "Culinary-Medicinal",
    category_name_ritual: "Ritual",
    plant_view_more_medicinal: "View more medicinal herbs",
    plant_view_more_culinary_medicinal: "View more culinary & medicinal herbs",
    plant_view_more_ritual: "View more ritual herbs",

    meta_category_medicinal_title: "Medicinal Herbs Around the World | FloraLexicon",
    meta_category_medicinal_desc:
      "Explore herbs traditionally used in teas and natural remedies across cultures. FloraLexicon helps identify medicinal plants by name across regions.",
    category_medicinal_h1: "Medicinal herbs around the world",
    category_medicinal_intro:
      "Explore herbs traditionally used in teas and natural remedies across cultures. FloraLexicon helps identify medicinal plants by name across regions.",

    meta_category_culinary_title: "Culinary and Medicinal Herbs | FloraLexicon",
    meta_category_culinary_desc:
      "Discover herbs used both in cooking and traditional remedies, including oregano, mint, and more.",
    category_culinary_h1: "Culinary and medicinal herbs",
    category_culinary_intro:
      "Discover herbs used both in cooking and traditional remedies, including oregano, mint, and more.",

    meta_category_ritual_title: "Traditional and Ritual Herbs | FloraLexicon",
    meta_category_ritual_desc:
      "Explore herbs used in traditional practices, cultural rituals, and indigenous medicine.",
    category_ritual_h1: "Traditional and ritual herbs",
    category_ritual_intro:
      "Explore herbs used in traditional practices, cultural rituals, and indigenous medicine.",
    category_empty_list: "No plants in this category match the current index.",
    category_medicinal_seo_p2:
      "Each species links to a plant page with safety and regional notes. Common-name hubs link to disambiguation pages when one label maps to more than one scientific plant.",
    category_medicinal_country_heading: "Browse by country",
    category_medicinal_country_lead:
      "Regional index pages list species and name hubs recorded for that country in FloraLexicon’s merged dataset.",
    category_plant_list_h2: "Species in this category",
    category_plant_list_truncated:
      "Showing {shown} of {total} species—see country hubs or search for more.",
    category_footer_nav_aria: "More ways to explore",

    meta_herbs_country_title: "Medicinal herbs in {country} | FloraLexicon",
    meta_herbs_country_desc:
      "Species and common-name hubs indexed for {country} in FloraLexicon: links to plant pages and name disambiguation.",
    herbs_country_h1: "Medicinal herbs in {country}",
    herbs_country_intro:
      "Plants below appear in FloraLexicon’s regional index for {country} (merged ethnobotanical slice). Use them as a starting point—always verify identification and local regulations.",
    herbs_country_intro_seo:
      "Traditional and medicinal use varies by species and source. Follow links to each plant’s page for indexed use categories, or open a name hub when the same label may refer to more than one species.",
    herbs_country_nav_aria: "Related listings",
    herbs_country_nav_medicinal: "Medicinal herbs worldwide",
    herbs_country_nav_plants: "All plants in the index",
    herbs_country_nav_names: "Browse plant names",
    herbs_country_names_h2: "Common names recorded in {country}",
    herbs_country_names_lead:
      "Each label opens the name hub for that spelling in FloraLexicon’s index.",
    herbs_country_plants_h2: "Indexed species for {country}",
    herbs_country_plants_cap: "Showing {shown} of {total} species.",
    herbs_country_empty: "No species in the slim index list this country in the merged dataset yet.",

    site_disclaimer_strip: "Information on this site is for educational purposes only.",
    footer_tagline_a: "FloraLexicon translates everyday and regional herb names across countries, with",
    footer_tagline_b: "scientific names",
    footer_tagline_c: " as a verification layer when you need to be sure.",
    footer_info_only_title: "Informational purposes only",
    footer_info_only_body:
      "not medical, legal, foraging, or professional identification advice. See our",
    footer_disclaimer: "Disclaimer",
    footer_operated: "FloraLexicon is operated by",
    footer_nav_about: "About",
    footer_nav_contact: "Contact",
    footer_nav_names: "Names",
    footer_nav_privacy: "Privacy",
    footer_nav_terms: "Terms",

    name_label_plant_name: "Herb name",
    name_h1: 'What is "{name}" called in different countries?',
    name_spelling_match: "We match this spelling as:",
    name_ambiguity_label: "Ambiguity",
    ambiguity_low: "Low",
    ambiguity_medium: "Medium",
    ambiguity_high: "High",
    ambiguity_banner_high:
      "This name refers to multiple different plants depending on region. Compare the options below before you decide.",
    ambiguity_banner_medium:
      "This name may refer to more than one plant. Use region context and the differences highlighted below.",
    country_label: "Country",
    country_all: "All countries",
    country_helper: "Select your country to see the most relevant plant for your region.",
    name_no_matches_title: "No plants found for this name.",
    name_no_matches_body:
      "It may be missing from the index or spelled differently. Try the home search or another regional name.",
    options_section_aria: "Matching plants",
    options_heading: "Your options ({count})",
    possible_match: "Possible match #{n}",
    name_confidence_most_likely: "Most likely match",
    name_confidence_high_badge: "Strong regional signal",
    name_confidence_percent: "{percent}%",
    name_quick_answer_sr: "Quick answer",
    name_quick_answer_lead: "‘{name}’ most commonly refers to:",
    name_quick_answer_common_in: "Common in",
    visual_reference: "Visual reference",
    when_correct_title: "When is this the correct plant?",
    how_differs_title: "How it differs",
    common_in: "Common in:",
    family: "Family",
    uses: "Uses",
    genus: "Genus",
    rank: "Rank",
    type: "Type",
    origin: "Origin",
    region_badge: "Most common in your region",
    comparison_title: "Side-by-side comparison",
    comparison_show: "Compare these plants",
    comparison_hide: "Hide comparison",
    comparison_col_name: "Plant name",
    comparison_col_family: "Family",
    comparison_col_uses: "Uses",
    comparison_col_regions: "Regions",

    same_plant_heading: "Other names for these plants",
    also_known_as: "Also known as",
    plant_hub_also_called: "Also called:",

    names_index_h1: "Herb names index",
    names_index_lead:
      "Alphabetical list of common and regional herb names in FloraLexicon. Each link opens country context and plant matches for that label.",
    names_index_other: "Other",

    plants_index_h1: "Plants",
    plants_index_lead:
      "Species in the index (scientific names) — open a page to see common names by country and traditional-use notes.",

    prog_name_no_index:
      "‘{name}’ is a plant name people often look up. FloraLexicon does not yet map this spelling to species in our public index.",
    prog_name_intro_countries: "‘{name}’ is a common plant name used in {countries}.",
    prog_name_intro_fallback:
      "‘{name}’ is a common plant name in this index, with linked species shown below.",
    prog_name_disambiguation: "This name may refer to multiple species depending on region.",
    prog_name_uses: "Plants associated with this name are commonly used for: {uses}.",
    prog_plant_family: "{scientific} is a species in the {family} family.",
    prog_plant_uses: "It is traditionally used for {uses}.",

    contact_title: "Contact",
    contact_lead: "For questions, corrections, or feedback:",
    about_title: "About FloraLexicon",
    about_p1:
      "FloraLexicon is a global herb name translator: it helps you find what a traditional or medicinal herb is called in different countries, then verify the correct plant when the label is ambiguous.",
    about_p2:
      "It is built for teas, remedies, and cross-cultural shopping—not as a full botanical encyclopedia.",
    about_p3_prefix: "FloraLexicon is developed and operated by",
    about_p3_suffix:
      ", an independent digital product studio based in the United States and Canada.",

    disclaimer_title: "Disclaimer",
    disclaimer_p1:
      "This website provides informational content only and does not constitute medical, botanical, or professional advice. Plant identification and usage can vary by region and context. Always verify with qualified sources before use.",
    disclaimer_p2:
      "The tools, data, and content on FloraLexicon are offered for informational and educational purposes. While we strive for accuracy, we make no representations or warranties — express or implied — regarding the completeness, accuracy, reliability, or suitability of any information for any particular purpose. All use is at your own risk.",
    disclaimer_p3:
      "Nothing on this site replaces advice from a qualified professional (for example, a botanist, healthcare provider, or local agricultural authority) where health, safety, or regulatory compliance is involved.",
    disclaimer_p4:
      "FloraLexicon may reference or link to external websites. The operator does not control and is not responsible for the content or accuracy of external sites. A link does not imply endorsement.",
    disclaimer_p5:
      "To the fullest extent permitted by law, {operator} and its owner shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from reliance on or use of FloraLexicon, including any errors, interruptions, or inaccuracies.",
    disclaimer_p6:
      "FloraLexicon is operated from Canada and the United States. We make no representation that the site is appropriate or available for use in all jurisdictions. Users who access it from other regions do so at their own initiative and are responsible for compliance with local laws.",

    name_variant_notice:
      "You’re viewing the spelling «{variant}». This hub matches our index entry for «{canonical}».",

    hub_overview_h2: "What is ‘{name}’?",
    hub_overview_p:
      "‘{name}’ is a medicinal and traditional herb name—not a unique scientific identifier. In teas, remedies, and local plant lore the same word is often reused for different species, so ambiguity is common. Meaning depends heavily on region, language, and source; FloraLexicon ties each label to the scientific plants recorded for that context.",
    hub_regional_h2: "What does ‘{name}’ refer to in different countries?",
    hub_regional_intro:
      "Each line shows which scientific plant(s) our regional name records link to that country. Open the country page for a focused view, or the species page for full detail.",
    hub_regional_country_page_hint: "country page",
    hub_uses_h2: "What is {name} used for?",
    hub_uses_intro: "Across species linked to this name in FloraLexicon, recorded uses include:",
    hub_uses_suffix: "Exact use depends on species, plant part, and local practice.",
    hub_uses_none: "No use categories are aggregated for this name in the current index.",
    hub_use_tea: "tea",
    hub_use_medicinal: "medicinal use",
    hub_use_ritual: "ritual use",
    hub_use_culinary: "culinary use",
    hub_use_aromatic: "aromatic use",

    name_related_herb_names_h2: 'How is "{name}" called in other countries?',
    name_related_herb_names_lead:
      "Other common names in our index that point to the same plants as this label—useful for travel, markets, and cross-cultural remedies.",
    name_hub_countries_index_h2: "Used in these countries",
    name_hub_countries_index_lead:
      "Open a country-focused view of this name hub (same dataset as the regional breakdown below).",
    name_hub_plant_quick_nav_aria: "Jump to species in this name hub",
    name_hub_plant_quick_nav_label: "Plants for this name (quick links)",
    plant_detail_other_names_h2: "Other names for this plant",
    plant_detail_other_names_lead:
      "Indexed common-name hubs that reference this species—each link opens the disambiguation page for that label.",
    plant_detail_similar_uses_h2: "Similar medicinal herbs (shared uses)",
    plant_detail_similar_uses_lead:
      "Other species in this index that share at least one of the same traditional use categories:",

    seo_meaning_h2: "What does ‘{name}’ mean?",
    seo_meaning_lead: "‘{name}’ is a common or regional plant name, not a unique scientific identifier.",
    seo_correct_h2: "Which plant is correct?",
    seo_correct_p:
      "There is rarely one universal answer. The intended species depends on country, language, literature, and how the name is used (culinary, ornamental, medicinal, etc.). Use the region filter and the scientific names listed above to pick the best match for your context.",
    seo_uses_h2: "Common uses of ‘{name}’",
    seo_uses_with: "Across the species shown for this name in FloraLexicon, uses include:",
    seo_uses_suffix: "Exact use depends on the species and local practice.",
    seo_uses_none: "No use categories are aggregated for this name in the current index.",
    seo_faq_h2: "Frequently asked questions",

    ambiguity_note_high:
      "In this index the name is linked to more than one species. That usually means the same everyday label is used for different plants in different places or references.",
    ambiguity_note_medium:
      "Regional name records can share one scientific species while still reading differently by country or language. Compare the country tags and scientific names above.",
    ambiguity_note_low:
      "In this dataset the name currently resolves to a single species. Other field guides or languages may still use the same label for a different plant.",

    faq_q_same: "Is {name} always the same plant?",
    faq_a_same:
      "Not necessarily. Common names repeat across languages and regions. FloraLexicon shows which species are tied to this label in the current data; more than one row means the name is ambiguous here.",
    faq_q_country_named: "What is {name} in {country}?",
    faq_q_country_generic: "What is {name} in a given country?",
    faq_a_country_named:
      "When you select {country}, matches tied to that country are ranked first when available. Local checklists and national floras remain the authority for field identification.",
    faq_a_country_generic:
      "It varies by country and language. Use the region selector on this page to bias results toward name records from that area, then rely on the scientific name for a stable ID.",
    faq_q_safe: "Is {name} safe?",
    faq_a_safe:
      "Safety depends on the exact species, plant part, preparation, and individual context. FloraLexicon does not give medical, nutritional, or toxicity guidance; consult qualified professionals and trusted references.",
    faq_q_hub_species: "Which scientific species are linked to {name}?",
    faq_a_hub_species:
      "Every indexed species appears in the possible matches above, with countries and uses. When you see more than one plant, the same common name is used for different species in different regions—use scientific names and region context to choose the right one.",
    faq_q_hub_remedies: "Is {name} used in traditional remedies?",
    faq_a_hub_remedies:
      "Our dataset may list teas, medicinal, ritual, or culinary uses for linked species. That is informational only: common names are not enough to identify a plant safely—verify with qualified sources before any health-related use.",

    decision_uses_fallback: "general plant references",
    decision_when_region:
      "This is the most common meaning of '{q}' in {country} among the regional records in this index. Typical uses listed here include: {uses}.",
    decision_when_single:
      "Name records tie '{q}' to this species especially in {country}. Uses often associated with this entry: {uses}.",
    decision_when_multi:
      "Choose this match if your context is {places}, or your source matches those regional labels. Uses associated with this species: {uses}.",
    decision_when_fallback:
      "This species is one of the indexed interpretations of '{q}'. Listed uses: {uses}.",
    decision_diff_genus:
      "Unlike other plants called '{q}' here, this one is {genus} in the {family}; the other matches are in {genera}.",
    decision_diff_same_family:
      "This is {scientific}. Other indexed matches for '{q}' are different species within {family}.",
    decision_diff_families:
      "Unlike other plants called '{q}' in this index, this species is in the {family} family. Other matches belong to {families}.",

    defined_term_desc: "Cross-cultural herb name translator with regional context",

    meta_home_title: "Herb Name Translator Across Countries | FloraLexicon",
    meta_home_desc:
      "Translate traditional herb names for teas and remedies. See local names by country, then verify the plant with scientific naming when you need certainty.",
    meta_names_title: "Plant Names Index",
    meta_names_desc: "Browse plant names and discover their scientific equivalents.",
    meta_plants_title: "Plants index",
    meta_plants_desc:
      "Browse species in the FloraLexicon index: scientific names, families, and links to full records.",
    meta_plant_desc_suffix: "— native range, uses, and taxonomic details on FloraLexicon.",
    meta_plant_desc: "{name} ({family}) — native range, uses, and taxonomic details on FloraLexicon.",
    meta_plant_not_found_title: "Plant not found",
    meta_name_missing_title: "Name not in index",
    meta_name_missing_desc:
      "No plants found for this name in FloraLexicon. Try another common name or check spelling.",
    meta_name_match_title: 'What is "{name}" called in different countries?',
    meta_name_match_desc:
      'Find what "{name}" is called in different countries. Compare local herb names and verify the correct plant using scientific classification.',
    meta_name_country_title: "What is {name} in {country}?",
    meta_name_country_desc:
      "Most common plant linked to «{name}» in {country}, local usage notes, and links to the full name hub and species pages.",
    name_country_breadcrumb_hub: "All meanings of this name",
    name_country_kicker: "Country context",
    name_country_h1: "What is «{name}» in {country}?",
    name_country_intro:
      "In FloraLexicon’s index for {country}, «{name}» is most often tied to the species below. The same label may refer to other species elsewhere—open the name hub to compare every match.",
    name_country_primary_heading: "Most common plant in this country",
    name_country_primary_lead:
      "{scientific} is the primary indexed match for «{name}» in {country} when regional records are available.",
    name_country_other_species_heading: "Other species tied to this name (broader index)",
    name_country_uses_heading: "Typical uses in traditional and medicinal contexts",
    name_country_native_range_heading: "Native range and regions",
    name_country_hub_cta: "Compare all meanings of «{name}» →",
    name_hub_compare_cta: "Open full comparison: differences, uses, and regions →",
    name_hub_species_h2: "Scientific plants associated with ‘{name}’",
    name_hub_species_lead:
      "{count} indexed species match this name below. Scientific names are the stable ID—compare cards and regions before you rely on the common label alone.",
    name_intro_p1:
      '"{name}" is a common herb name used in traditional medicine, teas, and local remedies. Its meaning changes depending on country and context, and may refer to different plants.',
    name_intro_p2:
      "Use the country filter below to find the most relevant match for your region.",
    name_instant_answer_lead: "{name} is commonly known as:",
    name_instant_answer_closing_single:
      "It often refers to species in the {genus} genus—exact meaning still depends on region, language, and what you are buying.",
    name_instant_answer_closing_multi:
      "It may refer to different plants depending on region and local tradition—always match the label to where you are.",
    name_instant_answer_where_recorded:
      "In our index, this spelling is tied to records from:",
    name_also_called_h2: "Also called",
    name_also_called_lead:
      "Other common names for the same plants in FloraLexicon, with countries where each label appears in the data.",
    name_country_mappings_h2: "Country mappings",
    name_country_mappings_intro:
      "Each country links to a focused view of this herb name. Plants listed are every indexed species tied to that country for this label.",
    name_country_hub_link_title: "Open country view for this herb name",
    name_country_resolution_h2: "What does '{name}' refer to in each country?",
    name_alternatives_h2: "Other species this name can mean",
    name_global_name_network_h2: "This plant is known by different names worldwide",
    name_hub_common_uses_h2: "Common uses",
    name_primary_query_line: "Resolving «{name}»",
    name_page_h1_what_is: 'What is "{name}"?',
    name_primary_refers_to: "Most commonly refers to:",
    name_primary_why_multi: "Most common match across {count} countries",
    name_primary_why_coverage: "Highest regional coverage",
    name_primary_why_dominant_country: "Dominant in {country}",
    name_primary_why_common_global: "Most common globally",
    name_primary_why_frequent_match: "Frequent match",
    name_hub_score_suffix: "match score",
    name_confidence_tooltip_main:
      "This score reflects global agreement, regional dominance, and frequency of use across countries.",
    plant_limited_data_badge: "Limited data",
    plant_ghost_mapping_note:
      "This plant is partially mapped from regional name data.",
    common_names_label: "Common names:",
    plant_placeholder_title: "Plant not fully indexed yet",
    plant_placeholder_subtitle:
      "This name is used in multiple countries, but the species is not yet fully mapped.",
    name_also_known_show_all: "Show all ({n} more)",
    name_languages_heading: "How this plant is called in different languages",
    name_group_ascii_names: "English / international spellings",
    name_group_nonascii_names: "Spanish / Portuguese & accented spellings",
    plantcard_most_common_in: "Most common in:",
    plantcard_used_for: "Used for:",
    hub_use_human_tea: "Herbal tea",
    hub_use_human_medicinal: "Traditional medicine",
    hub_use_human_ritual: "Ritual or ceremonial use",
    hub_use_human_culinary: "Cooking & seasoning",
    hub_use_human_aromatic: "Aromatic use",
    name_hub_matches_h2: 'Matches for "{name}"',
    name_hub_matches_lead:
      "{count} indexed plant match(es) below. Compare where each is common, how it is used, and other local names before you rely on a single translation.",
    name_hub_explore_h2: "Explore related herbs",
    name_hub_explore_lead:
      "Synonyms and nearby labels in the index, plus curated lists by traditional use.",
    name_hub_explore_similar_heading: "Similar names",
    name_hub_global_h2: "Where is ‘{name}’ used?",
    name_hub_global_intro:
      "In this index, regional name records tie «{name}» to the following countries (most frequently recorded first):",
    geo_expand_countries: "+{n} more",
    geo_collapse_countries: "Show less",
    compare_meta_title: "{a} vs {b} | FloraLexicon",
    compare_meta_desc:
      "Differences between {a} and {b}: family, traditional uses, and regions—two plants people often confuse under similar names.",
    compare_h1: "{a} vs {b}",
    compare_intro:
      "These are distinct species that sometimes share similar common names or regional labels. Use the table below to match your source.",
    compare_diff_heading: "Key differences",
    compare_diff_families: "Families differ: {a} vs {b}.",
    compare_same_family: "Both are in the {family} family—compare genus, uses, and range below.",
    compare_diff_genera: "Genera: {ga} vs {gb}.",
    compare_table_uses: "Traditional uses (index)",
    compare_table_regions: "Regions / native range",
    plant_explore_heading: "Explore further",
    internal_link_browse_names: "Browse all plant names",
    internal_link_all_plants: "All plants index",
    category_top_names_heading: "Names in this category",
    category_top_names_lead:
      "Resolve these common labels to species—many appear alongside the plants listed above.",
    meta_about_desc:
      "FloraLexicon is a plant name resolution engine operated by Albor Digital LLC, mapping common names to scientific taxonomy.",
    meta_contact_desc_prefix: "Contact FloraLexicon at",
    meta_contact_desc_suffix: "for questions, corrections, or feedback.",
    meta_disclaimer_desc:
      "FloraLexicon provides informational content only. Plant identification and usage vary by region; verify with qualified sources.",
    meta_privacy_desc_prefix: "How",
    meta_privacy_desc_suffix:
      "collects, uses, and protects information when you use FloraLexicon.",
    meta_terms_desc_prefix: "Terms governing use of FloraLexicon, operated by",

    privacy_about_link: "About",
    page_privacy_title: "Privacy Policy",
    page_terms_title: "Terms of Service",
    legal_english_only_notice:
      "This legal document is provided in English only; a full translation may follow later.",

    terms_see_disclaimer: "Disclaimer",

    home_why_para1:
      "The same herb name often refers to different plants depending on country, language, or context. That is especially common with medicinal herbs, teas, and local remedies.",
    home_why_para2:
      "The same plant can carry many different local names across regions and traditions. FloraLexicon helps you see what to ask for in another country, then verify the species when you need certainty.",
    home_medicinal_title: "Built for traditional and medicinal herb use",
    home_medicinal_body:
      "FloraLexicon focuses on herbs used in teas, remedies, and traditional medicine across cultures. It helps you find the correct local name and confirm the plant — not catalog ornamental species.",

    plant_detail_def_line1:
      "{scientific} is a {kind} traditionally discussed for {themes} in FloraLexicon’s ethnobotanical index.",
    plant_detail_def_line2:
      "It is commonly known as {examples} in different regions and languages.",
    plant_detail_def_and: "and",
    plant_detail_kind_medicinal_herb: "medicinal herb",
    plant_detail_kind_plant: "plant",
    plant_detail_theme_digestive: "digestive support",
    plant_detail_theme_inflammation: "everyday inflammation comfort",
    plant_detail_theme_respiratory: "respiratory comfort",
    plant_detail_theme_womens: "women’s health traditions",
    plant_detail_theme_relax: "relaxation and sleep",
    plant_detail_theme_skin: "skin and wound-care traditions",
    plant_detail_theme_pain: "muscle and joint comfort",
    plant_detail_theme_general: "traditional household and herbal contexts",
    plant_detail_used_for: "Used for",
    plant_detail_page_scope:
      "Traditional-use themes, index safety flags, and how local herb names differ by country.",
    plant_detail_sources_footnote:
      "Last updated from FloraLexicon’s merged ethnobotanical index—informational only; see disclaimer.",
    plant_detail_also_known: "Also known as",
    plant_detail_safety_badge_toxic: "Index toxicity",
    plant_detail_safety_badge_lookalike: "Look‑alike / name risk",
    plant_detail_safety_confusable_warning:
      "⚠️ Confusable species: similar common names or look‑alikes may be a different plant. Confirm identity before use.",
    plant_detail_regions_use_heading: "Regional naming in the index",
    plant_detail_regions_uniform: "Used similarly across regions in this index slice—differences are mostly in local names, not separate use rows.",
    plant_detail_regions_arrow: "→",
    plant_detail_related_match_genus: "· same genus",
    plant_detail_related_match_theme: "· shared indexed theme",
    plant_detail_related_blurb: "Same genus first, then species that share an indexed condition with this plant.",
    plant_detail_cond_one_digest:
      "Often indexed for easing mild bloating and everyday digestive discomfort (traditional context only).",
    plant_detail_cond_one_inflam:
      "Commonly grouped with mild, everyday inflammation comfort—not a treatment claim.",
    plant_detail_cond_one_respiratory:
      "Traditionally associated with gentle respiratory comfort in regional records.",
    plant_detail_cond_one_womens:
      "Recorded in some traditions for women’s health folk use—verify locally and with a clinician when relevant.",
    plant_detail_cond_one_relax:
      "Often linked to calm, sleep, or stress ease in informal herbal use contexts.",
    plant_detail_cond_one_skin:
      "Sometimes noted for skin or wound-care folk traditions; verify species and hygiene.",
    plant_detail_cond_one_pain:
      "May appear with muscle or joint comfort discussions in the index.",
    plant_detail_cond_one_circulation:
      "Sometimes listed near circulation or vascular folk traditions—confirm sources.",
    plant_detail_cond_one_fallback:
      "Indexed under “{label}” for traditional context—verify identification and local guidance.",
    plant_detail_safety_block_title: "Safety",
    plant_detail_safety_level: "Level",
    plant_detail_safety_avoid: "Avoid if",
    plant_detail_safety_interactions: "Interactions",
    plant_detail_safety_lookalike: "Look‑alike risk",
    plant_detail_safety_lookalike_yes: "Yes",
    plant_detail_safety_lookalike_no: "No",
    plant_detail_avoid_pregnant: "Pregnant or breastfeeding (per index flags)",
    plant_detail_avoid_none: "No extra “avoid if” flags in the index slice",
    plant_detail_interact_none: "None called out beyond the notes below",
    plant_detail_interact_sedatives_bloodthinners:
      "Possible interactions: sedatives or blood thinners (if noted in sources—verify)",
    plant_detail_amb_alert:
      "This species is sometimes confused with other plants called “{common}”. Different species can have different effects and safety profiles.",
    plant_detail_amb_compare_cta: "Compare all “{common}” plants →",
    plant_detail_faq_heading: "Common questions",
    plant_detail_faq_q_daily: "Is {name} safe to drink daily?",
    plant_detail_faq_a_daily:
      "Many people use moderate amounts in teas, but safety depends on the exact species, dose, medications, and your health context. This page is informational only—ask a qualified clinician when unsure.",
    plant_detail_faq_q_used: "What is {name} used for?",
    plant_detail_faq_a_used:
      "In FloraLexicon’s index, this species is most often associated with: {themes}. Traditional use is not proof of benefit or safety for any person.",
    plant_detail_faq_q_confused: "Can {name} be confused with other plants?",
    plant_detail_faq_a_confused:
      "Yes—shared common names are a major source of mix‑ups. When you see an ambiguity callout below, open the name hub to compare scientific species side by side.",
    plant_detail_faq_q_safe: "Is {name} safe?",
    plant_detail_faq_a_safe:
      "The index labels toxicity as {safety}. Common themes include {themes}. This is not a personal risk assessment—ask a qualified clinician for your situation.",

    plant_detail_meta_title: "{name} — uses, benefits, safety | FloraLexicon",
    plant_detail_meta_title_v2: "{name}: uses, benefits, safety, and risks | FloraLexicon",
    plant_detail_meta_title_positioning: "{name} — Common Names Across Countries",
    plant_detail_meta_desc_positioning:
      "Local and regional herb names for {name} across countries. Compare labels by region and verify the species in FloraLexicon.",
    plant_detail_meta_desc:
      "{lead} Safety context in the index: {safety}. Informational only—not medical advice.",
    plant_detail_meta_desc_v2:
      "{uses}. Index safety: {safety}. Informational only—not medical advice.",
    plant_detail_safety_critical:
      "High toxicity risk is flagged for some uses in our index. Verify the exact species and consult qualified sources before any use.",
    plant_detail_safety_lethal:
      "Severe toxicity may be possible. Do not self-treat; seek authoritative safety guidance.",
    plant_detail_description_lead:
      "A {type} in the {family} family ({genus}), with indexed traditional use categories: {uses}.",
    plant_detail_common_names: "Common names",
    plant_detail_common_in_label: "Common in:",
    plant_detail_called_in_countries_h2: "What is this herb called in different countries?",
    plant_detail_called_in_countries_lead:
      "Indexed common names for this species, grouped by country. Each label opens that name’s hub.",
    plant_detail_browse_uses_lead: "Browse by use:",
    plant_detail_short_intro: "Overview",
    plant_detail_facts: "At a glance",
    plant_detail_fact_family: "Family",
    plant_detail_fact_regions: "Countries & regions (index)",
    plant_detail_fact_evidence: "Evidence label (index)",
    plant_detail_fact_toxicity: "Toxicity (index)",
    plant_detail_fact_sustainability: "Sustainability / harvest",
    plant_detail_uses_heading: "Uses & indexed themes",
    plant_detail_uses_none:
      "No extra therapeutic themes are listed for this species in the current index slice—see traditional use categories above.",
    plant_detail_uses_group_blurb:
      "This theme appears in FloraLexicon’s regional/ethnobotanical index for this species.",
    plant_detail_safety_heading: "Safety notes",
    plant_detail_safety_intro:
      "These flags summarize dataset metadata. They are not a safety guarantee and do not replace professional advice.",
    plant_detail_contra_heading: "Precautions (index)",
    plant_detail_contra_pregnancy: "Pregnancy & lactation",
    plant_detail_lookalike: "Look‑alike / name confusion",
    plant_detail_evidence_heading: "Evidence label",
    plant_detail_evidence_read_concept: "How FloraLexicon labels evidence →",
    plant_detail_regions_heading: "Geography",
    plant_detail_regions_origin: "Native / origin regions (dataset)",
    plant_detail_regions_index: "Where it appears in the index",
    plant_detail_regions_diff:
      "When countries differ from native range, it usually reflects where names and uses were recorded—not a claim that the plant is wild everywhere listed.",
    plant_detail_amb_heading: "Names that can mean more than one plant",
    plant_detail_amb_headline: "⚠️ Same common name, different species",
    plant_detail_amb_confused_line:
      "This plant is sometimes confused with other species called “{common}”.",
    plant_detail_amb_intro_strong:
      "This plant is sometimes confused with other species that share the same everyday name.",
    plant_detail_amb_intro:
      "Different species can have different chemistry, traditions, and safety. Compare scientific names before use.",
    plant_detail_amb_species_line: "Other indexed species under this name:",
    plant_detail_related_heading: "Related species",
    plant_detail_related_same_genus: "Same genus in this index",
    plant_detail_use_topical: "Topical use",
    plant_detail_value_not_listed: "Not listed in the current index slice.",
    plant_detail_flag_abortifacient:
      "Strong uterine / pregnancy‑related cautions appear in the index for some traditions—treat as high risk until verified.",
    plant_detail_tox_notes: "Notes",
    plant_detail_tox_lethal: "Very high concern",
    plant_detail_tox_high: "High concern",
    plant_detail_tox_moderate: "Moderate concern",
    plant_detail_tox_low: "Lower concern in index",
    plant_detail_tox_unknown: "Not specified",
    plant_detail_evid_clinical: "Clinical / stronger study context (label)",
    plant_detail_evid_tramil: "TRAMIL‑style regional phytotherapy context (label)",
    plant_detail_evid_empirical: "Empirical / mixed evidence context (label)",
    plant_detail_evid_traditional: "Traditional / ethnobotanical context (label)",
    plant_detail_sus_at_risk: "At‑risk harvest pressure (index)",
    plant_detail_sus_caution: "Caution (index)",
    plant_detail_sus_safe: "Lower concern (index)",
    plant_detail_contra_anticoagulant: "Blood thinner interactions (caution)",
    plant_detail_contra_liver: "Liver / metabolism caution",
    plant_detail_badge_toxic: "Toxicity: {level}",
    plant_detail_badge_lookalike: "Name confusion possible",
    plant_detail_tox_flags: "Index safety flags",
  },
  es: {
    nav_home: "Inicio",
    nav_plant_names: "Nombres de hierbas",
    nav_plants: "Plantas",
    nav_concepts: "Conceptos",
    concepts_meta_index_title: "Entender los nombres de plantas | FloraLexicon",
    concepts_meta_index_desc:
      "Glosario estructurado: ambigüedad, nombres binomiales, sinónimos, uso regional, niveles de evidencia y desambiguación en FloraLexicon.",
    concepts_hero_h1: "Entender los nombres de plantas",
    concepts_hero_lead:
      "Notas de referencia sobre cómo interactúan nombres comunes, ciencia y regiones—sin artículos largos.",
    concepts_core_heading: "Conceptos centrales",
    concepts_all_heading: "Todos los conceptos",
    concepts_related_heading: "Conceptos relacionados",
    concepts_example_label: "Ejemplo en el índice",
    concepts_try_query: "Abrir resolución del nombre →",
    concepts_system_label: "En FloraLexicon",
    concepts_appears_heading: "Este concepto aparece en",
    concepts_name_queries_label: "Consultas por nombre",
    concepts_plant_pages_label: "Fichas de planta",
    concepts_no_name_examples: "Aún no hay ejemplos de nombres seleccionados para este concepto.",
    concepts_plant_pages_pending: "Las fichas de especies aún no enlazan a conceptos del glosario.",
    concepts_cta_title: "Explora nombres de plantas entre idiomas",
    concepts_cta_link: "Ver índice de nombres →",
    concept_hint_multiple_plants:
      "Este nombre puede referirse a varias plantas. Saber por qué →",
    concept_hint_evidence_levels:
      "Cómo las etiquetas de evidencia se relacionan con la seguridad →",
    concepts_evidence_badge_traditional: "[Tradicional]",
    concepts_evidence_badge_preliminary: "[Estudiado]",
    concepts_evidence_badge_clinical: "[Clínico]",
    concepts_evidence_badge_caution: "[Precaución]",
    plant_ontology_crosslinks_aria: "Temas del glosario relacionados",
    plant_ontology_synonyms_link: "Sinónimos y nombres de plantas",
    plant_ontology_synonyms_desc:
      "por qué una misma especie puede tener muchas etiquetas en fuentes e índices.",
    plant_ontology_regions_link: "Nombres regionales de plantas",
    plant_ontology_regions_desc:
      "por qué la misma u otras especies comparten nombres entre países.",
    concepts_core_badge: "Esencial",
    concepts_jsonld_about: "Nomenclatura botánica",

    search_meta_title: "Buscar nombres de plantas | FloraLexicon",
    search_meta_desc:
      "Búsqueda desambiguada: vea todas las especies indexadas para un nombre común, ordenadas con confianza y contexto de seguridad.",
    search_ambiguity_notice:
      "Este nombre se usa para distintas plantas según la región y la tradición.",
    search_subtitle_multi: "Este nombre puede referirse a varias plantas",
    search_subtitle_single: "Este nombre coincide con una especie en nuestro índice",
    search_rank_intro: "{name} puede referirse a estas plantas:",
    search_tier_most_likely: "Más probable",
    search_tier_possible: "Posible coincidencia",
    search_tier_less_common: "Menos frecuente",
    search_conf_bar_high: "Alta",
    search_conf_bar_medium: "Media",
    search_conf_bar_low: "Baja",
    search_confidence_visual: "Confianza",
    search_disamb_common_in: "Más frecuente en {country}",
    search_inline_reason_region: "Frecuente en {country}",
    search_inline_reason_region_specific: "Frecuente en {regionLabel}",
    search_tooltip_lookalike:
      "A menudo se confunde con especies similares—verifique la identificación antes de usar.",
    search_card_sources_extra: "(+{count} más)",
    search_card_sources_less: "Mostrar menos",
    search_geo_label_us_ne: "noreste de EE. UU.",
    search_geo_label_us_se: "sureste de EE. UU.",
    search_geo_label_us_nw: "noroeste de EE. UU.",
    search_geo_label_us_sw: "suroeste de EE. UU.",
    search_geo_label_us_nc: "centro-norte de EE. UU.",
    search_geo_label_us_sc: "centro-sur de EE. UU.",
    search_geo_label_us_ec: "centro-este de EE. UU.",
    search_geo_label_us_wc: "centro-oeste de EE. UU.",
    search_geo_label_us_pnw: "Pacífico Noroeste (EE. UU.)",
    search_geo_label_mx_baja: "Baja California (MX)",
    search_inline_reason_usage: "Según uso frecuente del nombre",
    search_evidence_clinical: "Literatura clínica (si está indexada)",
    search_evidence_tramil: "Fuentes regionales / tipo TRAMIL",
    search_evidence_traditional: "Uso tradicional (indexado)",
    search_evidence_empirical:
      "Reportes empíricos / observacionales (indexados; no equivalen a TRAMIL)",
    search_safety_toxic:
      "Puede haber toxicidad o precauciones — verifique antes de usar.",
    search_safety_abort:
      "En fuentes tradicionales puede asociarse a riesgo reproductivo — consulte a un profesional.",
    search_card_badge_toxic: "⚠️ Tóxico",
    search_card_badge_caution: "⚠️ Precaución",
    search_card_badge_precaution: "⚠️ Posible riesgo",
    search_card_badge_lookalike: "⚠️ Especies confundibles",
    search_card_sub_toxic: "No para automedicación",
    search_card_sub_caution: "Use con orientación profesional",
    search_facts_family: "Familia",
    search_facts_region: "Nativa / área (índice)",
    search_facts_evidence: "Nivel de evidencia",
    search_global_safety_multi:
      "Este nombre puede referirse a varias plantas—los usos y la seguridad pueden variar. Compare cada coincidencia y verifique antes de usar.",
    search_global_safety_combined:
      "Este nombre se refiere a varias plantas—algunas pueden ser tóxicas o confundirse con especies parecidas. Compare con cuidado y busque asesoramiento cualificado ante la duda.",
    search_global_safety_toxic_only:
      "Esta planta puede ser tóxica o insegura en algunos usos. No se automedique; consulte a un profesional cualificado.",
    search_global_lookalike_soft:
      "Algunos resultados pueden confundirse con especies similares—verifique el nombre científico y las referencias antes de usar.",
    search_card_sources: "Fuentes: {list}",
    search_source_label_mexico: "México",
    search_source_label_north_america: "Norteamérica",
    search_source_label_catalog: "Fusión de catálogo",
    search_inline_why_lead: "¿Por qué hay varios resultados?",
    search_inline_why_cta: "Saber por qué →",
    search_why_heading: "¿Por qué este resultado?",
    search_why_top_country: "Señal regional más fuerte en nuestro índice: {country}",
    search_why_user_country: "Aparece con su región ({country}) en registros de nombres",
    search_why_freq_high: "Muy vinculada a este nombre entre países en nuestros datos",
    search_why_freq_mid: "Asociación moderada con este nombre en registros regionales",
    search_why_freq_low: "Una asociación menos frecuente para esta etiqueta en el índice",
    search_why_evidence_traditional: "Apoyada por contexto de uso tradicional en el índice",
    search_why_evidence_empirical:
      "Indexada como evidencia empírica / observacional (no equivale a protocolo TRAMIL)",
    search_why_evidence_tramil: "Evidencia regional / tipo compendio donde está indexada",
    search_why_evidence_clinical:
      "Tipo de evidencia indexada más fuerte (clínica / fuentes estructuradas)",
    search_why_tea_fit:
      "Los usos indexados incluyen té o contexto culinario—mejor encaje para infusiones",
    search_why_tea_uncertain:
      "No figura de forma destacada como té o culinaria—extremar precaución con infusiones",
    search_why_medicinal_fit: "Indexada con uso medicinal o de bienestar",
    search_why_safety_focus:
      "El orden considera su pregunta sobre toxicidad o seguridad",
    search_empty_no_hub_title: "No hay coincidencia exacta",
    search_empty_no_hub_body:
      "Pruebe otra grafía, un nombre regional o explore el índice de plantas.",
    search_empty_browse_plants: "Ver todas las plantas",
    search_empty_browse_names: "Ver nombres de plantas",
    search_prompt_title: "Busque un nombre de planta",
    search_prompt_body:
      "Escriba un nombre común. Mostramos cada especie indexada y qué tan frecuente es la asociación—sin elegir un único resultado.",

    lang_en: "EN",
    lang_es: "ES",

    search_placeholder:
      "Busca un nombre de hierba (ej. ruda, cedrón, manzanilla)",
    search_placeholder_short: "ej. manzanilla, matico",
    search_button: "Buscar",
    search_label_sr: "Nombre de hierba",
    hero_title: "Descubre cómo se llama tu hierba en otros países",
    hero_lead:
      "Traduce nombres tradicionales de hierbas usados en infusiones, remedios y medicina local. Encuentra nombres locales en distintas culturas y verifica la planta exacta cuando lo necesites.",
    hero_search_helper:
      "Usa nombres comunes o regionales. Los resultados muestran cómo se conoce la hierba en cada país.",
    examples_label: "Ejemplos:",
    home_how_title: "Cómo funciona FloraLexicon",
    home_how_1_title: "Escribe el nombre de una hierba",
    home_how_1_body:
      "— la que suele usarse en infusiones, remedios o medicina tradicional.",
    home_how_2_title: "Mira cómo se llama en distintos países",
    home_how_2_body:
      "— agrupamos nombres locales y regiones con los países donde aparece cada etiqueta.",
    home_how_3_title: "Confirma la planta con el nombre científico",
    home_how_3_body:
      "— cuando necesites certeza, usa el nombre científico como comprobación estable, no como primer paso al buscar.",
    home_why_title: "Por qué los nombres confunden",
    home_popular_title: "Búsquedas populares de hierbas medicinales",
    home_popular_cta: "Ver resolución →",
    home_browse_title: "Explorar hierbas y especies",
    home_browse_lead:
      "Explora nombres de hierbas medicinales y tradicionales en el índice, o abre fichas de especies para contextualizar la identificación de hierbas.",
    home_all_plants: "Todas las plantas",
    home_all_names: "Todos los nombres",
    home_browse_by_use_title: "Explorar por uso",
    home_link_medicinal_herbs: "Hierbas medicinales",
    home_link_culinary_herbs: "Hierbas culinarias y medicinales",
    home_link_ritual_herbs: "Hierbas rituales",
    home_country_hub_title: "Explorar hierbas por país",
    home_country_hub_lead:
      "Explora hierbas usadas con frecuencia en cada país y sus nombres locales.",

    plant_categories_label: "Categorías:",
    category_name_medicinal: "Medicinal",
    category_name_culinary_medicinal: "Culinaria-medicinal",
    category_name_ritual: "Ritual",
    plant_view_more_medicinal: "Ver más hierbas medicinales",
    plant_view_more_culinary_medicinal: "Ver más hierbas culinarias y medicinales",
    plant_view_more_ritual: "Ver más hierbas rituales",

    meta_category_medicinal_title: "Hierbas medicinales en el mundo | FloraLexicon",
    meta_category_medicinal_desc:
      "Explora hierbas usadas tradicionalmente en infusiones y remedios naturales en distintas culturas. FloraLexicon ayuda a identificar plantas medicinales por nombre entre regiones.",
    category_medicinal_h1: "Hierbas medicinales en el mundo",
    category_medicinal_intro:
      "Explora hierbas usadas tradicionalmente en infusiones y remedios naturales en distintas culturas. FloraLexicon ayuda a identificar plantas medicinales por nombre entre regiones.",

    meta_category_culinary_title: "Hierbas culinarias y medicinales | FloraLexicon",
    meta_category_culinary_desc:
      "Descubre hierbas empleadas tanto en la cocina como en remedios tradicionales, incluidas orégano, menta y otras.",
    category_culinary_h1: "Hierbas culinarias y medicinales",
    category_culinary_intro:
      "Descubre hierbas empleadas tanto en la cocina como en remedios tradicionales, incluidas orégano, menta y otras.",

    meta_category_ritual_title: "Hierbas tradicionales y rituales | FloraLexicon",
    meta_category_ritual_desc:
      "Explora hierbas usadas en prácticas tradicionales, rituales culturales y medicina indígena.",
    category_ritual_h1: "Hierbas tradicionales y rituales",
    category_ritual_intro:
      "Explora hierbas usadas en prácticas tradicionales, rituales culturales y medicina indígena.",
    category_empty_list: "Ninguna planta de esta categoría coincide con el índice actual.",
    category_medicinal_seo_p2:
      "Cada especie enlaza a su ficha con notas de seguridad y región. Los concentradores de nombre enlazan a la desambiguación cuando una etiqueta corresponde a más de una planta científica.",
    category_medicinal_country_heading: "Explorar por país",
    category_medicinal_country_lead:
      "Las páginas regionales listan especies y nombres registrados para ese país en el conjunto fusionado de FloraLexicon.",
    category_plant_list_h2: "Especies en esta categoría",
    category_plant_list_truncated:
      "Se muestran {shown} de {total} especies—usa los hubs por país o la búsqueda para ver más.",
    category_footer_nav_aria: "Más formas de explorar",

    meta_herbs_country_title: "Hierbas medicinales en {country} | FloraLexicon",
    meta_herbs_country_desc:
      "Especies y nombres comunes indexados para {country} en FloraLexicon: enlaces a fichas de planta y a la desambiguación de nombres.",
    herbs_country_h1: "Hierbas medicinales en {country}",
    herbs_country_intro:
      "Las plantas siguientes figuran en el índice regional de FloraLexicon para {country} (fragmento etnobotánico fusionado). Sirven como punto de partida: verifique identificación y normativa local.",
    herbs_country_intro_seo:
      "El uso tradicional y medicinal varía por especie y fuente. Siga los enlaces a la ficha de cada planta para categorías de uso indexadas, o abra un concentrador de nombre cuando la misma etiqueta pueda designar más de una especie.",
    herbs_country_nav_aria: "Listados relacionados",
    herbs_country_nav_medicinal: "Hierbas medicinales en el mundo",
    herbs_country_nav_plants: "Todas las plantas del índice",
    herbs_country_nav_names: "Explorar nombres de plantas",
    herbs_country_names_h2: "Nombres comunes registrados en {country}",
    herbs_country_names_lead:
      "Cada etiqueta abre el concentrador de ese nombre en el índice de FloraLexicon.",
    herbs_country_plants_h2: "Especies indexadas para {country}",
    herbs_country_plants_cap: "Se muestran {shown} de {total} especies.",
    herbs_country_empty:
      "Aún no hay especies del índice reducido que listen este país en el conjunto fusionado.",

    site_disclaimer_strip: "La información de este sitio es solo educativa.",
    footer_tagline_a: "FloraLexicon traduce nombres cotidianos y regionales de hierbas entre países, con",
    footer_tagline_b: "nombres científicos",
    footer_tagline_c: " como capa de verificación cuando necesitas estar seguro.",
    footer_info_only_title: "Solo fines informativos",
    footer_info_only_body:
      "no es consejo médico, legal, de recolección ni de identificación profesional. Consulta nuestro",
    footer_disclaimer: "Aviso legal",
    footer_operated: "FloraLexicon es operado por",
    footer_nav_about: "Acerca de",
    footer_nav_contact: "Contacto",
    footer_nav_names: "Nombres",
    footer_nav_privacy: "Privacidad",
    footer_nav_terms: "Términos",

    name_label_plant_name: "Nombre de planta",
    name_h1: "¿Cómo se llama «{name}» en distintos países?",
    name_spelling_match: "Agrupamos esta grafía como:",
    name_ambiguity_label: "Ambigüedad",
    ambiguity_low: "Baja",
    ambiguity_medium: "Media",
    ambiguity_high: "Alta",
    ambiguity_banner_high:
      "Este nombre puede referirse a distintas plantas según la región. Compara las opciones antes de decidir.",
    ambiguity_banner_medium:
      "Este nombre puede referirse a más de una planta. Usa el contexto regional y las diferencias resaltadas abajo.",
    country_label: "País",
    country_all: "Todos los países",
    country_helper: "Elige tu país para ver la planta más relevante para tu región.",
    name_no_matches_title: "No hay plantas para este nombre.",
    name_no_matches_body:
      "Puede no estar en el índice o estar escrito de otra forma. Prueba la búsqueda desde el inicio u otro nombre regional.",
    options_section_aria: "Plantas coincidentes",
    options_heading: "Tus opciones ({count})",
    possible_match: "Posible coincidencia n.º {n}",
    name_confidence_most_likely: "Coincidencia más probable",
    name_confidence_high_badge: "Señal regional fuerte",
    name_confidence_percent: "{percent}%",
    name_quick_answer_sr: "Respuesta breve",
    name_quick_answer_lead: "«{name}» se refiere con más frecuencia a:",
    name_quick_answer_common_in: "Frecuente en",
    visual_reference: "Referencia visual",
    when_correct_title: "¿Cuándo es la planta correcta?",
    how_differs_title: "En qué se diferencia",
    common_in: "Común en:",
    family: "Familia",
    uses: "Usos",
    genus: "Género",
    rank: "Rango",
    type: "Tipo",
    origin: "Origen",
    region_badge: "Más frecuente en tu región",
    comparison_title: "Comparación lado a lado",
    comparison_show: "Comparar estas plantas",
    comparison_hide: "Ocultar comparación",
    comparison_col_name: "Nombre de la planta",
    comparison_col_family: "Familia",
    comparison_col_uses: "Usos",
    comparison_col_regions: "Regiones",

    same_plant_heading: "Otros nombres de estas plantas",
    also_known_as: "También conocida como",
    plant_hub_also_called: "También se llama:",

    names_index_h1: "Índice de nombres de hierbas",
    names_index_lead:
      "Lista alfabética de nombres comunes y regionales en FloraLexicon. Cada enlace abre el contexto por país y las plantas asociadas a esa etiqueta.",
    names_index_other: "Otros",

    plants_index_h1: "Plantas",
    plants_index_lead:
      "Especies del índice (nombres científicos): abre una ficha para ver nombres comunes por país y notas de uso tradicional.",

    prog_name_no_index:
      "«{name}» es un nombre de planta que mucha gente consulta. FloraLexicon aún no asocia esta grafía a especies en el índice público.",
    prog_name_intro_countries: "«{name}» es un nombre común de planta usado en {countries}.",
    prog_name_intro_fallback:
      "«{name}» es un nombre común de planta en este índice; las especies enlazadas aparecen abajo.",
    prog_name_disambiguation:
      "Este nombre puede referirse a varias especies según la región.",
    prog_name_uses: "Las plantas asociadas a este nombre suelen usarse para: {uses}.",
    prog_plant_family: "{scientific} es una especie de la familia {family}.",
    prog_plant_uses: "Tradicionalmente se asocia a usos como {uses}.",

    contact_title: "Contacto",
    contact_lead: "Para preguntas, correcciones o comentarios:",
    about_title: "Acerca de FloraLexicon",
    about_p1:
      "FloraLexicon es un traductor global de nombres de hierbas: ayuda a saber cómo se llama una hierba medicinal o tradicional en otros países y luego a verificar la planta correcta cuando la etiqueta es ambigua.",
    about_p2:
      "Está pensado para infusiones, remedios y compras entre culturas, no como enciclopedia botánica completa.",
    about_p3_prefix: "FloraLexicon es desarrollado y operado por",
    about_p3_suffix:
      ", un estudio digital independiente con presencia en Estados Unidos y Canadá.",

    disclaimer_title: "Aviso legal",
    disclaimer_p1:
      "Este sitio ofrece solo contenido informativo y no constituye asesoramiento médico, botánico ni profesional. La identificación y el uso pueden variar según región y contexto. Verifica siempre con fuentes cualificadas antes de usar la información.",
    disclaimer_p2:
      "Las herramientas, datos y textos de FloraLexicon son de carácter informativo y educativo. Buscamos la precisión, pero no ofrecemos garantías expresas o implícitas sobre la integridad, exactitud o idoneidad de la información. El uso es bajo tu responsabilidad.",
    disclaimer_p3:
      "Nada aquí sustituye el criterio de un profesional cualificado (por ejemplo, botánico, personal sanitario o autoridad agrícola local) cuando hay salud, seguridad o normativa en juego.",
    disclaimer_p4:
      "FloraLexicon puede enlazar sitios externos; no controlamos su contenido ni su exactitud. Un enlace no implica respaldo.",
    disclaimer_p5:
      "En la medida permitida por la ley, {operator} y su titular no serán responsables por daños directos, indirectos, incidentales, consecuentes o punitivos derivados del uso de FloraLexicon, incluidos errores, interrupciones o inexactitudes.",
    disclaimer_p6:
      "FloraLexicon se opera desde Canadá y Estados Unidos. No garantizamos que el sitio sea adecuado en todas las jurisdicciones; quien accede desde otras regiones lo hace bajo su propia iniciativa y debe cumplir la ley local.",

    name_variant_notice:
      "Estás viendo la grafía «{variant}». Este tema corresponde en el índice a «{canonical}».",

    hub_overview_h2: "¿Qué es «{name}»?",
    hub_overview_p:
      "«{name}» es un nombre de hierba medicinal o tradicional, no un identificador científico único. En infusiones, remedios y uso local suele repetirse la misma palabra para distintas especies, así que la ambigüedad es frecuente. El sentido depende del país, idioma y fuente; FloraLexicon relaciona cada etiqueta con las plantas científicas registradas en ese contexto.",
    hub_regional_h2: "¿A qué se refiere «{name}» en distintos países?",
    hub_regional_intro:
      "Cada línea muestra qué planta(s) científica(s) enlazan nuestros registros regionales con ese país. Abre la página del país para un foco geográfico, o la de la especie para la ficha completa.",
    hub_regional_country_page_hint: "página por país",
    hub_uses_h2: "¿Para qué se usa {name}?",
    hub_uses_intro: "Entre las especies enlazadas a este nombre en FloraLexicon, los usos registrados incluyen:",
    hub_uses_suffix: "El uso concreto depende de la especie, la parte de la planta y la práctica local.",
    hub_uses_none: "No hay categorías de uso agregadas para este nombre en el índice actual.",
    hub_use_tea: "infusiones / té",
    hub_use_medicinal: "uso medicinal",
    hub_use_ritual: "uso ritual",
    hub_use_culinary: "uso culinario",
    hub_use_aromatic: "uso aromático",

    name_related_herb_names_h2: "¿Cómo se llama «{name}» en otros países o contextos?",
    name_related_herb_names_lead:
      "Otros nombres comunes del índice que apuntan a las mismas plantas que esta etiqueta—útiles para viajes, mercados y remedios entre culturas.",
    name_hub_countries_index_h2: "Usada en estos países",
    name_hub_countries_index_lead:
      "Abra la vista por país de este nombre (los mismos datos que el desglose regional más abajo).",
    name_hub_plant_quick_nav_aria: "Ir a las especies de este nombre",
    name_hub_plant_quick_nav_label: "Plantas para este nombre (accesos rápidos)",
    plant_detail_other_names_h2: "Otros nombres para esta planta",
    plant_detail_other_names_lead:
      "Concentradores de nombre común indexados que referencian esta especie—cada enlace abre la página de desambiguación de esa etiqueta.",
    plant_detail_similar_uses_h2: "Hierbas medicinales parecidas (usos compartidos)",
    plant_detail_similar_uses_lead:
      "Otras especies de este índice que comparten al menos una categoría de uso tradicional:",

    seo_meaning_h2: "¿Qué significa «{name}»?",
    seo_meaning_lead: "«{name}» es un nombre común o regional de planta, no un identificador científico único.",
    seo_correct_h2: "¿Cuál es la planta correcta?",
    seo_correct_p:
      "Rara vez hay una única respuesta universal. La especie depende del país, idioma, literatura y del uso (culinario, ornamental, medicinal, etc.). Usa el filtro de región y los nombres científicos anteriores para elegir la mejor coincidencia.",
    seo_uses_h2: "Usos comunes de «{name}»",
    seo_uses_with: "Entre las especies mostradas para este nombre en FloraLexicon, los usos incluyen:",
    seo_uses_suffix: "El uso concreto depende de la especie y de la práctica local.",
    seo_uses_none: "No hay categorías de uso agregadas para este nombre en el índice actual.",
    seo_faq_h2: "Preguntas frecuentes",

    ambiguity_note_high:
      "En este índice el nombre está vinculado a más de una especie. Suele ocurrir cuando la misma etiqueta cotidiana designa plantas distintas según lugar u obra.",
    ambiguity_note_medium:
      "Los registros regionales pueden compartir una misma especie científica y leerse distinto por país o idioma. Compara las etiquetas de país y los nombres científicos anteriores.",
    ambiguity_note_low:
      "En este conjunto de datos el nombre se resuelve hoy en una sola especie. Otras guías o idiomas podrían usar la misma etiqueta para otra planta.",

    faq_q_same: "¿{name} siempre es la misma planta?",
    faq_a_same:
      "No necesariamente. Los nombres comunes se repiten entre idiomas y regiones. FloraLexicon muestra qué especies enlaza esta etiqueta en los datos actuales; más de una fila indica ambigüedad aquí.",
    faq_q_country_named: "¿Qué es {name} en {country}?",
    faq_q_country_generic: "¿Qué es {name} en un país concreto?",
    faq_a_country_named:
      "Al elegir {country}, las coincidencias ligadas a ese país aparecen primero cuando existen. Las floras y listas locales siguen siendo la referencia para identificación de campo.",
    faq_a_country_generic:
      "Depende del país e idioma. Usa el selector de región para priorizar registros de esa zona y apóyate en el nombre científico para una ID estable.",
    faq_q_safe: "¿Es seguro {name}?",
    faq_a_safe:
      "La seguridad depende de la especie exacta, la parte de la planta, la preparación y el contexto personal. FloraLexicon no ofrece orientación médica, nutricional ni sobre toxicidad; consulta a profesionales y fuentes fiables.",
    faq_q_hub_species: "¿Qué especies científicas enlaza {name}?",
    faq_a_hub_species:
      "Todas las especies indexadas aparecen en las posibles coincidencias arriba, con países y usos. Si hay más de una planta, el mismo nombre común designa especies distintas en distintas regiones: usa nombres científicos y contexto regional para acertar.",
    faq_q_hub_remedies: "¿Se usa {name} en remedios tradicionales?",
    faq_a_hub_remedies:
      "El conjunto de datos puede listar infusiones, usos medicinales, rituales o culinarios en especies enlazadas. Es solo informativo: los nombres comunes no bastan para identificar una planta con seguridad; verifica con fuentes cualificadas antes de cualquier uso relacionado con la salud.",

    decision_uses_fallback: "referencias generales de plantas",
    decision_when_region:
      "Es el sentido más habitual de «{q}» en {country} entre los registros regionales de este índice. Los usos habituales incluyen: {uses}.",
    decision_when_single:
      "Los registros vinculan «{q}» a esta especie sobre todo en {country}. Usos asociados a esta entrada: {uses}.",
    decision_when_multi:
      "Elige esta coincidencia si tu contexto es {places}, o si tu fuente coincide con esas etiquetas regionales. Usos asociados a esta especie: {uses}.",
    decision_when_fallback:
      "Esta especie es una de las interpretaciones indexadas de «{q}». Usos listados: {uses}.",
    decision_diff_genus:
      "A diferencia de otras plantas llamadas «{q}» aquí, esta es {genus} en {family}; las otras coincidencias están en {genera}.",
    decision_diff_same_family:
      "Esto es {scientific}. Las otras coincidencias indexadas para «{q}» son especies distintas dentro de {family}.",
    decision_diff_families:
      "A diferencia de otras plantas llamadas «{q}» en este índice, esta especie pertenece a la familia {family}. Las otras coincidencias corresponden a {families}.",

    defined_term_desc: "Traductor de nombres de hierbas entre culturas y regiones",

    meta_home_title: "Traductor de nombres de hierbas entre países | FloraLexicon",
    meta_home_desc:
      "Traduce nombres tradicionales de hierbas para infusiones y remedios. Ve nombres locales por país y verifica la planta con el nombre científico cuando necesites certeza.",
    meta_names_title: "Índice de nombres de plantas",
    meta_names_desc: "Explora nombres de plantas y sus equivalentes científicos.",
    meta_plants_title: "Índice de plantas",
    meta_plants_desc:
      "Explora especies del índice FloraLexicon: nombres científicos, familias y enlaces a fichas.",
    meta_plant_desc_suffix: "— área nativa, usos y datos taxonómicos en FloraLexicon.",
    meta_plant_desc:
      "{name} ({family}): área nativa, usos y datos taxonómicos en FloraLexicon.",
    meta_plant_not_found_title: "Planta no encontrada",
    meta_name_missing_title: "Nombre no encontrado",
    meta_name_missing_desc:
      "No hay plantas para este nombre en FloraLexicon. Prueba otro nombre común o revisa la ortografía.",
    meta_name_match_title: "¿Cómo se llama «{name}» en distintos países?",
    meta_name_match_desc:
      "Descubre cómo se llama «{name}» en distintos países. Compara nombres locales de hierbas y verifica la planta con la clasificación científica.",
    meta_name_country_title: "¿Qué es {name} en {country}?",
    meta_name_country_desc:
      "La planta más habitual vinculada a «{name}» en {country}, notas de uso local y enlaces al tema del nombre y a las especies.",
    name_country_breadcrumb_hub: "Todos los sentidos de este nombre",
    name_country_kicker: "Contexto por país",
    name_country_h1: "¿Qué es «{name}» en {country}?",
    name_country_intro:
      "En el índice de FloraLexicon para {country}, «{name}» suele asociarse sobre todo a la especie de abajo. En otros lugares la misma etiqueta puede designar otras especies: abre el tema del nombre para comparar todas las coincidencias.",
    name_country_primary_heading: "Planta más frecuente en este país",
    name_country_primary_lead:
      "{scientific} es la coincidencia principal indexada para «{name}» en {country} cuando hay registros regionales.",
    name_country_other_species_heading: "Otras especies ligadas a este nombre (índice amplio)",
    name_country_uses_heading: "Usos típicos en contextos tradicionales y medicinales",
    name_country_native_range_heading: "Área nativa y regiones",
    name_country_hub_cta: "Comparar todos los sentidos de «{name}» →",
    name_hub_compare_cta: "Abrir comparación completa: diferencias, usos y regiones →",
    name_hub_species_h2: "Plantas científicas asociadas a «{name}»",
    name_hub_species_lead:
      "Hay {count} especies indexadas que coinciden con esta etiqueta abajo. Los nombres científicos son la referencia estable: compara fichas y regiones antes de fiarte solo del nombre común.",
    name_intro_p1:
      "«{name}» es un nombre común de hierba en medicina tradicional, infusiones y remedios locales. Su significado cambia según el país y el contexto, y puede designar plantas distintas.",
    name_intro_p2:
      "Usa el filtro de país abajo para ver la coincidencia más relevante para tu región.",
    name_instant_answer_lead: "«{name}» también se conoce como:",
    name_instant_answer_closing_single:
      "A menudo se refiere a especies del género {genus}: el sentido exacto sigue dependiendo del país, del idioma y del producto.",
    name_instant_answer_closing_multi:
      "Puede referirse a plantas distintas según la región y la tradición local: cruza siempre la etiqueta con el lugar donde compras o preguntas.",
    name_instant_answer_where_recorded:
      "En nuestro índice, esta grafía aparece en registros de:",
    name_also_called_h2: "También se llama",
    name_also_called_lead:
      "Otros nombres comunes para las mismas plantas en FloraLexicon, con países donde figura cada etiqueta en los datos.",
    name_country_mappings_h2: "Mapeo por país",
    name_country_mappings_intro:
      "Cada país enlaza a una vista centrada en ese nombre. Las plantas listadas son todas las especies indexadas ligadas a ese país para esta etiqueta.",
    name_country_hub_link_title: "Abrir vista por país para este nombre de hierba",
    name_country_resolution_h2: "¿A qué se refiere «{name}» en cada país?",
    name_alternatives_h2: "Otras especies que puede designar este nombre",
    name_global_name_network_h2: "Esta planta se conoce con distintos nombres en distintos países",
    name_hub_common_uses_h2: "Usos habituales",
    name_primary_query_line: "Resolviendo «{name}»",
    name_page_h1_what_is: "¿Qué es «{name}»?",
    name_primary_refers_to: "Lo más frecuente es que se refiera a:",
    name_primary_why_multi: "Coincidencia más habitual en {count} países",
    name_primary_why_coverage: "Mayor cobertura regional en los datos",
    name_primary_why_dominant_country: "Dominante en {country}",
    name_primary_why_common_global: "Lo más habitual a escala global",
    name_primary_why_frequent_match: "Coincidencia frecuente",
    name_hub_score_suffix: "puntuación de coincidencia",
    name_confidence_tooltip_main:
      "Esta puntuación refleja el acuerdo global, el predominio regional y la frecuencia de uso entre países.",
    plant_limited_data_badge: "Datos limitados",
    plant_ghost_mapping_note:
      "Esta planta está mapeada de forma parcial a partir de datos regionales de nombres.",
    common_names_label: "Nombres comunes:",
    plant_placeholder_title: "Especie aún no indexada por completo",
    plant_placeholder_subtitle:
      "Este nombre aparece en varios países, pero la especie aún no está mapeada por completo.",
    name_also_known_show_all: "Ver todas ({n} más)",
    name_languages_heading: "Cómo se llama esta planta en distintos idiomas",
    name_group_ascii_names: "Inglés / grafías internacionales",
    name_group_nonascii_names: "Español / portugués y grafías con acentos",
    plantcard_most_common_in: "Más habitual en:",
    plantcard_used_for: "Uso tradicional:",
    hub_use_human_tea: "Infusión / té de hierbas",
    hub_use_human_medicinal: "Medicina tradicional",
    hub_use_human_ritual: "Uso ritual o ceremonial",
    hub_use_human_culinary: "Cocina y condimento",
    hub_use_human_aromatic: "Uso aromático",
    name_hub_matches_h2: "Coincidencias para «{name}»",
    name_hub_matches_lead:
      "{count} coincidencia(s) de planta en el índice abajo. Compara dónde es frecuente cada una, sus usos y otros nombres locales antes de quedarte con una sola traducción.",
    name_hub_explore_h2: "Explorar hierbas relacionadas",
    name_hub_explore_lead:
      "Sinónimos y etiquetas cercanas en el índice, más listas por uso tradicional.",
    name_hub_explore_similar_heading: "Nombres parecidos",
    name_hub_global_h2: "¿Dónde se usa «{name}»?",
    name_hub_global_intro:
      "En este índice, los registros regionales relacionan «{name}» con los siguientes países (primero los más frecuentes en los datos):",
    geo_expand_countries: "+{n} más",
    geo_collapse_countries: "Mostrar menos",
    compare_meta_title: "{a} vs {b} | FloraLexicon",
    compare_meta_desc:
      "Diferencias entre {a} y {b}: familia, usos tradicionales y regiones—dos plantas que a menudo se confunden por nombres parecidos.",
    compare_h1: "{a} vs {b}",
    compare_intro:
      "Son especies distintas que a veces comparten nombres comunes o etiquetas regionales. Usa la tabla para acertar con tu fuente.",
    compare_diff_heading: "Diferencias clave",
    compare_diff_families: "Familias distintas: {a} frente a {b}.",
    compare_same_family: "Ambas están en la familia {family}: compara género, usos y área abajo.",
    compare_diff_genera: "Géneros: {ga} frente a {gb}.",
    compare_table_uses: "Usos tradicionales (índice)",
    compare_table_regions: "Regiones / área nativa",
    plant_explore_heading: "Explorar más",
    internal_link_browse_names: "Ver todos los nombres de plantas",
    internal_link_all_plants: "Índice de todas las plantas",
    category_top_names_heading: "Nombres en esta categoría",
    category_top_names_lead:
      "Resuelve estas etiquetas comunes a especies—muchas aparecen junto a las plantas de arriba.",
    meta_about_desc:
      "FloraLexicon es un motor de nombres de plantas operado por Albor Digital LLC; relaciona nombres comunes con taxonomía científica.",
    meta_contact_desc_prefix: "Contacto FloraLexicon en",
    meta_contact_desc_suffix: "para preguntas, correcciones o comentarios.",
    meta_disclaimer_desc:
      "FloraLexicon ofrece solo contenido informativo. La identificación y el uso varían por región; verifica con fuentes cualificadas.",
    meta_privacy_desc_prefix: "Cómo",
    meta_privacy_desc_suffix:
      "recopila, usa y protege la información cuando usas FloraLexicon.",
    meta_terms_desc_prefix: "Términos de uso de FloraLexicon, operado por",

    privacy_about_link: "Acerca de",
    page_privacy_title: "Política de privacidad",
    page_terms_title: "Términos del servicio",
    legal_english_only_notice:
      "Este documento legal está disponible solo en inglés; podría añadirse una traducción completa más adelante.",

    terms_see_disclaimer: "Aviso legal",

    home_why_para1:
      "El mismo nombre de hierba puede designar plantas distintas según el país, el idioma o el contexto. Es muy frecuente con hierbas medicinales, infusiones y remedios locales.",
    home_why_para2:
      "La misma planta puede tener muchos nombres locales en distintas regiones y tradiciones. FloraLexicon ayuda a ver qué pedir en otro país y luego comprobar la especie cuando necesites certeza.",
    home_medicinal_title: "Pensado para el uso tradicional y medicinal de las hierbas",
    home_medicinal_body:
      "FloraLexicon se centra en hierbas usadas en infusiones, remedios y medicina tradicional en distintas culturas. Te ayuda a encontrar el nombre local correcto y confirmar la planta: no cataloga especies ornamentales.",

    plant_detail_def_line1:
      "{scientific} es una {kind} asociada en el índice de FloraLexicon a usos tradicionales relacionados con: {themes}.",
    plant_detail_def_line2:
      "Se la conoce comúnmente como {examples} en distintas regiones e idiomas.",
    plant_detail_def_and: "y",
    plant_detail_kind_medicinal_herb: "hierba medicinal",
    plant_detail_kind_plant: "planta",
    plant_detail_theme_digestive: "apoyo digestivo",
    plant_detail_theme_inflammation: "malestar inflamatorio leve",
    plant_detail_theme_respiratory: "comodidad respiratoria",
    plant_detail_theme_womens: "tradiciones de salud femenina",
    plant_detail_theme_relax: "relajación y sueño",
    plant_detail_theme_skin: "cuidado de piel y heridas (tradición)",
    plant_detail_theme_pain: "comodidad muscular y articular",
    plant_detail_theme_general: "contextos domésticos y herbales tradicionales",
    plant_detail_used_for: "Uso tradicional destacado",
    plant_detail_page_scope:
      "Temas de uso tradicional, alertas de seguridad del índice y cómo cambian los nombres locales de la hierba por país.",
    plant_detail_sources_footnote:
      "Última actualización según el índice etnobotánico fusionado de FloraLexicon—solo informativo; véase el aviso legal.",
    plant_detail_also_known: "También conocida como",
    plant_detail_safety_badge_toxic: "Toxicidad (índice)",
    plant_detail_safety_badge_lookalike: "Riesgo de homónimos / parecidos",
    plant_detail_safety_confusable_warning:
      "⚠️ Especies confundibles: nombres parecidos u homónimos pueden designar otra planta. Confirme la identidad antes de usarla.",
    plant_detail_regions_use_heading: "Nombres regionales en el índice",
    plant_detail_regions_uniform:
      "Uso tradicional similar entre regiones en este fragmento del índice—las diferencias suelen ser de nombre local, no de filas de uso distintas.",
    plant_detail_regions_arrow: "→",
    plant_detail_related_match_genus: "· mismo género",
    plant_detail_related_match_theme: "· tema indexado compartido",
    plant_detail_related_blurb:
      "Primero el mismo género; luego especies que comparten una condición indexada con esta planta.",
    plant_detail_cond_one_digest:
      "A menudo indexada para malestar digestivo leve e hinchazón (solo contexto tradicional).",
    plant_detail_cond_one_inflam:
      "Suele agruparse con comodidad ante inflamación leve del día a día—no es una afirmación terapéutica.",
    plant_detail_cond_one_respiratory:
      "Asociada en registros regionales a comodidad respiratoria suave.",
    plant_detail_cond_one_womens:
      "Aparece en algunas tradiciones de salud femenina—verifique localmente y con un profesional si aplica.",
    plant_detail_cond_one_relax:
      "A menudo ligada a calma, sueño o estrés en contextos herbales informales.",
    plant_detail_cond_one_skin:
      "A veces citada en tradiciones de piel o heridas; verifique especie e higiene.",
    plant_detail_cond_one_pain:
      "Puede figurar junto a comodidad muscular o articular en el índice.",
    plant_detail_cond_one_circulation:
      "A veces listada cerca de tradiciones vasculares o de circulación—confirme fuentes.",
    plant_detail_cond_one_fallback:
      "Indexada bajo «{label}» en contexto tradicional—verifique identificación y orientación local.",
    plant_detail_safety_block_title: "Seguridad",
    plant_detail_safety_level: "Nivel",
    plant_detail_safety_avoid: "Evitar si",
    plant_detail_safety_interactions: "Interacciones / precauciones",
    plant_detail_safety_lookalike: "Riesgo de homónimos",
    plant_detail_safety_lookalike_yes: "Sí",
    plant_detail_safety_lookalike_no: "No",
    plant_detail_avoid_pregnant: "Embarazo o lactancia (según banderas del índice)",
    plant_detail_avoid_none: "Sin señales adicionales de “evitar si” en este fragmento",
    plant_detail_interact_none: "Nada más destacado aparte de las notas",
    plant_detail_interact_sedatives_bloodthinners:
      "Posibles interacciones: sedantes o anticoagulantes (si aparece en fuentes—verificar)",
    plant_detail_amb_alert:
      "A veces se confunde esta especie con otras plantas llamadas «{common}». Las especies distintas pueden tener efectos y perfiles de seguridad diferentes.",
    plant_detail_amb_compare_cta: "Comparar todas las plantas «{common}» →",
    plant_detail_faq_heading: "Preguntas frecuentes",
    plant_detail_faq_q_daily: "¿Es seguro tomar {name} a diario?",
    plant_detail_faq_a_daily:
      "Muchas personas usan cantidades moderadas en infusiones, pero la seguridad depende de la especie exacta, la dosis, los medicamentos y su contexto de salud. Esta página es solo informativa: consulte a un profesional si tiene dudas.",
    plant_detail_faq_q_used: "¿Para qué se usa {name}?",
    plant_detail_faq_a_used:
      "En el índice de FloraLexicon, esta especie suele asociarse con: {themes}. El uso tradicional no prueba beneficio ni seguridad para una persona concreta.",
    plant_detail_faq_q_confused: "¿Puede confundirse {name} con otras plantas?",
    plant_detail_faq_a_confused:
      "Sí: los nombres comunes compartidos son una fuente frecuente de errores. Si ve la alerta de ambigüedad, abra el concentrador del nombre para comparar especies científicas en paralelo.",
    plant_detail_faq_q_safe: "¿Es segura {name}?",
    plant_detail_faq_a_safe:
      "El índice etiqueta la toxicidad como {safety}. Los temas frecuentes incluyen {themes}. Esto no es una evaluación personal de riesgo: consulte a un profesional.",

    plant_detail_meta_title: "{name} — usos, beneficios y seguridad | FloraLexicon",
    plant_detail_meta_title_v2: "{name}: usos, beneficios, seguridad y riesgos | FloraLexicon",
    plant_detail_meta_title_positioning: "{name} — Nombres comunes entre países",
    plant_detail_meta_desc_positioning:
      "Nombres locales y regionales de {name} en distintos países. Compara etiquetas por región y verifica la especie en FloraLexicon.",
    plant_detail_meta_desc:
      "{lead} Contexto de seguridad en el índice: {safety}. Solo informativo: no es consejo médico.",
    plant_detail_meta_desc_v2:
      "{uses}. Seguridad en el índice: {safety}. Solo informativo: no es consejo médico.",
    plant_detail_safety_critical:
      "El índice marca riesgo elevado de toxicidad para algunos usos. Verifica la especie exacta y consulta fuentes cualificadas antes de usarla.",
    plant_detail_safety_lethal:
      "Puede haber toxicidad grave. No te automediques; busca orientación de seguridad autorizada.",
    plant_detail_description_lead:
      "Una {type} de la familia {family} ({genus}), con categorías de uso tradicional indexadas: {uses}.",
    plant_detail_common_names: "Nombres comunes",
    plant_detail_common_in_label: "Común en:",
    plant_detail_called_in_countries_h2: "¿Cómo se llama esta hierba en distintos países?",
    plant_detail_called_in_countries_lead:
      "Nombres comunes indexados para esta especie, agrupados por país. Cada etiqueta abre el concentrador de ese nombre.",
    plant_detail_browse_uses_lead: "Explorar por uso:",
    plant_detail_short_intro: "Resumen",
    plant_detail_facts: "Datos clave",
    plant_detail_fact_family: "Familia",
    plant_detail_fact_regions: "Países y regiones (índice)",
    plant_detail_fact_evidence: "Etiqueta de evidencia (índice)",
    plant_detail_fact_toxicity: "Toxicidad (índice)",
    plant_detail_fact_sustainability: "Sostenibilidad / cosecha",
    plant_detail_uses_heading: "Usos y temas indexados",
    plant_detail_uses_none:
      "Aún no hay temas terapéuticos adicionales para esta especie en el fragmento actual del índice—mira las categorías de uso tradicional arriba.",
    plant_detail_uses_group_blurb:
      "Este tema aparece en el índice etnobotánico/regional de FloraLexicon para esta especie.",
    plant_detail_safety_heading: "Notas de seguridad",
    plant_detail_safety_intro:
      "Estas alertas resumen metadatos del conjunto de datos. No garantizan seguridad ni sustituyen consejo profesional.",
    plant_detail_contra_heading: "Precauciones (índice)",
    plant_detail_contra_pregnancy: "Embarazo y lactancia",
    plant_detail_lookalike: "Riesgo de confusión de nombres",
    plant_detail_evidence_heading: "Etiqueta de evidencia",
    plant_detail_evidence_read_concept: "Cómo etiquetamos la evidencia →",
    plant_detail_regions_heading: "Geografía",
    plant_detail_regions_origin: "Regiones nativas / de origen (datos)",
    plant_detail_regions_index: "Dónde aparece en el índice",
    plant_detail_regions_diff:
      "Si los países difieren del rango nativo, suele reflejar dónde se registraron nombres y usos—no que la planta sea silvestre en todos los sitios listados.",
    plant_detail_amb_heading: "Nombres que pueden designar más de una planta",
    plant_detail_amb_headline: "⚠️ Mismo nombre común, distintas especies",
    plant_detail_amb_confused_line:
      "A veces se confunde con otras especies llamadas «{common}».",
    plant_detail_amb_intro_strong:
      "A veces se confunde esta planta con otras especies que comparten el mismo nombre cotidiano.",
    plant_detail_amb_intro:
      "Las especies distintas pueden tener distinta química, tradición y riesgo. Compare los nombres científicos antes de usar.",
    plant_detail_amb_species_line: "Otras especies indexadas bajo este nombre:",
    plant_detail_related_heading: "Especies relacionadas",
    plant_detail_related_same_genus: "Mismo género en este índice",
    plant_detail_use_topical: "Uso tópico",
    plant_detail_value_not_listed: "No figura en el fragmento actual del índice.",
    plant_detail_flag_abortifacient:
      "El índice registra precauciones fuertes ligadas al embarazo/útero en algunas tradiciones—trata como alto riesgo hasta verificar.",
    plant_detail_tox_notes: "Notas",
    plant_detail_tox_lethal: "Riesgo muy alto",
    plant_detail_tox_high: "Riesgo alto",
    plant_detail_tox_moderate: "Riesgo moderado",
    plant_detail_tox_low: "Riesgo menor en el índice",
    plant_detail_tox_unknown: "Sin especificar",
    plant_detail_evid_clinical: "Contexto clínico / de estudios (etiqueta)",
    plant_detail_evid_tramil: "Contexto tipo TRAMIL (etiqueta)",
    plant_detail_evid_empirical: "Contexto empírico / mixto (etiqueta)",
    plant_detail_evid_traditional: "Contexto tradicional / etnobotánico (etiqueta)",
    plant_detail_sus_at_risk: "Presión de cosecha: en riesgo (índice)",
    plant_detail_sus_caution: "Precaución (índice)",
    plant_detail_sus_safe: "Menor preocupación (índice)",
    plant_detail_contra_anticoagulant: "Interacción con anticoagulantes (precaución)",
    plant_detail_contra_liver: "Precaución hepática / metabolismo",
    plant_detail_badge_toxic: "Toxicidad: {level}",
    plant_detail_badge_lookalike: "Posible confusión de nombres",
    plant_detail_tox_flags: "Alertas de seguridad en el índice",
  },
} as const;

/** True if `key` exists in the English pack (authoritative key set for `I18nKey`). */
export function i18nHasKey(key: string): key is I18nKey {
  return Object.prototype.hasOwnProperty.call(dictionary.en, key);
}
