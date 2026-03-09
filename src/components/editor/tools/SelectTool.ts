import type { Canvas, TPointerEventInfo, TPointerEvent } from 'fabric';
import type { AnnotationTool, ToolOptions } from './types';

export class SelectTool implements AnnotationTool {
  name = 'select';

  activate(canvas: Canvas): void {
    canvas.selection = true;
    canvas.forEachObject((obj) => {
      obj.set({ selectable: true, evented: true });
    });
    canvas.defaultCursor = 'default';
    canvas.renderAll();
  }

  deactivate(canvas: Canvas): void {
    canvas.discardActiveObject();
    canvas.renderAll();
  }

  onMouseDown(_canvas: Canvas, _event: TPointerEventInfo<TPointerEvent>, _options: ToolOptions): void {
    // Selection is handled natively by Fabric.js
  }

  onMouseMove(_canvas: Canvas, _event: TPointerEventInfo<TPointerEvent>, _options: ToolOptions): void {
    // Selection is handled natively by Fabric.js
  }

  onMouseUp(_canvas: Canvas, _event: TPointerEventInfo<TPointerEvent>, _options: ToolOptions): void {
    // Selection is handled natively by Fabric.js
  }
}
