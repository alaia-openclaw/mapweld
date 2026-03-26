import { getWeldSectionCompletion } from "./weld-utils";

/**
 * Weld pipeline stages for Status Kanban (sequential).
 */
export const WELD_PIPELINE_STAGES = [
  { id: "not_started", label: "Not started", class: "bg-base-200/80" },
  { id: "fit_up", label: "Fit up", class: "bg-info/10 border-info/20" },
  { id: "welding", label: "Welding", class: "bg-warning/10 border-warning/20" },
  { id: "ndt", label: "NDT", class: "bg-secondary/10 border-secondary/20" },
  { id: "completed", label: "Completed", class: "bg-success/10 border-success/20" },
];

/**
 * Derive weld Kanban column from section completion (single source of truth).
 */
export function getWeldPipelineStage(weld, ndtSelection = {}, structureScope = null) {
  if (!weld) return "not_started";
  const s = getWeldSectionCompletion(weld, ndtSelection, structureScope);
  if (s.general && s.fitup && s.welding && s.inspection) return "completed";
  if (s.fitup && s.welding && !s.inspection) return "ndt";
  if (s.fitup && !s.welding) return "welding";
  if (s.general && !s.fitup) return "fit_up";
  return "not_started";
}

/**
 * Spool lifecycle for fabrication / logistics Kanban.
 */
export const SPOOL_LIFECYCLE_STAGES = [
  { id: "not_started", label: "Not started", class: "bg-base-200/80" },
  { id: "workshop", label: "Workshop", class: "bg-info/10 border-info/20" },
  { id: "storage_area", label: "Storage area", class: "bg-warning/10 border-warning/20" },
  { id: "painting", label: "Painting", class: "bg-secondary/10 border-secondary/20" },
  { id: "shipped", label: "Shipped", class: "bg-success/10 border-success/20" },
];

export const SPOOL_LIFECYCLE_ORDER = SPOOL_LIFECYCLE_STAGES.map((x) => x.id);

export function normalizeSpoolLifecycleStage(stage) {
  if (!stage || !SPOOL_LIFECYCLE_ORDER.includes(stage)) return "not_started";
  return stage;
}
