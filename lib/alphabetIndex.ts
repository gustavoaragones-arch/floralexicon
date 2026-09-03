const COMBINING_DIACRITICS = /[\u0300-\u036f]/g;

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(COMBINING_DIACRITICS, "");
}

export function letterForSortLabel(label: string): string {
  const d = stripDiacritics(label.trim());
  const c = d.charAt(0);
  if (/[a-z]/i.test(c)) return c.toUpperCase();
  return "#";
}

/** Groups pre-sorted items into alphabet buckets keyed by first letter (or "#" for non-letters). */
export function buildLetterGroups<T>(
  items: T[],
  labelFor: (item: T) => string
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const letter = letterForSortLabel(labelFor(item).toLowerCase());
    const list = groups.get(letter);
    if (list) list.push(item);
    else groups.set(letter, [item]);
  }
  return groups;
}

/** Letter keys in A-Z order, with the "#" (other) bucket last if present. */
export function sortedGroupKeys<T>(groups: Map<string, T[]>): string[] {
  const keys = Array.from(groups.keys());
  const letters = keys.filter((k) => k !== "#").sort((a, b) => a.localeCompare(b, "en"));
  if (keys.includes("#")) letters.push("#");
  return letters;
}
