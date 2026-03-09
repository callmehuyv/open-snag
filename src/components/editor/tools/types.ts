import type { Canvas, TPointerEventInfo, TPointerEvent } from 'fabric';

export interface ToolOptions {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;
  getStepNumber: () => number;
}

export interface AnnotationTool {
  name: string;
  activate(canvas: Canvas): void;
  deactivate(canvas: Canvas): void;
  onMouseDown(canvas: Canvas, event: TPointerEventInfo<TPointerEvent>, options: ToolOptions): void;
  onMouseMove(canvas: Canvas, event: TPointerEventInfo<TPointerEvent>, options: ToolOptions): void;
  onMouseUp(canvas: Canvas, event: TPointerEventInfo<TPointerEvent>, options: ToolOptions): void;
}
