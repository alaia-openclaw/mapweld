import PanelCatalogFlanges from "@/components/PanelCatalogFlanges";
import { loadFlangesCatalog } from "@/lib/flanges-data";

export const dynamic = "force-static";

export default function CatalogFlangesPage() {
  const { standards } = loadFlangesCatalog();

  if (!standards.length) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-3">Flanges catalog</h1>
        <p className="text-sm text-base-content/70">
          No flange data was found under the Pipedata-Pro database folder.
          Ensure{" "}
          <code>3CQC ref/Pipedata-Pro 15.0/Database</code> is present in the
          project root.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-3">
      <div>
        <h1 className="text-2xl font-bold mb-1">Flanges catalog</h1>
        <p className="text-sm text-base-content/70">
          Browse flange dimensions and drawings derived directly from the
          Pipedata-Pro 15.0 database, organized by standard and pressure class.
        </p>
      </div>
      <PanelCatalogFlanges standards={standards} />
    </div>
  );
}

