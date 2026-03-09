import { IText } from 'fabric';
import type { Canvas, TPointerEventInfo, TPointerEvent } from 'fabric';
import type { AnnotationTool, ToolOptions } from './types';

export class TextTool implements AnnotationTool {
  name = 'text';

  activate(canvas: Canvas): void {
    canvas.selection = false;
    canvas.defaultCursor = 'text';
    canvas.forEachObject((obj) => {
      obj.set({ selectable: false, evented: false });
    });
    canvas.renderAll();
  }

  deactivate(canvas: Canvas): void {
    // Exit any active text editing
    const active = canvas.getActiveObject();
    if (active && active instanceof IText && active.isEditing) {
      active.exitEditing();
    }
    canvas.defaultCursor = 'default';
  }

  onMouseDown(canvas: Canvas, event: TPointerEventInfo<TPointerEvent>, options: ToolOptions): void {
    // Don't create a new text if clicking on an existing IText
    if (event.target && event.target instanceof IText) return;

    const pointer = canvas.getScenePoint(event.e);
    const text = new IText('Type here', {
      left: pointer.x,
      top: pointer.y,
      fontSize: options.fontSize,
      fontFamily: options.fontFamily,
      fill: options.strokeColor,
      selectable: true,
      evented: true,
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    text.enterEditing();
    text.selectAll();
    canvas.renderAll();
  }

  onMouseMove(_canvas: Canvas, _event: TPointerEventInfo<TPointerEvent>, _options: ToolOptions): void {
    // No action needed
  }

  onMouseUp(_canvas: Canvas, _event: TPointerEventInfo<TPointerEvent>, _options: ToolOptions): void {
    // No action needed
  }
}
