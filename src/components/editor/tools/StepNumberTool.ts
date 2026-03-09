import { Circle, FabricText, Group } from 'fabric';
import type { Canvas, TPointerEventInfo, TPointerEvent } from 'fabric';
import type { AnnotationTool, ToolOptions } from './types';

export class StepNumberTool implements AnnotationTool {
  name = 'step-number';

  activate(canvas: Canvas): void {
    canvas.selection = false;
    canvas.defaultCursor = 'crosshair';
    canvas.forEachObject((obj) => {
      obj.set({ selectable: false, evented: false });
    });
    canvas.renderAll();
  }

  deactivate(canvas: Canvas): void {
    canvas.defaultCursor = 'default';
  }

  onMouseDown(canvas: Canvas, event: TPointerEventInfo<TPointerEvent>, options: ToolOptions): void {
    const pointer = canvas.getScenePoint(event.e);
    const stepNum = options.getStepNumber();
    const radius = 15;

    const circle = new Circle({
      radius,
      fill: options.strokeColor,
      originX: 'center',
      originY: 'center',
    });

    const text = new FabricText(String(stepNum), {
      fontSize: 16,
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontWeight: 'bold',
      originX: 'center',
      originY: 'center',
    });

    const group = new Group([circle, text], {
      left: pointer.x - radius,
      top: pointer.y - radius,
      selectable: true,
      evented: true,
    });

    canvas.add(group);
    canvas.renderAll();
  }

  onMouseMove(_canvas: Canvas, _event: TPointerEventInfo<TPointerEvent>, _options: ToolOptions): void {
    // No action needed
  }

  onMouseUp(_canvas: Canvas, _event: TPointerEventInfo<TPointerEvent>, _options: ToolOptions): void {
    // No action needed
  }
}
