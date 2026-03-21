/**
 * Pipedata-aligned catalog tree (order matches data/pipedata-catalog-tree.md).
 * Flange standard children are injected at runtime via injectFlangeChildren().
 */

export const PIPEDATA_CATEGORY_TREE = [
  {
    id: "flanges",
    label: "Flanges",
  },
  {
    id: "fittings",
    label: "Fittings",
    children: [
      {
        id: "fittings-buttwelding",
        label: "Buttwelded Fittings",
        children: [
          { id: "fittings-buttwelding-elbow", label: "BW Elbow (LR/SR — data: Elbow)" },
          { id: "fittings-buttwelding-return", label: "BW Return" },
          { id: "fittings-buttwelding-tee", label: "BW Tee" },
          { id: "fittings-buttwelding-cross", label: "BW Cross" },
          { id: "fittings-buttwelding-cap", label: "BW Cap" },
          { id: "fittings-buttwelding-reducer", label: "BW Reducer" },
          { id: "fittings-buttwelding-stud-end", label: "BW Lap Joint Stub End" },
        ],
      },
      {
        id: "fittings-threaded",
        label: "Threaded Fittings",
        children: [
          { id: "fittings-threaded-elbow", label: "Threaded Elbow" },
          { id: "fittings-threaded-tee", label: "Threaded Tee" },
          { id: "fittings-threaded-cross", label: "Threaded Cross" },
          { id: "fittings-threaded-coupling", label: "Threaded Coupling" },
          { id: "fittings-threaded-cap", label: "Threaded Cap" },
          { id: "fittings-threaded-plug", label: "Threaded Plug" },
          { id: "fittings-threaded-bushing", label: "Threaded Bushing" },
        ],
      },
      {
        id: "fittings-socketwelded",
        label: "Socketwelded Fittings",
        children: [
          { id: "fittings-socketwelded-elbow", label: "Socketwelded Elbow" },
          { id: "fittings-socketwelded-tee", label: "Socketwelded Tee" },
          { id: "fittings-socketwelded-cross", label: "Socketwelded Cross" },
          { id: "fittings-socketwelded-coupling", label: "Socketwelded Coupling" },
          { id: "fittings-socketwelded-cap", label: "Socketwelded Cap" },
          { id: "fittings-socketwelded-plug", label: "Socketwelded Plug" },
          { id: "fittings-socketwelded-bushing", label: "Socketwelded Bushing" },
        ],
      },
      {
        id: "fittings-swage",
        label: "Swage and Pipe Nipples",
        children: [{ id: "fittings-swage-generic", label: "Swage / nipple (catalog TBD)" }],
      },
    ],
  },
  {
    id: "gasket",
    label: "Gaskets",
    children: [
      {
        id: "gasket-nonmetallic-flat",
        label: "Nonmetallic Flat Gaskets",
        children: [
          { id: "gasket-nonmetallic-flat-b16-5", label: "Nonmetallic Flat Gasket for ASME B16.5 Flanges" },
          { id: "gasket-nonmetallic-flat-b16-47a", label: "Nonmetallic Flat Gasket for ASME B16.47 Series A Flanges" },
          { id: "gasket-nonmetallic-flat-b16-47b", label: "Nonmetallic Flat Gasket for ASME B16.47 Series B Flanges" },
        ],
      },
      {
        id: "gasket-spiral-wound",
        label: "Spiral-Wound Gaskets",
        children: [
          { id: "gasket-spiral-wound-b16-5", label: "Spiral-Wound Gasket for ASME B16.5 Flanges" },
          { id: "gasket-spiral-wound-b16-47a", label: "Spiral-Wound Gasket for ASME B16.47 Series A Flanges" },
          { id: "gasket-spiral-wound-b16-47b", label: "Spiral-Wound Gasket for ASME B16.47 Series B Flanges" },
        ],
      },
      {
        id: "gasket-ring-joint",
        label: "Ring-Joint Gaskets",
        children: [
          { id: "gasket-ring-joint-r", label: "Type R Ring Gasket" },
          { id: "gasket-ring-joint-rx", label: "Type RX Ring Gasket" },
          { id: "gasket-ring-joint-bx", label: "Type BX Ring Gasket" },
        ],
      },
    ],
  },
  {
    id: "valves",
    label: "Valves",
    children: [
      {
        id: "valves-flanged",
        label: "Flanged Valves",
        children: [
          { id: "valves-flanged-gate", label: "Flanged Gate Valve" },
          { id: "valves-flanged-globe", label: "Flanged Globe Valve" },
          { id: "valves-flanged-ball", label: "Flanged Ball Valve" },
          { id: "valves-flanged-control", label: "Control Valve" },
          { id: "valves-flanged-swing-check", label: "Flanged Swing Check Valve" },
          { id: "valves-flanged-wafer-check", label: "Flanged Wafer Check Valve" },
          { id: "valves-flanged-wafer-butterfly", label: "Wafer Type Butterfly Valve" },
          { id: "valves-flanged-lug-butterfly", label: "Lug Type Butterfly Valve" },
        ],
      },
      {
        id: "valves-buttwelded",
        label: "Buttwelded Valves",
        children: [
          { id: "valves-buttwelded-gate", label: "Buttwelded Gate Valve" },
          { id: "valves-buttwelded-globe", label: "Buttwelded Globe Valve" },
          { id: "valves-buttwelded-ball", label: "Buttwelded Ball Valve" },
          { id: "valves-buttwelded-swing-check", label: "Buttwelded Swing Check Valve" },
        ],
      },
      {
        id: "valves-threaded",
        label: "Threaded Valves",
        children: [
          { id: "valves-threaded-gate", label: "Threaded Gate Valve" },
          { id: "valves-threaded-globe", label: "Threaded Globe Valve" },
          { id: "valves-threaded-horizontal-check", label: "Horizontal Check Valve" },
          { id: "valves-threaded-vertical-check", label: "Vertical Check Valve" },
          { id: "valves-threaded-ball", label: "Threaded Ball Valve" },
        ],
      },
      {
        id: "valves-socketwelded",
        label: "Socketwelded Valves",
        children: [
          { id: "valves-socketwelded-gate", label: "Socketwelded Gate Valve" },
          { id: "valves-socketwelded-globe", label: "Socketwelded Globe Valve" },
          { id: "valves-socketwelded-horizontal-check", label: "Horizontal Check Valve" },
          { id: "valves-socketwelded-vertical-check", label: "Vertical Check Valve" },
          { id: "valves-socketwelded-ball", label: "Socketwelded Ball Valve" },
        ],
      },
    ],
  },
  {
    id: "line-blanks",
    label: "Line Blanks",
    children: [
      { id: "line-blanks-figure-8", label: "Figure-8 Blank" },
      { id: "line-blanks-paddle-spacer", label: "Paddle Blank and Spacer" },
      { id: "line-blanks-rtj-figure-8", label: "RTJ Male Figure-8 Blank" },
      { id: "line-blanks-rtj-paddle", label: "RTJ Male Paddle Blank and Spacer" },
    ],
  },
  { id: "pipe", label: "Pipe" },
  {
    id: "welded-branches",
    label: "Welded Branches",
    children: [
      { id: "wb-weldolet", label: "Weldolet" },
      { id: "wb-elbowlet", label: "Elbowlet" },
      { id: "wb-latrolet", label: "Latrolet" },
      { id: "wb-threadolet", label: "Threadolet" },
      { id: "wb-threaded-elbowlet", label: "Threaded Elbowlet" },
      { id: "wb-threaded-latrolet", label: "Threaded Latrolet" },
      { id: "wb-sockolet", label: "Sockolet" },
      { id: "wb-socketweld-elbowlet", label: "Socketweld Elbowlet" },
      { id: "wb-socketweld-latrolet", label: "Socketweld Latrolet" },
      { id: "wb-weldoflange", label: "Weldoflange" },
      { id: "wb-elbowflange", label: "Elbowflange" },
      { id: "wb-latroflange", label: "Latroflange" },
      { id: "wb-nipoflange", label: "Nipoflange" },
    ],
  },
  {
    id: "nuts",
    label: "Nuts",
    children: [
      { id: "nuts-unc", label: "UNC Nuts" },
      { id: "nuts-iso", label: "ISO Nuts" },
    ],
  },
  {
    id: "strainers",
    label: "Strainers",
    children: [
      {
        id: "strainers-y-type",
        label: "Y Type Strainer",
        children: [
          { id: "strainers-y-flanged", label: "Flanged Strainer" },
          { id: "strainers-y-buttwelded", label: "Buttwelded Strainer" },
          { id: "strainers-y-threaded", label: "Threaded Strainer" },
          { id: "strainers-y-socketwelded", label: "Socketwelded Strainer" },
        ],
      },
      {
        id: "strainers-basket",
        label: "Basket Type Strainer",
        children: [
          { id: "strainers-basket-single", label: "Single Basket Type Strainer" },
          { id: "strainers-basket-duplex", label: "Duplex Basket Type Strainer" },
        ],
      },
      { id: "strainers-witch-hat", label: "Witch Hat Type Strainer" },
      { id: "strainers-top-hat", label: "Top Hat Type Strainer" },
      { id: "strainers-bath-tub", label: "Bath Tub Type Strainer" },
    ],
  },
  { id: "asme-composite", label: "ASME Composite" },
  {
    id: "spacing",
    label: "Spacing",
    children: [
      { id: "spacing-pipe", label: "Pipe Spacing" },
      { id: "spacing-pipe-insul", label: "Pipe Spacing With Insulation" },
      { id: "spacing-flanged", label: "Flanged Pipe Spacing" },
      { id: "spacing-flanged-insul", label: "Flanged Pipe Spacing With Insulation" },
    ],
  },
  {
    id: "safe-spans",
    label: "Safe Spans",
    children: [
      { id: "safe-spans-rack", label: "Rack Spans" },
      { id: "safe-spans-process", label: "Process Area Spans" },
    ],
  },
  {
    id: "pipe-flexibility",
    label: "Pipe Flexibility",
    children: [
      { id: "pipe-flex-loop", label: "Pipe Loop" },
      { id: "pipe-flex-first-guide", label: "Distance to First Guide" },
    ],
  },
  { id: "pressure-temperature-ratings", label: "Pressure-Temperature Ratings" },
];
