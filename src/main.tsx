import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import EditorWindow from "./windows/EditorWindow";
import RecordingWindow from "./windows/RecordingWindow";

function Root() {
  const hash = window.location.hash;

  if (hash === "#editor") {
    return <EditorWindow />;
  }
  if (hash === "#recording") {
    return <RecordingWindow />;
  }
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
