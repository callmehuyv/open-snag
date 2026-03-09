import { Ellipse } from 'fabric';
import type { Canvas, TPointerEventInfo, TPointerEvent } from 'fabric';
import type { AnnotationTool, ToolOptions } from './types';

export class EllipseTool implements AnnotationTool {
  name = 'ellipse';
  private isDrawing = false;
  private startX = 0;
  private startY = 0;
  private ellipse: Ellipse | null = null;

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
    this.ellipse = null;
    canvas.defaultCursor = 'default';
  }

  onMouseDown(canvas: Canvas, event: TPointerEventInfo<TPointerEvent>, options: ToolOptions): void {
    const pointer = canvas.getScenePoint(event.e);
    this.isDrawing = true;
    this.startX = pointer.x;
    this.startY = pointer.y;

    this.ellipse = new Ellipse({
      left: pointer.x,
      top: pointer.y,
      rx: 0,
      ry: 0,
      stroke: options.strokeColor,
      strokeWidth: options.strokeWidth,
      fill: options.fillColor,
      selectable: false,
      evented: false,
    });

    canvas.add(this.ellipse);
    canvas.renderAll();
  }

  onMouseMove(canvas: Canvas, event: TPointerEventInfo<TPointerEvent>, _options: ToolOptions): void {
    if (!this.isDrawing || !this.ellipse) return;

    const pointer = canvas.getScenePoint(event.e);
    const rx = Math.abs(pointer.x - this.startX) / 2;
    const ry = Math.abs(pointer.y - this.startY) / 2;
    const left = Math.min(this.startX, pointer.x);
    const top = Math.min(this.startY, pointer.y);

    this.ellipse.set({ left, top, rx, ry });
    canvas.renderAll();
  }

  onMouseUp(_canvas: Canvas, _event: TPointerEventInfo<TPointerEvent>, _options: ToolOptions): void {
    if (!this.isDrawing || !this.ellipse) return;
    this.isDrawing = false;

    if ((this.ellipse.rx ?? 0) < 2 && (this.ellipse.ry ?? 0) < 2) {
      _canvas.remove(this.ellipse);
    } else {
      this.ellipse.set({ selectable: true, evented: true });
      this.ellipse.setCoords();
    }

    this.ellipse = null;
    _canvas.renderAll();
  }
}
