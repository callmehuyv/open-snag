---
name: add-tool
description: Add a new annotation tool to the OpenSnag editor (arrow, text, shape, blur, etc.)
argument-hint: "[tool-name] e.g. arrow, text, rectangle, blur, highlight, step-number"
---

Add a new annotation tool named `$ARGUMENTS` to the OpenSnag editor:

## Steps

1. **Create the tool file**: `src/components/editor/tools/{ToolName}Tool.ts`
   - Follow the existing tool interface pattern in `src/components/editor/tools/`
   - Each tool must implement: `activate()`, `deactivate()`, `onMouseDown()`, `onMouseMove()`, `onMouseUp()`
   - Use Fabric.js objects for rendering

2. **Register the tool** in the Toolbar component at `src/components/editor/Toolbar.tsx`
   - Add an icon button for the tool
   - Wire it to the editor store's `setActiveTool()` action

3. **Add tool properties** to `src/components/editor/PropertyPanel.tsx`
   - Add any tool-specific settings (color, stroke width, font size, etc.)

4. **Update the editor store** at `src/stores/editorStore.ts`
   - Add the tool name to the `ToolType` union
   - Add any tool-specific state

5. **Test** by running `/dev` and verifying the tool works in the annotation editor

## Tool interface pattern
```typescript
import { Canvas } from "fabric";

export interface AnnotationTool {
  name: string;
  activate(canvas: Canvas): void;
  deactivate(canvas: Canvas): void;
  onMouseDown(event: fabric.IEvent): void;
  onMouseMove(event: fabric.IEvent): void;
  onMouseUp(event: fabric.IEvent): void;
}
```
