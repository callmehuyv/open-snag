import { PencilBrush } from 'fabric';
import type { Canvas, TPointerEventInfo, TPointerEvent } from 'fabric';
import type { AnnotationTool, ToolOptions } from './types';

export class FreehandTool implements AnnotationTool {
  name = 'freehand';

  activate(canvas: Canvas): void {
    canvas.isDrawingMode = true;
    canvas.selection = false;
    canvas.defaultCursor = 'crosshair';

    const brush = new PencilBrush(canvas);
    brush.color = '#ff0000';
    brush.width = 2;
    canvas.freeDrawingBrush = brush;

    canvas.forEachObject((obj) => {
      obj.set({ selectable: false, evented: false });
    });
    canvas.renderAll();
  }

  deactivate(canvas: Canvas): void {
    canvas.isDrawingMode = false;
    canvas.defaultCursor = 'default';
  }

  onMouseDown(_canvas: Canvas, _event: TPointerEventInfo<TPointerEvent>, options: ToolOptions): void {
    // Update brush settings on each stroke start
    if (_canvas.freeDrawingBrush) {
      _canvas.freeDrawingBrush.color = options.strokeColor;
      _canvas.freeDrawingBrush.width = options.strokeWidth;
    }
  }

  onMouseMove(_canvas: Canvas, _event: TPointerEventInfo<TPointerEvent>, _options: ToolOptions): void {
    // Handled by Fabric's drawing mode
  }

  onMouseUp(_canvas: Canvas, _event: TPointerEventInfo<TPointerEvent>, _options: ToolOptions): void {
    // Handled by Fabric's drawing mode
  }
}
