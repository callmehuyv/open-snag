import { Rect } from 'fabric';
import type { Canvas, TPointerEventInfo, TPointerEvent } from 'fabric';
import type { AnnotationTool, ToolOptions } from './types';

export class HighlightTool implements AnnotationTool {
  name = 'highlight';
  private isDrawing = false;
  private startX = 0;
  private startY = 0;
  private rect: Rect | null = null;

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
    this.rect = null;
    canvas.defaultCursor = 'default';
  }

  onMouseDown(canvas: Canvas, event: TPointerEventInfo<TPointerEvent>, _options: ToolOptions): void {
    const pointer = canvas.getScenePoint(event.e);
    this.isDrawing = true;
    this.startX = pointer.x;
    this.startY = pointer.y;

    this.rect = new Rect({
      left: pointer.x,
      top: pointer.y,
      width: 0,
      height: 0,
      fill: 'rgba(255, 255, 0, 0.3)',
      stroke: '',
      strokeWidth: 0,
      selectable: false,
      evented: false,
    });

    canvas.add(this.rect);
    canvas.renderAll();
  }

  onMouseMove(canvas: Canvas, event: TPointerEventInfo<TPointerEvent>, _options: ToolOptions): void {
    if (!this.isDrawing || !this.rect) return;

    const pointer = canvas.getScenePoint(event.e);
    const left = Math.min(this.startX, pointer.x);
    const top = Math.min(this.startY, pointer.y);
    const width = Math.abs(pointer.x - this.startX);
    const height = Math.abs(pointer.y - this.startY);

    this.rect.set({ left, top, width, height });
    canvas.renderAll();
  }

  onMouseUp(_canvas: Canvas, _event: TPointerEventInfo<TPointerEvent>, _options: ToolOptions): void {
    if (!this.isDrawing || !this.rect) return;
    this.isDrawing = false;

    if ((this.rect.width ?? 0) < 3 && (this.rect.height ?? 0) < 3) {
      _canvas.remove(this.rect);
    } else {
      this.rect.set({ selectable: true, evented: true });
      this.rect.setCoords();
    }

    this.rect = null;
    _canvas.renderAll();
  }
}
