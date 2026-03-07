"use client";

import WeldPointMarker from "./WeldPointMarker";

function WeldOverlay({
  weldPoints,
  selectedWeldId,
  onWeldClick,
  onWeldDoubleClick,
  canDrag = false,
  onMoveWeldPoint,
  onMoveIndicator,
  onResizeLabel,
  onMoveLineBend,
  pageWrapperRef,
  weldStatusByWeldId,
}) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {weldPoints.map((weld) => (
        <WeldPointMarker
          key={weld.id}
          weld={weld}
          weldPoints={weldPoints}
          onClick={onWeldClick}
          onDoubleClick={onWeldDoubleClick}
          isSelected={weld.id === selectedWeldId}
          canDrag={canDrag}
          onMoveWeldPoint={onMoveWeldPoint}
          onMoveIndicator={onMoveIndicator}
          onResizeLabel={onResizeLabel}
          onMoveLineBend={onMoveLineBend}
          pageWrapperRef={pageWrapperRef}
          weldStatus={weldStatusByWeldId?.get(weld.id)}
        />
      ))}
    </div>
  );
}

export default WeldOverlay;
