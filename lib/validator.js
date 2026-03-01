import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { extractAllEnvUsage } from './scanner.js';
import { scanFilesForSecrets } from './secrets.js';
import { isEnvFileTracked } from './git.js';
import { log } from './utils.js';

export const validate = (files, config) => {
  const violations = [];
  
  // 1. Check if .env is tracked
  if (isEnvFileTracked()) {
    violations.push({
      type: 'SECURITY',
      severity: 'ERROR',
      message: '.env file is tracked by git. Remove it immediately!'
    });
  }

  // 2. Secret Scanning
  if (config.secretScan) {
    const secretViolations = scanFilesForSecrets(files);
    secretViolations.forEach(v => {
      violations.push({
        type: 'SECRET',
        severity: 'ERROR',
        message: `Hardcoded secret detected: ${v.name}`,
        file: v.file,
        line: v.line
      });
    });
  }

  // 3. Env Variable Usage vs .env.example
  const envExamplePath = path.resolve(process.cwd(), '.env.example');
  let definedEnvs = [];
  
  if (fs.existsSync(envExamplePath)) {
    const exampleConfig = dotenv.parse(fs.readFileSync(envExamplePath));
    definedEnvs = Object.keys(exampleConfig);
  } else {
    // If no .env.example, we should warn? Or strictly fail?
    // Let's warn for now unless strict mode might imply we need it.
    violations.push({
      type: 'CONFIG',
      severity: 'WARNING',
      message: '.env.example file not found. Cannot verify env variables.'
    });
  }

  const usage = extractAllEnvUsage(files);
  const uniqueUsage = [...new Set(usage.map(u => u.key))];

  uniqueUsage.forEach(key => {
    if (!definedEnvs.includes(key) && fs.existsSync(envExamplePath)) {
      violations.push({
        type: 'ENV',
        severity: 'ERROR',
        message: `Environment variable used but not in .env.example: ${key}`,
        // We can find *where* it is used from the usage array
        details: usage.filter(u => u.key === key).map(u => `${u.file}:${u.line}`)
      });
    }
  });

  return violations;
};
