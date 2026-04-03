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
    nav_plant_names: "Plant Names",
    nav_plants: "Plants",
    lang_en: "EN",
    lang_es: "ES",

    search_placeholder: "Try a medicinal herb or regional name…",
    search_placeholder_short: "e.g. manzanilla, chamomile",
    search_button: "Search",
    search_label_sr: "Herb name",
    hero_title: "Identify medicinal herbs across languages and regions",
    hero_lead:
      "Resolve traditional herb names used in teas, remedies, and local medicine. FloraLexicon maps common names to scientific species across countries and cultures.",
    hero_search_context:
      "Focused on herbs used in teas, traditional medicine, and everyday remedies.",
    examples_label: "Examples:",
    home_how_title: "How FloraLexicon works",
    home_how_1_title: "Enter a herb name",
    home_how_1_body:
      "— commonly used in teas, remedies, or traditional medicine.",
    home_how_2_title: "See possible matches",
    home_how_2_body:
      "— each option ties the label to a species in our index, with country context when available.",
    home_how_3_title: "Identify the correct species",
    home_how_3_body:
      "— compare scientific names, family, uses, and region to match your source.",
    home_why_title: "Why plant names are confusing",
    home_popular_title: "Popular medicinal herb searches",
    home_popular_cta: "View resolution →",
    home_browse_title: "Browse herbs & species",
    home_browse_lead:
      "Explore traditional and medicinal herb names in the index, or open species pages for herb identification context.",
    home_all_plants: "All plants",
    home_all_names: "All plant names",
    home_browse_by_use_title: "Browse by use",
    home_link_medicinal_herbs: "Medicinal herbs",
    home_link_culinary_herbs: "Culinary herbs",
    home_link_ritual_herbs: "Ritual herbs",

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

    site_disclaimer_strip: "Information on this site is for educational purposes only.",
    footer_tagline_a: "FloraLexicon maps everyday and regional plant labels to",
    footer_tagline_b: "scientific plant names",
    footer_tagline_c: "so you can compare sources and regions with confidence.",
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

    name_label_plant_name: "Plant name",
    name_h1: "What plant does ‘{name}’ refer to?",
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

    names_index_h1: "Plant names index",
    names_index_lead:
      "Alphabetical list of every name in FloraLexicon. Each link opens possible scientific matches for that label.",
    names_index_other: "Other",

    plants_index_h1: "Plants",
    plants_index_lead:
      "Species currently in the dataset, ordered alphabetically by scientific name.",

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
      "FloraLexicon is a plant name resolution engine designed to identify plant species across languages, regions, and cultures.",
    about_p2:
      "The platform maps common plant names to scientific taxonomy, helping users understand which species a name refers to in a specific context.",
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

    defined_term_desc: "Plant name disambiguation across regions",

    meta_home_title: "Medicinal herb identification & scientific names",
    meta_home_desc:
      "Herb identification for medicinal herbs, herbal tea plants, and traditional plant medicine. FloraLexicon maps common names to scientific species across countries and cultures.",
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
    meta_name_match_title: "What plant is ‘{name}’? Medicinal herb identification",
    meta_name_match_desc:
      "Medicinal herb name hub: scientific species, uses (tea, medicinal, ritual), country-by-country meaning, synonyms, and related links.",
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

    home_why_p1a: "The same everyday name often points to",
    home_why_p1b: "different plants",
    home_why_p1c:
      "in different countries — or even in the same language. Without",
    home_why_p1d: "scientific plant names",
    home_why_p1e: ", it is easy to mix up species that share a label.",
    home_why_p2a: "The opposite happens too:",
    home_why_p2b: "different names",
    home_why_p2c: "can refer to the",
    home_why_p2d: "same plant",
    home_why_p2e: ". FloraLexicon surfaces those links so",
    home_why_p2f: "herb identification",
    home_why_p2g: "and cross-border references stay grounded in taxonomy.",
    home_why_p3:
      "This is especially common with medicinal herbs, where the same name may refer to different species used in local remedies.",
    home_medicinal_title: "Built for traditional and medicinal herb use",
    home_medicinal_body:
      "FloraLexicon focuses on medicinal herbs and herbal tea plants—used in teas, natural remedies, and traditional plant medicine across cultures. It does not aim to catalog ornamental or decorative plants.",
  },
  es: {
    nav_home: "Inicio",
    nav_plant_names: "Nombres de plantas",
    nav_plants: "Plantas",
    lang_en: "EN",
    lang_es: "ES",

    search_placeholder: "Prueba una hierba medicinal o un nombre regional…",
    search_placeholder_short: "ej. manzanilla, matico",
    search_button: "Buscar",
    search_label_sr: "Nombre de hierba",
    hero_title: "Identifica hierbas medicinales entre idiomas y regiones",
    hero_lead:
      "Resuelve nombres tradicionales de hierbas usados en infusiones, remedios y medicina local. FloraLexicon relaciona nombres comunes con especies científicas en distintos países y culturas.",
    hero_search_context:
      "Enfocado en hierbas usadas en infusiones, medicina tradicional y remedios cotidianos.",
    examples_label: "Ejemplos:",
    home_how_title: "Cómo funciona FloraLexicon",
    home_how_1_title: "Escribe el nombre de una hierba",
    home_how_1_body:
      "— la que suele usarse en infusiones, remedios o medicina tradicional.",
    home_how_2_title: "Ve posibles coincidencias",
    home_how_2_body:
      "— cada opción enlaza la etiqueta con una especie en nuestro índice, con contexto de país cuando existe.",
    home_how_3_title: "Identifica la especie correcta",
    home_how_3_body:
      "— compara nombres científicos, familia, usos y región con tu fuente.",
    home_why_title: "Por qué los nombres de plantas confunden",
    home_popular_title: "Búsquedas populares de hierbas medicinales",
    home_popular_cta: "Ver resolución →",
    home_browse_title: "Explorar hierbas y especies",
    home_browse_lead:
      "Explora nombres de hierbas medicinales y tradicionales en el índice, o abre fichas de especies para contextualizar la identificación de hierbas.",
    home_all_plants: "Todas las plantas",
    home_all_names: "Todos los nombres",
    home_browse_by_use_title: "Explorar por uso",
    home_link_medicinal_herbs: "Hierbas medicinales",
    home_link_culinary_herbs: "Hierbas culinarias",
    home_link_ritual_herbs: "Hierbas rituales",

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

    site_disclaimer_strip: "La información de este sitio es solo educativa.",
    footer_tagline_a: "FloraLexicon relaciona etiquetas cotidianas y regionales con",
    footer_tagline_b: "nombres científicos de plantas",
    footer_tagline_c: "para que compares fuentes y regiones con más claridad.",
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
    name_h1: "¿A qué planta se refiere «{name}»?",
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

    names_index_h1: "Índice de nombres de plantas",
    names_index_lead:
      "Lista alfabética de todos los nombres en FloraLexicon. Cada enlace abre las posibles coincidencias científicas.",
    names_index_other: "Otros",

    plants_index_h1: "Plantas",
    plants_index_lead:
      "Especies del conjunto de datos, ordenadas alfabéticamente por nombre científico.",

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
      "FloraLexicon es un motor de resolución de nombres de plantas para identificar especies entre idiomas, regiones y culturas.",
    about_p2:
      "La plataforma relaciona nombres comunes con taxonomía científica y ayuda a entender a qué especie alude un nombre en un contexto dado.",
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

    defined_term_desc: "Desambiguación de nombres de plantas entre regiones",

    meta_home_title: "Identificación de hierbas medicinales y nombres científicos",
    meta_home_desc:
      "Identificación de hierbas medicinales, plantas para infusiones y medicina tradicional con plantas. FloraLexicon relaciona nombres comunes con especies científicas entre países y culturas.",
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
    meta_name_match_title: "¿Qué planta es {name}?",
    meta_name_match_desc:
      "Descubre a qué planta se refiere «{name}» en diferentes países.",
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

    home_why_p1a: "A menudo el mismo nombre cotidiano designa",
    home_why_p1b: "plantas distintas",
    home_why_p1c:
      "en distintos países — incluso en el mismo idioma. Sin",
    home_why_p1d: "nombres científicos de plantas",
    home_why_p1e: ", es fácil confundir especies que comparten etiqueta.",
    home_why_p2a: "También ocurre al revés:",
    home_why_p2b: "distintos nombres",
    home_why_p2c: "pueden referirse a la",
    home_why_p2d: "misma planta",
    home_why_p2e: ". FloraLexicon muestra esos vínculos para que la",
    home_why_p2f: "identificación de hierbas",
    home_why_p2g: "y las referencias transfronterizas se apoyen en la taxonomía.",
    home_why_p3:
      "Esto es especialmente frecuente con las hierbas medicinales: el mismo nombre puede referirse a distintas especies usadas en remedios locales.",
    home_medicinal_title: "Pensado para el uso tradicional y medicinal de las hierbas",
    home_medicinal_body:
      "FloraLexicon se centra en hierbas medicinales y en plantas para infusiones y tés de hierbas, además de remedios naturales y medicina tradicional con plantas en distintas culturas. No pretende catalogar plantas ornamentales ni decorativas.",
  },
} as const;
