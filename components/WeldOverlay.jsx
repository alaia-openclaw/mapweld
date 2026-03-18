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
  spools = [],
  scale = 1,
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
          spools={spools}
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
          scale={scale}
          indicatorPositionOverride={pendingWeldId === weld.id && placingIndicatorOverride ? placingIndicatorOverride : null}
        />
      ))}
    </div>
  );
}

export default WeldOverlay;
