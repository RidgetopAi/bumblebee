import { readFileSync } from 'fs';
import { join } from 'path';

export interface BumblebeeConfig {
  editor: string;
  trueColor: 'auto' | 'on' | 'off';
  theme: string;
  tableStyle: 'padded' | 'compact';
  showDotfiles: boolean;
  explorerWidth: number;
  shikiTheme: string;
}

const DEFAULT_CONFIG: BumblebeeConfig = {
  editor: 'nvim',
  trueColor: 'auto',
  theme: 'bumblebee',
  tableStyle: 'padded',
  showDotfiles: false,
  explorerWidth: 28,
  shikiTheme: 'github-dark',
};

function validateConfig(config: any): BumblebeeConfig {
  const validated: BumblebeeConfig = { ...DEFAULT_CONFIG };

  if (typeof config !== 'object' || config === null) {
    throw new Error('Config must be a valid JSON object');
  }

  // Validate editor
  if (config.editor !== undefined) {
    if (typeof config.editor !== 'string' || config.editor.trim() === '') {
      throw new Error('Config.editor must be a non-empty string');
    }
    validated.editor = config.editor;
  }

  // Validate trueColor
  if (config.trueColor !== undefined) {
    if (!['auto', 'on', 'off'].includes(config.trueColor)) {
      throw new Error('Config.trueColor must be "auto", "on", or "off"');
    }
    validated.trueColor = config.trueColor;
  }

  // Validate theme
  if (config.theme !== undefined) {
    if (typeof config.theme !== 'string' || config.theme.trim() === '') {
      throw new Error('Config.theme must be a non-empty string');
    }
    validated.theme = config.theme;
  }

  // Validate tableStyle
  if (config.tableStyle !== undefined) {
    if (!['padded', 'compact'].includes(config.tableStyle)) {
      throw new Error('Config.tableStyle must be "padded" or "compact"');
    }
    validated.tableStyle = config.tableStyle;
  }

  // Validate showDotfiles
  if (config.showDotfiles !== undefined) {
    if (typeof config.showDotfiles !== 'boolean') {
      throw new Error('Config.showDotfiles must be a boolean');
    }
    validated.showDotfiles = config.showDotfiles;
  }

  // Validate explorerWidth
  if (config.explorerWidth !== undefined) {
    if (typeof config.explorerWidth !== 'number' || config.explorerWidth < 10 || config.explorerWidth > 100) {
      throw new Error('Config.explorerWidth must be a number between 10 and 100');
    }
    validated.explorerWidth = config.explorerWidth;
  }

  // Validate shikiTheme
  if (config.shikiTheme !== undefined) {
    if (typeof config.shikiTheme !== 'string' || config.shikiTheme.trim() === '') {
      throw new Error('Config.shikiTheme must be a non-empty string');
    }
    validated.shikiTheme = config.shikiTheme;
  }

  return validated;
}

export function loadConfig(configPath?: string): BumblebeeConfig {
  const configFile = configPath || join(process.cwd(), 'bumblebee.config.json');

  try {
    const configContent = readFileSync(configFile, 'utf-8');
    const parsedConfig = JSON.parse(configContent);
    return validateConfig(parsedConfig);
  } catch (error) {
    // If file doesn't exist or is invalid, use defaults
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { ...DEFAULT_CONFIG };
    }
    throw new Error(`Failed to load config from ${configFile}: ${(error as Error).message}`);
  }
}
