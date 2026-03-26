/** Shared document vault categories (Settings + legacy databook compile). */
export const SETTINGS_DOCUMENT_CATEGORIES = [
  { id: "itp", label: "ITP" },
  { id: "wqr", label: "Welder qualification (WQR)" },
  { id: "wps", label: "WPS" },
  { id: "mtc", label: "Material certificate (MTC)" },
  { id: "electrode", label: "Electrode register" },
  { id: "ndt_qualification", label: "NDT qualification" },
  { id: "ndt_calibration", label: "NDT calibration" },
  { id: "painting_report", label: "Painting report" },
  { id: "final_release", label: "Release QC report" },
  { id: "ndt_report_attachment", label: "NDT report attachment" },
  { id: "other", label: "Other" },
];

export function getSettingsDocumentCategoryLabel(category) {
  return SETTINGS_DOCUMENT_CATEGORIES.find((item) => item.id === category)?.label || category || "Uncategorized";
}
