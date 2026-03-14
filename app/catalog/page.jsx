import CatalogView from "@/components/CatalogView";
import { loadFlangesCatalog } from "@/lib/flanges-data";
import { loadPipeCatalog } from "@/lib/pipedata-pipe";
import { loadFittingsCatalog } from "@/lib/pipedata-fittings";

export const dynamic = "force-static";

export const metadata = {
  title: "Part Catalog — Pipe, Fittings & Flanges",
  description:
    "Browse piping components: pipe, buttwelding and socket-weld fittings, flanges, gaskets, valves, and line blanks. Filter by standard, size, and schedule.",
  openGraph: {
    title: "Part Catalog — Pipe, Fittings & Flanges | MapWeld",
    description:
      "Browse piping components: pipe, fittings, flanges, gaskets, valves, and line blanks.",
    url: "https://www.mapweld.app/catalog",
  },
  alternates: {
    canonical: "https://www.mapweld.app/catalog",
  },
};

export default function CatalogPage() {
  const { standards } = loadFlangesCatalog();
  const { entries: pipeEntries } = loadPipeCatalog();
  const { entries: fittingsEntries } = loadFittingsCatalog();

  const hasAny =
    standards.length > 0 ||
    pipeEntries.length > 0 ||
    fittingsEntries.length > 0;

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold mb-2">Part catalog</h1>
        <p className="text-sm text-base-content/70">
          Explore piping components: Pipe, Fittings (Buttwelding, Threaded,
          Socket Welded), Flange, Gasket, Valves, and Line Blanks. Browse by
          category and type.
        </p>
      </div>

      {!hasAny ? (
        <div className="rounded-xl border border-base-300 bg-base-100 p-6 text-center">
          <p className="text-sm text-base-content/70">
            No catalog data was found. Ensure the reference database folder is
            present in the project.
          </p>
        </div>
      ) : (
        <CatalogView
          flangesStandards={standards}
          pipeEntries={pipeEntries}
          fittingsEntries={fittingsEntries}
        />
      )}
    </div>
  );
}
