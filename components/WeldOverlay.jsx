"use client";

import WeldPointMarker from "./WeldPointMarker";

function WeldOverlay({
  weldPoints,
  selectedWeldId,
  onWeldClick,
  canDrag = false,
  onMoveWeldPoint,
  onMoveIndicator,
  pageWrapperRef,
}) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {weldPoints.map((weld) => (
        <WeldPointMarker
          key={weld.id}
          weld={weld}
          weldPoints={weldPoints}
          onClick={onWeldClick}
          isSelected={weld.id === selectedWeldId}
          canDrag={canDrag}
          onMoveWeldPoint={onMoveWeldPoint}
          onMoveIndicator={onMoveIndicator}
          pageWrapperRef={pageWrapperRef}
        />
      ))}
    </div>
  );
}

export default WeldOverlay;
