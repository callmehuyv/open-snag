import { Line, Polygon, Group, Point } from 'fabric';
import type { Canvas, TPointerEventInfo, TPointerEvent } from 'fabric';
import type { AnnotationTool, ToolOptions } from './types';

export class ArrowTool implements AnnotationTool {
  name = 'arrow';
  private isDrawing = false;
  private startX = 0;
  private startY = 0;
  private tempGroup: Group | null = null;

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
    this.tempGroup = null;
    canvas.defaultCursor = 'default';
  }

  onMouseDown(canvas: Canvas, event: TPointerEventInfo<TPointerEvent>, _options: ToolOptions): void {
    const pointer = canvas.getScenePoint(event.e);
    this.isDrawing = true;
    this.startX = pointer.x;
    this.startY = pointer.y;

    // Remove any existing temp group
    if (this.tempGroup) {
      canvas.remove(this.tempGroup);
      this.tempGroup = null;
    }
  }

  onMouseMove(canvas: Canvas, event: TPointerEventInfo<TPointerEvent>, options: ToolOptions): void {
    if (!this.isDrawing) return;

    const pointer = canvas.getScenePoint(event.e);

    // Remove previous temp group
    if (this.tempGroup) {
      canvas.remove(this.tempGroup);
    }

    this.tempGroup = this.createArrow(
      this.startX, this.startY,
      pointer.x, pointer.y,
      options.strokeColor, options.strokeWidth
    );
    canvas.add(this.tempGroup);
    canvas.renderAll();
  }

  onMouseUp(canvas: Canvas, event: TPointerEventInfo<TPointerEvent>, options: ToolOptions): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    const pointer = canvas.getScenePoint(event.e);

    // Remove temp group
    if (this.tempGroup) {
      canvas.remove(this.tempGroup);
      this.tempGroup = null;
    }

    // Only create if there's some distance
    const dx = pointer.x - this.startX;
    const dy = pointer.y - this.startY;
    if (Math.sqrt(dx * dx + dy * dy) < 5) return;

    const arrow = this.createArrow(
      this.startX, this.startY,
      pointer.x, pointer.y,
      options.strokeColor, options.strokeWidth
    );
    arrow.set({ selectable: true, evented: true });
    canvas.add(arrow);
    canvas.renderAll();
  }

  private createArrow(
    x1: number, y1: number,
    x2: number, y2: number,
    color: string, strokeWidth: number
  ): Group {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLength = Math.max(10, strokeWidth * 4);

    const shaft = new Line([x1, y1, x2, y2], {
      stroke: color,
      strokeWidth,
      strokeLineCap: 'round',
    });

    // Arrowhead points
    const tipX = x2;
    const tipY = y2;
    const leftX = tipX - headLength * Math.cos(angle - Math.PI / 6);
    const leftY = tipY - headLength * Math.sin(angle - Math.PI / 6);
    const rightX = tipX - headLength * Math.cos(angle + Math.PI / 6);
    const rightY = tipY - headLength * Math.sin(angle + Math.PI / 6);

    const arrowHead = new Polygon(
      [
        new Point(tipX, tipY),
        new Point(leftX, leftY),
        new Point(rightX, rightY),
      ],
      {
        fill: color,
        stroke: color,
        strokeWidth: 1,
      }
    );

    return new Group([shaft, arrowHead], {
      selectable: false,
      evented: false,
    });
  }
}
