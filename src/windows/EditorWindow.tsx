import { useEffect } from 'react';
import { useCaptureStore } from '../stores/captureStore';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import Editor from '../components/editor/Editor';
import '../App.css';

export default function EditorWindow() {
  // Listen for capture data from the main window
  useEffect(() => {
    const unlisten = listen<{ base64: string; width: number; height: number }>(
      'editor-load-capture',
      (event) => {
        const { base64, width, height } = event.payload;
        useCaptureStore.getState().setCurrentCapture(base64, width, height);
      }
    );
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // Override "Back" / close to just close this window (not navigate)
  useEffect(() => {
    const store = useCaptureStore.getState();
    const origSetView = store.setCurrentView;
    // When editor tries to go "home", close the editor window instead
    useCaptureStore.setState({
      setCurrentView: (view) => {
        if (view === 'home') {
          getCurrentWindow().close();
        } else {
          origSetView(view);
        }
      },
    });
    return () => {
      useCaptureStore.setState({ setCurrentView: origSetView });
    };
  }, []);

  return <Editor />;
}
