import { useCallback, useEffect, useRef, useState } from 'react';

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface RegionSelectorProps {
  screenshotData: string;
  screenshotWidth: number;
  screenshotHeight: number;
  onConfirm: (x: number, y: number, width: number, height: number) => void;
  onCancel: () => void;
}

const HANDLE_SIZE = 8;
const MIN_SELECTION = 10;

const HANDLE_POSITIONS: HandlePosition[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

function getHandleCursor(pos: HandlePosition): string {
  const cursors: Record<HandlePosition, string> = {
    nw: 'nwse-resize',
    n: 'ns-resize',
    ne: 'nesw-resize',
    e: 'ew-resize',
    se: 'nwse-resize',
    s: 'ns-resize',
    sw: 'nesw-resize',
    w: 'ew-resize',
  };
  return cursors[pos];
}

function getHandleCoords(
  rect: SelectionRect,
  pos: HandlePosition
): { cx: number; cy: number } {
  const { x, y, width, height } = rect;
  const mx = x + width / 2;
  const my = y + height / 2;
  switch (pos) {
    case 'nw': return { cx: x, cy: y };
    case 'n':  return { cx: mx, cy: y };
    case 'ne': return { cx: x + width, cy: y };
    case 'e':  return { cx: x + width, cy: my };
    case 'se': return { cx: x + width, cy: y + height };
    case 's':  return { cx: mx, cy: y + height };
    case 'sw': return { cx: x, cy: y + height };
    case 'w':  return { cx: x, cy: my };
  }
}

export default function RegionSelector({
  screenshotData,
  screenshotWidth,
  screenshotHeight,
  onConfirm,
  onCancel,
}: RegionSelectorProps) {
  const [selection, setSelection] = useState<SelectionRect | null>(null);
  const [hasSelection, setHasSelection] = useState(false);

  // Use refs for drag state to avoid re-renders during mouse moves
  const isSelectingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const resizeHandleRef = useRef<HandlePosition | null>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const dragStartRectRef = useRef<SelectionRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // We need a ref for selection too, to read it in event handlers
  const selectionRef = useRef<SelectionRect | null>(null);
  selectionRef.current = selection;

  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  const clampRect = useCallback(
    (rect: SelectionRect): SelectionRect => {
      let { x, y, width, height } = rect;
      if (x < 0) { x = 0; }
      if (y < 0) { y = 0; }
      if (x + width > screenW) { width = screenW - x; }
      if (y + height > screenH) { height = screenH - y; }
      return { x, y, width, height };
    },
    [screenW, screenH]
  );

  const normalizeRect = useCallback(
    (sx: number, sy: number, ex: number, ey: number): SelectionRect => {
      const x = Math.min(sx, ex);
      const y = Math.min(sy, ey);
      const width = Math.abs(ex - sx);
      const height = Math.abs(ey - sy);
      return clampRect({ x, y, width, height });
    },
    [clampRect]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Ignore if target is a handle (handled separately)
      const target = e.target as HTMLElement;
      if (target.dataset.handle) return;

      e.preventDefault();
      const mx = e.clientX;
      const my = e.clientY;

      // Check if clicking inside existing selection (to drag)
      const sel = selectionRef.current;
      if (hasSelection && sel) {
        if (
          mx >= sel.x &&
          mx <= sel.x + sel.width &&
          my >= sel.y &&
          my <= sel.y + sel.height
        ) {
          isDraggingRef.current = true;
          startPosRef.current = { x: mx, y: my };
          dragStartRectRef.current = { ...sel };
          return;
        }
      }

      // Start new selection
      isSelectingRef.current = true;
      startPosRef.current = { x: mx, y: my };
      setSelection({ x: mx, y: my, width: 0, height: 0 });
      setHasSelection(false);
    },
    [hasSelection]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const mx = e.clientX;
      const my = e.clientY;

      if (isSelectingRef.current) {
        const rect = normalizeRect(
          startPosRef.current.x,
          startPosRef.current.y,
          mx,
          my
        );
        setSelection(rect);
        return;
      }

      if (isDraggingRef.current && dragStartRectRef.current) {
        const dx = mx - startPosRef.current.x;
        const dy = my - startPosRef.current.y;
        const orig = dragStartRectRef.current;
        let newX = orig.x + dx;
        let newY = orig.y + dy;
        // Clamp to screen
        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;
        if (newX + orig.width > screenW) newX = screenW - orig.width;
        if (newY + orig.height > screenH) newY = screenH - orig.height;
        setSelection({ x: newX, y: newY, width: orig.width, height: orig.height });
        return;
      }

      if (resizeHandleRef.current && dragStartRectRef.current) {
        const handle = resizeHandleRef.current;
        const orig = dragStartRectRef.current;
        let newRect = { ...orig };

        switch (handle) {
          case 'nw':
            newRect = normalizeRect(mx, my, orig.x + orig.width, orig.y + orig.height);
            break;
          case 'n':
            newRect = normalizeRect(orig.x, my, orig.x + orig.width, orig.y + orig.height);
            break;
          case 'ne':
            newRect = normalizeRect(orig.x, my, mx, orig.y + orig.height);
            break;
          case 'e':
            newRect = normalizeRect(orig.x, orig.y, mx, orig.y + orig.height);
            break;
          case 'se':
            newRect = normalizeRect(orig.x, orig.y, mx, my);
            break;
          case 's':
            newRect = normalizeRect(orig.x, orig.y, orig.x + orig.width, my);
            break;
          case 'sw':
            newRect = normalizeRect(mx, orig.y, orig.x + orig.width, my);
            break;
          case 'w':
            newRect = normalizeRect(mx, orig.y, orig.x + orig.width, orig.y + orig.height);
            break;
        }
        setSelection(newRect);
        return;
      }
    },
    [normalizeRect, screenW, screenH]
  );

  const handleMouseUp = useCallback(() => {
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      const sel = selectionRef.current;
      if (sel && sel.width >= MIN_SELECTION && sel.height >= MIN_SELECTION) {
        setHasSelection(true);
      } else {
        setSelection(null);
        setHasSelection(false);
      }
    }
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      dragStartRectRef.current = null;
    }
    if (resizeHandleRef.current) {
      resizeHandleRef.current = null;
      dragStartRectRef.current = null;
      // Ensure minimum size after resize
      const sel = selectionRef.current;
      if (sel && (sel.width < MIN_SELECTION || sel.height < MIN_SELECTION)) {
        setSelection(null);
        setHasSelection(false);
      }
    }
  }, []);

  const handleHandleMouseDown = useCallback(
    (e: React.MouseEvent, handle: HandlePosition) => {
      e.preventDefault();
      e.stopPropagation();
      resizeHandleRef.current = handle;
      startPosRef.current = { x: e.clientX, y: e.clientY };
      dragStartRectRef.current = selectionRef.current ? { ...selectionRef.current } : null;
    },
    []
  );

  const handleDoubleClick = useCallback(() => {
    const sel = selectionRef.current;
    if (sel && hasSelection && sel.width >= MIN_SELECTION && sel.height >= MIN_SELECTION) {
      // Scale selection coordinates to screenshot coordinates
      const scaleX = screenshotWidth / screenW;
      const scaleY = screenshotHeight / screenH;
      onConfirm(
        Math.round(sel.x * scaleX),
        Math.round(sel.y * scaleY),
        Math.round(sel.width * scaleX),
        Math.round(sel.height * scaleY)
      );
    }
  }, [hasSelection, onConfirm, screenshotWidth, screenshotHeight, screenW, screenH]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter') {
        const sel = selectionRef.current;
        if (sel && sel.width >= MIN_SELECTION && sel.height >= MIN_SELECTION) {
          const scaleX = screenshotWidth / screenW;
          const scaleY = screenshotHeight / screenH;
          onConfirm(
            Math.round(sel.x * scaleX),
            Math.round(sel.y * scaleY),
            Math.round(sel.width * scaleX),
            Math.round(sel.height * scaleY)
          );
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, onConfirm, screenshotWidth, screenshotHeight, screenW, screenH]);

  // Determine cursor
  const getCursor = (): string => {
    if (isSelectingRef.current) return 'crosshair';
    if (isDraggingRef.current) return 'move';
    return 'crosshair';
  };

  const bgImageUrl = `data:image/png;base64,${screenshotData}`;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        cursor: getCursor(),
        overflow: 'hidden',
        zIndex: 99999,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      {/* Screenshot background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${bgImageUrl})`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Dark overlay using 4 rectangles approach */}
      {selection ? (
        <>
          {/* Top */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: selection.y,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              pointerEvents: 'none',
            }}
          />
          {/* Bottom */}
          <div
            style={{
              position: 'absolute',
              top: selection.y + selection.height,
              left: 0,
              width: '100%',
              height: screenH - (selection.y + selection.height),
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              pointerEvents: 'none',
            }}
          />
          {/* Left */}
          <div
            style={{
              position: 'absolute',
              top: selection.y,
              left: 0,
              width: selection.x,
              height: selection.height,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              pointerEvents: 'none',
            }}
          />
          {/* Right */}
          <div
            style={{
              position: 'absolute',
              top: selection.y,
              left: selection.x + selection.width,
              width: screenW - (selection.x + selection.width),
              height: selection.height,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              pointerEvents: 'none',
            }}
          />
        </>
      ) : (
        /* Full dark overlay when no selection */
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Selection border and handles */}
      {selection && selection.width > 0 && selection.height > 0 && (
        <>
          {/* Selection border */}
          <div
            style={{
              position: 'absolute',
              left: selection.x,
              top: selection.y,
              width: selection.width,
              height: selection.height,
              border: '2px solid rgba(0, 120, 255, 0.8)',
              boxShadow: '0 0 0 1px rgba(0, 120, 255, 0.3), 0 0 8px rgba(0, 120, 255, 0.2)',
              pointerEvents: 'none',
              boxSizing: 'border-box',
            }}
          />

          {/* Move area (transparent div over selection for move cursor) */}
          {hasSelection && (
            <div
              style={{
                position: 'absolute',
                left: selection.x + HANDLE_SIZE,
                top: selection.y + HANDLE_SIZE,
                width: Math.max(0, selection.width - HANDLE_SIZE * 2),
                height: Math.max(0, selection.height - HANDLE_SIZE * 2),
                cursor: 'move',
              }}
            />
          )}

          {/* Resize handles */}
          {hasSelection &&
            HANDLE_POSITIONS.map((pos) => {
              const { cx, cy } = getHandleCoords(selection, pos);
              return (
                <div
                  key={pos}
                  data-handle={pos}
                  style={{
                    position: 'absolute',
                    left: cx - HANDLE_SIZE / 2,
                    top: cy - HANDLE_SIZE / 2,
                    width: HANDLE_SIZE,
                    height: HANDLE_SIZE,
                    backgroundColor: 'white',
                    border: '1px solid rgba(0, 120, 255, 0.8)',
                    cursor: getHandleCursor(pos),
                    zIndex: 10,
                  }}
                  onMouseDown={(e) => handleHandleMouseDown(e, pos)}
                />
              );
            })}

          {/* Dimensions label */}
          {(() => {
            const scaleX = screenshotWidth / screenW;
            const scaleY = screenshotHeight / screenH;
            const displayW = Math.round(selection.width * scaleX);
            const displayH = Math.round(selection.height * scaleY);
            // Position: below selection if room, else above, else inside
            let labelTop = selection.y + selection.height + 8;
            if (labelTop + 24 > screenH) {
              labelTop = selection.y - 28;
            }
            if (labelTop < 0) {
              labelTop = selection.y + 4;
            }
            const labelLeft = selection.x + selection.width / 2;
            return (
              <div
                style={{
                  position: 'absolute',
                  left: labelLeft,
                  top: labelTop,
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  color: 'white',
                  fontSize: '11px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 10,
                  userSelect: 'none',
                }}
              >
                {displayW} &times; {displayH}
              </div>
            );
          })()}
        </>
      )}

      {/* Instructions hint (shown when no selection) */}
      {!selection && (
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            fontSize: '13px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '8px 16px',
            borderRadius: '8px',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          Click and drag to select a region. Press Esc to cancel.
        </div>
      )}

      {/* Confirm hint (shown when selection exists) */}
      {hasSelection && selection && (
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            fontSize: '13px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '8px 16px',
            borderRadius: '8px',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          Press Enter or double-click to confirm. Esc to cancel.
        </div>
      )}
    </div>
  );
}
