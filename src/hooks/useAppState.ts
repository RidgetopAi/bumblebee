import { useState } from 'react';

/**
 * Application state interface for Bumblebee TUI
 */
export interface AppState {
  /** Current application mode */
  mode: 'normal' | 'render' | 'edit';
  /** Currently focused pane */
  focusedPane: 'preview' | 'explorer';
  /** Path to currently opened file */
  currentFile: string | null;
  /** Rendered content (ANSI string) */
  content: string;
}

/**
 * Initial application state
 */
const initialState: AppState = {
  mode: 'normal',
  focusedPane: 'preview',
  currentFile: null,
  content: '',
};

/**
 * Custom hook for managing Bumblebee application state
 */
export function useAppState() {
  const [state, setState] = useState<AppState>(initialState);

  /**
   * Transition to normal mode
   */
  const enterNormalMode = () => {
    setState(prev => ({ ...prev, mode: 'normal' }));
  };

  /**
   * Transition to render mode
   */
  const enterRenderMode = () => {
    setState(prev => ({ ...prev, mode: 'render' }));
  };

  /**
   * Transition to edit mode
   */
  const enterEditMode = () => {
    setState(prev => ({ ...prev, mode: 'edit' }));
  };

  /**
   * Set the current file
   */
  const setCurrentFile = (filePath: string | null) => {
    setState(prev => ({ ...prev, currentFile: filePath }));
  };

  /**
   * Set the rendered content
   */
  const setContent = (content: string) => {
    setState(prev => ({ ...prev, content }));
  };

  /**
   * Set focused pane
   */
  const setFocusedPane = (pane: 'preview' | 'explorer') => {
    setState(prev => ({ ...prev, focusedPane: pane }));
  };

  /**
   * Update entire state (for complex updates)
   */
  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  return {
    state,
    enterNormalMode,
    enterRenderMode,
    enterEditMode,
    setCurrentFile,
    setContent,
    setFocusedPane,
    updateState,
  };
}
