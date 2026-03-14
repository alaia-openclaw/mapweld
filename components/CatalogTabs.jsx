"use client";

import { useMemo, useState } from "react";
import PanelCatalogFlanges from "@/components/PanelCatalogFlanges";
import PanelCatalogPipe from "@/components/PanelCatalogPipe";
import PanelCatalogFittings from "@/components/PanelCatalogFittings";

const TAB_DEFS = [
  { id: "flanges", label: "Flanges" },
  { id: "pipe", label: "Pipe" },
  { id: "fittings", label: "Fittings (elbows, etc.)" },
];

export default function CatalogTabs({
  flangesStandards = [],
  pipeEntries = [],
  fittingsEntries = [],
}) {
  const tabs = useMemo(
    () =>
      TAB_DEFS.filter((tab) => {
        if (tab.id === "flanges") return flangesStandards.length > 0;
        if (tab.id === "pipe") return pipeEntries.length > 0;
        if (tab.id === "fittings") return fittingsEntries.length > 0;
        return false;
      }),
    [flangesStandards.length, pipeEntries.length, fittingsEntries.length]
  );

  const defaultTab = tabs[0]?.id ?? "flanges";
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="space-y-3">
      <div className="tabs tabs-boxed bg-base-200/80 p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab ${activeTab === tab.id ? "tab-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "flanges" && flangesStandards.length > 0 && (
        <PanelCatalogFlanges standards={flangesStandards} />
      )}
      {activeTab === "pipe" && (
        <PanelCatalogPipe entries={pipeEntries} />
      )}
      {activeTab === "fittings" && (
        <PanelCatalogFittings entries={fittingsEntries} />
      )}
    </div>
  );
}
