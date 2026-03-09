import { Line } from 'fabric';
import type { Canvas, TPointerEventInfo, TPointerEvent } from 'fabric';
import type { AnnotationTool, ToolOptions } from './types';

export class LineTool implements AnnotationTool {
  name = 'line';
  private isDrawing = false;
  private line: Line | null = null;

  activate(canvas: Canvas): void {
    canvas.selection = false;
    canvas.defaultCursor = 'crosshair';
    canvas.forEachObject((obj) => {
      obj.set({ selectable: false, evented: false });
    });
    canvas.renderAll();
  }

  deactivate(canvas: Canvas): void {
    this.isDrawing = false;
    this.line = null;
    canvas.defaultCursor = 'default';
  }

  onMouseDown(canvas: Canvas, event: TPointerEventInfo<TPointerEvent>, options: ToolOptions): void {
    const pointer = canvas.getScenePoint(event.e);
    this.isDrawing = true;

    this.line = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
      stroke: options.strokeColor,
      strokeWidth: options.strokeWidth,
      strokeLineCap: 'round',
      selectable: false,
      evented: false,
    });

    canvas.add(this.line);
    canvas.renderAll();
  }

  onMouseMove(canvas: Canvas, event: TPointerEventInfo<TPointerEvent>, _options: ToolOptions): void {
    if (!this.isDrawing || !this.line) return;

    const pointer = canvas.getScenePoint(event.e);
    this.line.set({ x2: pointer.x, y2: pointer.y });
    canvas.renderAll();
  }

  onMouseUp(_canvas: Canvas, _event: TPointerEventInfo<TPointerEvent>, _options: ToolOptions): void {
    if (!this.isDrawing || !this.line) return;
    this.isDrawing = false;

    const x1 = this.line.x1 ?? 0;
    const y1 = this.line.y1 ?? 0;
    const x2 = this.line.x2 ?? 0;
    const y2 = this.line.y2 ?? 0;
    const dx = x2 - x1;
    const dy = y2 - y1;

    if (Math.sqrt(dx * dx + dy * dy) < 3) {
      _canvas.remove(this.line);
    } else {
      this.line.set({ selectable: true, evented: true });
      this.line.setCoords();
    }

    this.line = null;
    _canvas.renderAll();
  }
}
