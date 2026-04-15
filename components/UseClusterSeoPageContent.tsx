import {
  getPlantsForUseCluster,
  getTopNameLinksForUseCluster,
  getUseClusterConfig,
  type UseClusterSlug,
} from "@/lib/useClusters";
import Link from "next/link";

type Props = {
  slug: UseClusterSlug;
};

const MAX_PLANTS = 100;

export function UseClusterSeoPageContent({ slug }: Props) {
  const cluster = getUseClusterConfig(slug);
  if (!cluster) return null;
  const plants = getPlantsForUseCluster(slug).slice(0, MAX_PLANTS);
  const names = getTopNameLinksForUseCluster(slug, 60);

  return (
    <main className="mx-auto w-full max-w-[1000px] px-6 py-14">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
        {cluster.title}
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        {cluster.description}
      </p>

      <section className="mt-10" aria-labelledby="cluster-names">
        <h2
          id="cluster-names"
          className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100"
        >
          Related herb names
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {names.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/name/${item.slug}`}
                className="inline-block rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-sm font-medium text-flora-forest hover:border-flora-forest/40 dark:border-stone-600 dark:bg-stone-900/60 dark:text-emerald-300"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="cluster-plants">
        <h2
          id="cluster-plants"
          className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100"
        >
          Matching plants
        </h2>
        <ul className="mt-4 space-y-3">
          {plants.map((plant) => (
            <li key={plant.id}>
              <Link
                href={`/plant/${plant.id}`}
                className="block rounded-2xl border border-stone-200 bg-white/60 px-4 py-3 hover:border-flora-forest/35 dark:border-stone-700 dark:bg-stone-900/40"
              >
                <p className="font-medium italic tracking-tight text-stone-900 dark:text-stone-100">
                  {plant.scientific_name}
                </p>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                  Uses: {plant.primary_uses.join(", ")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <nav className="mt-12 border-t border-stone-200 pt-6 text-sm dark:border-stone-800">
        <ul className="flex flex-wrap gap-4">
          <li>
            <Link href="/herbs" className="font-medium text-flora-forest underline">
              Browse by country
            </Link>
          </li>
          <li>
            <Link href="/query" className="font-medium text-flora-forest underline">
              Long-tail herb queries
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
