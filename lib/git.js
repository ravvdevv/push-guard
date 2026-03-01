import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';

export const getGitRoot = () => {
  try {
    return execSync('git rev-parse --show-toplevel').toString().trim();
  } catch (e) {
    return null;
  }
};

export const getStagedFiles = () => {
  try {
    const root = getGitRoot();
    if (!root) return [];
    
    // Get staged files relative to git root
    const output = execSync('git diff --cached --name-only --diff-filter=ACMR').toString().trim();
    if (!output) return [];

    return output.split('\n').map(file => path.resolve(root, file));
  } catch (e) {
    return [];
  }
};

export const isEnvFileTracked = () => {
  try {
    const output = execSync('git ls-files .env').toString().trim();
    return output === '.env';
  } catch (e) {
    return false;
  }
};

export const installHook = () => {
  const root = getGitRoot();
  if (!root) {
    console.error(chalk.red('Error: Not a git repository.'));
    process.exit(1);
  }

  const hooksDir = path.join(root, '.git', 'hooks');
  const prePushPath = path.join(hooksDir, 'pre-push');

  const hookScript = `#!/bin/sh
# PushGuard Pre-Push Hook
# Prevent unsafe pushes related to environment variables and secrets

echo "👮 PushGuard: Checking for violations..."

# Check if push-guard is installed locally or globally
if command -v push-guard >/dev/null 2>&1; then
    push-guard check --strict
elif [ -f "./node_modules/.bin/push-guard" ]; then
    ./node_modules/.bin/push-guard check --strict
else
    echo "⚠️  PushGuard not found. Skipping checks."
    exit 0
fi

RESULT=$?
if [ $RESULT -ne 0 ]; then
    echo "❌ Push aborted by PushGuard."
    exit 1
fi

exit 0
`;

  try {
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }
    fs.writeFileSync(prePushPath, hookScript);
    fs.chmodSync(prePushPath, '755');
    console.log(chalk.green('✔ Git pre-push hook installed successfully.'));
  } catch (e) {
    console.error(chalk.red(`Error installing hook: ${e.message}`));
    process.exit(1);
  }
};
