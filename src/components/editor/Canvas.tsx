import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef, useState } from 'react';
import { Canvas as FabricCanvas, FabricImage } from 'fabric';
import type { TPointerEventInfo, TPointerEvent } from 'fabric';
import { useCaptureStore } from '../../stores/captureStore';
import { useEditorStore } from '../../stores/editorStore';
import { getToolInstance } from './tools';
import type { AnnotationTool, ToolOptions } from './tools';

export interface CanvasHandle {
  undo: () => void;
  redo: () => void;
  exportImage: () => Promise<string>;
  exportJSON: () => string;
  deleteSelected: () => void;
}

const AnnotationCanvas = forwardRef<CanvasHandle>(function AnnotationCanvas(_props, ref) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const activeToolRef = useRef<AnnotationTool | null>(null);
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const isSavingState = useRef(false);
  const [canvasDims, setCanvasDims] = useState<{ width: number; height: number }>({ width: 800, height: 600 });

  const { currentCapture, captureWidth, captureHeight } = useCaptureStore();
  const {
    activeTool,
    strokeColor,
    fillColor,
    strokeWidth,
    fontSize,
    fontFamily,
    incrementStep,
  } = useEditorStore();

  // Memoize tool options getter
  const getToolOptions = useCallback((): ToolOptions => ({
    strokeColor,
    fillColor,
    strokeWidth,
    fontSize,
    fontFamily,
    getStepNumber: incrementStep,
  }), [strokeColor, fillColor, strokeWidth, fontSize, fontFamily, incrementStep]);

  // Save canvas state for undo/redo
  const saveState = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || isSavingState.current) return;
    isSavingState.current = true;

    const json = JSON.stringify(canvas.toJSON());
    undoStack.current.push(json);
    // Clear redo stack on new action
    redoStack.current = [];

    // Limit undo history
    if (undoStack.current.length > 50) {
      undoStack.current.shift();
    }

    isSavingState.current = false;
  }, []);

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasElRef.current) return;

    const canvas = new FabricCanvas(canvasElRef.current, {
      width: canvasDims.width,
      height: canvasDims.height,
      backgroundColor: '#1a1a1a',
    });

    fabricRef.current = canvas;

    // Save initial state
    const json = JSON.stringify(canvas.toJSON());
    undoStack.current = [json];
    redoStack.current = [];

    // Listen for object modifications to save state
    canvas.on('object:added', () => {
      if (!isSavingState.current) saveState();
    });
    canvas.on('object:modified', () => {
      if (!isSavingState.current) saveState();
    });
    canvas.on('object:removed', () => {
      if (!isSavingState.current) saveState();
    });

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load background image when capture changes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !currentCapture) return;

    const dataUrl = `data:image/png;base64,${currentCapture}`;

    FabricImage.fromURL(dataUrl).then((img) => {
      const imgWidth = captureWidth || (img.width ?? 800);
      const imgHeight = captureHeight || (img.height ?? 600);

      canvas.setDimensions({ width: imgWidth, height: imgHeight });
      setCanvasDims({ width: imgWidth, height: imgHeight });

      // Set as background image, scaled to fit
      img.set({
        scaleX: imgWidth / (img.width ?? imgWidth),
        scaleY: imgHeight / (img.height ?? imgHeight),
      });
      canvas.backgroundImage = img;
      canvas.renderAll();

      // Save initial state with background
      undoStack.current = [JSON.stringify(canvas.toJSON())];
      redoStack.current = [];
    });
  }, [currentCapture, captureWidth, captureHeight]);

  // Wire mouse events
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: TPointerEventInfo<TPointerEvent>) => {
      if (activeToolRef.current) {
        if (activeToolRef.current.name === 'freehand') {
          if (canvas.freeDrawingBrush) {
            const opts = getToolOptions();
            canvas.freeDrawingBrush.color = opts.strokeColor;
            canvas.freeDrawingBrush.width = opts.strokeWidth;
          }
          return;
        }
        activeToolRef.current.onMouseDown(canvas, e, getToolOptions());
      }
    };

    const handleMouseMove = (e: TPointerEventInfo<TPointerEvent>) => {
      if (activeToolRef.current && activeToolRef.current.name !== 'freehand') {
        activeToolRef.current.onMouseMove(canvas, e, getToolOptions());
      }
    };

    const handleMouseUp = (e: TPointerEventInfo<TPointerEvent>) => {
      if (activeToolRef.current && activeToolRef.current.name !== 'freehand') {
        activeToolRef.current.onMouseUp(canvas, e, getToolOptions());
      }
    };

    // Use the object-based event registration for cleaner cleanup
    const dispose = canvas.on({
      'mouse:down': handleMouseDown,
      'mouse:move': handleMouseMove,
      'mouse:up': handleMouseUp,
    });

    return () => {
      dispose();
    };
  }, [getToolOptions]);

  // Handle tool changes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Deactivate previous tool
    if (activeToolRef.current) {
      activeToolRef.current.deactivate(canvas);
    }

    // Activate new tool
    const tool = getToolInstance(activeTool);
    activeToolRef.current = tool;
    tool.activate(canvas);
  }, [activeTool]);

  // Update freehand brush when colors change
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || activeTool !== 'freehand') return;
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = strokeColor;
      canvas.freeDrawingBrush.width = strokeWidth;
    }
  }, [strokeColor, strokeWidth, activeTool]);

  // Expose imperative methods
  useImperativeHandle(ref, () => ({
    undo: () => {
      const canvas = fabricRef.current;
      if (!canvas || undoStack.current.length <= 1) return;

      const currentState = undoStack.current.pop()!;
      redoStack.current.push(currentState);

      const previousState = undoStack.current[undoStack.current.length - 1];
      isSavingState.current = true;
      canvas.loadFromJSON(previousState).then(() => {
        canvas.renderAll();
        isSavingState.current = false;
      });
    },

    redo: () => {
      const canvas = fabricRef.current;
      if (!canvas || redoStack.current.length === 0) return;

      const nextState = redoStack.current.pop()!;
      undoStack.current.push(nextState);

      isSavingState.current = true;
      canvas.loadFromJSON(nextState).then(() => {
        canvas.renderAll();
        isSavingState.current = false;
      });
    },

    exportImage: async (): Promise<string> => {
      const canvas = fabricRef.current;
      if (!canvas) return '';

      // Deselect all objects so selection handles aren't exported
      canvas.discardActiveObject();
      canvas.renderAll();

      const dataUrl = canvas.toDataURL({
        format: 'webp',
        quality: 0.95,
        multiplier: 1,
      });

      // Strip the data:image/webp;base64, prefix
      return dataUrl.replace(/^data:image\/webp;base64,/, '');
    },

    exportJSON: (): string => {
      const canvas = fabricRef.current;
      if (!canvas) return '{}';
      return JSON.stringify(canvas.toJSON());
    },

    deleteSelected: () => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const activeObjects = canvas.getActiveObjects();
      if (activeObjects.length === 0) return;

      activeObjects.forEach((obj) => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.renderAll();
    },
  }), []);

  return (
    <div className="flex-1 overflow-auto flex items-start justify-center bg-zinc-950 p-4">
      <div
        style={{ width: canvasDims.width, height: canvasDims.height }}
        className="shadow-lg flex-shrink-0"
      >
        <canvas ref={canvasElRef} />
      </div>
    </div>
  );
});

export default AnnotationCanvas;
