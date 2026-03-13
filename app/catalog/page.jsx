import Link from "next/link";

export default function CatalogPage() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold mb-2">Part catalog</h1>
        <p className="text-sm text-base-content/70">
          Explore piping component data derived from your reference sources.
          Start with the dedicated flanges catalog; we can extend to other
          component families next.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/catalog/flanges"
          className="card bg-base-100 shadow-sm border border-base-300 hover:border-primary transition-colors"
        >
          <div className="card-body py-4 px-5">
            <h2 className="card-title text-base mb-1">Flanges catalog</h2>
            <p className="text-xs text-base-content/70 mb-2">
              Browse ASME, API, EN, and BS flange dimensions with drawings and
              pressure class filters, based on the Pipedata-Pro 15.0 database.
            </p>
            <span className="text-xs font-semibold text-primary">
              Open flanges catalog →
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}

