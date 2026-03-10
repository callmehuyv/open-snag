import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { emit } from '@tauri-apps/api/event';

export async function openEditorWindow(
  base64: string,
  width: number,
  height: number,
) {
  // Check if editor window already exists
  const existing = await WebviewWindow.getByLabel('editor');
  if (existing) {
    await emit('editor-load-capture', { base64, width, height });
    await existing.setFocus();
    return existing;
  }

  const editorWin = new WebviewWindow('editor', {
    url: '/#editor',
    title: 'OpenSnag Editor',
    width: 1200,
    height: 800,
    resizable: true,
    center: true,
    decorations: false,
  });

  // Send the capture data once the window is ready
  editorWin.once('tauri://created', async () => {
    // Small delay to let React mount
    await new Promise((r) => setTimeout(r, 200));
    await emit('editor-load-capture', { base64, width, height });
  });

  return editorWin;
}

export async function openRecordingWindow() {
  // Check if recording window already exists
  const existing = await WebviewWindow.getByLabel('recording');
  if (existing) {
    await existing.setFocus();
    return existing;
  }

  const recordingWin = new WebviewWindow('recording', {
    url: '/#recording',
    title: 'OpenSnag Recording',
    width: 320,
    height: 120,
    resizable: false,
    alwaysOnTop: true,
    center: true,
    decorations: true,
  });

  return recordingWin;
}
