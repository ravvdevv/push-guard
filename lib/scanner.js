import fs from 'fs';

export const scanFileForEnvUsage = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const regex = /process\.env\.([A-Z0-9_]+)/g;
    const matches = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      // Calculate line number
      const lines = content.substring(0, match.index).split('\n');
      const lineNumber = lines.length;
      matches.push({
        key: match[1],
        line: lineNumber,
        file: filePath
      });
    }

    return matches;
  } catch (e) {
    // File might have been deleted or is not readable
    return [];
  }
};

export const extractAllEnvUsage = (files) => {
  const usage = [];
  files.forEach(file => {
    // Only scan JS/TS files
    if (/\.(js|jsx|ts|tsx|mjs|cjs)$/.test(file)) {
      usage.push(...scanFileForEnvUsage(file));
    }
  });
  return usage;
};
