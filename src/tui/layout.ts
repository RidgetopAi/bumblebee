import { createTitleBar } from './panes/titlebar.js';
import { createPreview } from './panes/preview.js';
import { createStatusBar } from './panes/statusbar.js';

export interface TUILayout {
  titleBar: any;
  preview: any;
  statusBar: any;
}

export function createLayout(fileOrDir: string): TUILayout {
  const titleBar = createTitleBar();
  const preview = createPreview();
  const statusBar = createStatusBar(fileOrDir);

  return {
    titleBar,
    preview,
    statusBar,
  };
}

export function appendLayoutToScreen(screen: any, layout: TUILayout): void {
  screen.append(layout.titleBar);
  screen.append(layout.preview);
  screen.append(layout.statusBar);
}
