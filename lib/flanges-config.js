import path from "path";

const projectRoot = process.cwd();

export const flangesDatabaseRoot = path.join(
  projectRoot,
  "3CQC ref",
  "Pipedata-Pro 15.0",
  "Database"
);

/** Bundled SVG when Pipedata `3CQC ref/.../Database` PNGs are not on disk. */
export const flangeDrawingFallbackImage = "/catalog/flanges/default.svg";

/**
 * High-level flanges menu.
 * Each entry is mapped to a Database subfolder and a primary PNG drawing.
 * Some mappings are inferred from folder names and may be refined over time.
 */
export const flangesStandards = [
  {
    id: "asme-b16-5",
    label: "ASME B16.5 Flanges",
    databaseFolder: "Flan",
    primaryImage: "Flan1.png",
    subtypes: [
      {
        id: "weldneck",
        label: "Weldneck Flange",
        image: "Flan1.png",
      },
      {
        id: "slip-on",
        label: "Slip-on Flange",
        image: "Flan2.png",
      },
      {
        id: "blind",
        label: "Blind Flange",
        image: "Flan3.png",
      },
      {
        id: "threaded",
        label: "Threaded Flange",
        image: "Flan4.png",
      },
      {
        id: "socket-welded",
        label: "SocketWelded Flange",
        image: "Flan5.png",
      },
      {
        id: "lapped",
        label: "Lapped Flange",
        image: "Flan6.png",
      },
      {
        id: "long-welding-neck",
        label: "Straight Hub Welding Flange",
        image: "Flan7.png",
      },
    ],
  },
  {
    id: "asme-b16-47-a",
    label: "ASME B16.47 Series A Flanges",
    databaseFolder: "Flaa",
    primaryImage: "Flaa1.png",
  },
  {
    id: "asme-b16-47-b",
    label: "ASME B16.47 Series B Flanges",
    databaseFolder: "Flap",
    primaryImage: "Flap1.png",
  },
  {
    id: "asme-orifice",
    label: "ASME Orifice Flanges",
    databaseFolder: "Orif",
    primaryImage: "Orif1.png",
  },
  {
    id: "api-6b",
    label: "API Type 6B Flanges",
    databaseFolder: "Fl6b",
    primaryImage: "Fl6b1.png",
  },
  {
    id: "api-6bx",
    label: "API Type 6BX Flanges",
    databaseFolder: "Flbx",
    primaryImage: "Flbx1.png",
  },
  {
    id: "asme-reducing",
    label: "ASME Reducing Flanges",
    databaseFolder: "Flre",
    primaryImage: "Flre1.png",
  },
  {
    id: "asme-compact",
    label: "ASME Compact Flanges",
    databaseFolder: "Flco",
    primaryImage: "Flco1.png",
  },
  {
    id: "hub-and-clamp",
    label: "Hub and Clamp",
    databaseFolder: "Flhb",
    primaryImage: "Flhb1.png",
  },
  {
    id: "en-1092-1",
    label: "EN 1092-1 Flanges",
    databaseFolder: "Flom",
    primaryImage: "Flom1.png",
  },
  {
    id: "bs-10",
    label: "BS 10 Flanges",
    databaseFolder: "Flbs",
    primaryImage: "flbs1.png",
  },
];

