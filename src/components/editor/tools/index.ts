import type { ToolType } from '../../../stores/editorStore';
import type { AnnotationTool } from './types';
import { SelectTool } from './SelectTool';
import { ArrowTool } from './ArrowTool';
import { TextTool } from './TextTool';
import { RectangleTool } from './RectangleTool';
import { EllipseTool } from './EllipseTool';
import { LineTool } from './LineTool';
import { FreehandTool } from './FreehandTool';
import { HighlightTool } from './HighlightTool';
import { BlurTool } from './BlurTool';
import { StepNumberTool } from './StepNumberTool';

const toolInstances: Partial<Record<ToolType, AnnotationTool>> = {};

function createTool(toolType: ToolType): AnnotationTool {
  switch (toolType) {
    case 'select': return new SelectTool();
    case 'arrow': return new ArrowTool();
    case 'text': return new TextTool();
    case 'rectangle': return new RectangleTool();
    case 'ellipse': return new EllipseTool();
    case 'line': return new LineTool();
    case 'freehand': return new FreehandTool();
    case 'highlight': return new HighlightTool();
    case 'blur': return new BlurTool();
    case 'step-number': return new StepNumberTool();
    // stamp and crop don't have annotation tools yet, fall back to select
    case 'stamp':
    case 'crop':
      return new SelectTool();
  }
}

export function getToolInstance(toolType: ToolType): AnnotationTool {
  if (!toolInstances[toolType]) {
    toolInstances[toolType] = createTool(toolType);
  }
  return toolInstances[toolType];
}

export type { AnnotationTool } from './types';
export type { ToolOptions } from './types';
