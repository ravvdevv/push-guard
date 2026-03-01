import fs from 'fs';
import path from 'path';

const CONFIG_FILE = '.pushguard.json';

const DEFAULT_CONFIG = {
  strict: true,
  ignore: [], // Files or patterns to ignore
  secretScan: true,
  required: [] // List of env vars that MUST be present
};

export const loadConfig = () => {
  try {
    const configPath = path.resolve(process.cwd(), CONFIG_FILE);
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return { ...DEFAULT_CONFIG, ...config };
    }
  } catch (e) {
    // Ignore error, use default
  }
  return DEFAULT_CONFIG;
};

export const createConfig = () => {
  const configPath = path.resolve(process.cwd(), CONFIG_FILE);
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
    return true;
  }
  return false;
};
