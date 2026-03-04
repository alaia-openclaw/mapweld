"use client";

import WeldPointMarker from "./WeldPointMarker";

function WeldOverlay({
  weldPoints,
  selectedWeldId,
  onWeldClick,
  isRelocating = false,
}) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {weldPoints.map((weld) => (
        <WeldPointMarker
          key={weld.id}
          weld={weld}
          onClick={onWeldClick}
          isSelected={weld.id === selectedWeldId}
          isRelocating={isRelocating}
        />
      ))}
    </div>
  );
}

export default WeldOverlay;
