import fs from 'fs';

// Regex patterns for secrets
const PATTERNS = [
  {
    name: 'AWS Access Key ID',
    regex: /(AKIA[0-9A-Z]{16})/
  },
  {
    name: 'AWS Secret Access Key',
    regex: /(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])/
  },
  {
    name: 'Stripe Secret Key',
    regex: /(sk_live_[0-9a-zA-Z]{24})/
  },
  {
    name: 'JWT Token',
    regex: /eyJ[A-Za-z0-9-_=]+\.eyJ[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/
  },
  {
    name: 'Slack Token',
    regex: /(xox[baprs]-([0-9a-zA-Z]{10,48}))/
  },
  {
    name: 'Private Key Block',
    regex: /-----BEGIN (RSA|DSA|EC|PGP|OPENSSH) PRIVATE KEY-----/
  },
  {
    name: 'Google API Key',
    regex: /AIza[0-9A-Za-z\-_]{35}/
  },
  {
    name: 'Generic High Entropy Secret',
    // Matches 32+ char hex/base64 strings that look like keys
    // Avoiding common false positives like UUIDs or Git SHAs requires care.
    // This is a simplified "suspicious string" check.
    regex: /(?<![A-Za-z0-9])([A-Za-z0-9+/=]{32,})(?![A-Za-z0-9])/
  }
];

export const scanFileForSecrets = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const violations = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Skip comments (naive check)
      if (line.trim().startsWith('//') || line.trim().startsWith('#')) return;

      PATTERNS.forEach(pattern => {
        if (pattern.regex.test(line)) {
          // Check for false positives or exclusions here if needed
          // For high entropy, we might want to be more careful, but for now simple regex.
          
          // Exclude if it looks like a variable assignment from process.env
          if (line.includes('process.env')) return;

          violations.push({
            type: 'SECRET',
            name: pattern.name,
            file: filePath,
            line: index + 1,
            match: line.trim() // Be careful printing secrets, maybe truncate
          });
        }
      });
    });

    return violations;
  } catch (e) {
    return [];
  }
};

export const scanFilesForSecrets = (files) => {
  const violations = [];
  files.forEach(file => {
    // Text-based source files
    if (/\.(js|jsx|ts|tsx|json|yml|yaml|env|config)$/.test(file)) {
      violations.push(...scanFileForSecrets(file));
    }
  });
  return violations;
};
