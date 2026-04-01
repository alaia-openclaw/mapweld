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
  scale = 1,
  weldProgressByWeldId = null,
  pendingWeldId = null,
  placingIndicatorOverride = null,
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
          scale={scale}
          progressPercent={weldProgressByWeldId?.get(weld.id) ?? 0}
          indicatorPositionOverride={
            pendingWeldId === weld.id ? placingIndicatorOverride : null
          }
        />
      ))}
    </div>
  );
}

export default WeldOverlay;
