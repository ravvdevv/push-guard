#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { installHook, getStagedFiles } from '../lib/git.js';
import { validate } from '../lib/validator.js';
import { loadConfig, createConfig } from '../lib/config.js';
import { extractAllEnvUsage } from '../lib/scanner.js';
import { log } from '../lib/utils.js';

// Load package.json for version
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url)));

program
  .name('push-guard')
  .description(pkg.description)
  .version(pkg.version);

program
  .command('init')
  .description('Initialize push-guard: create config and install git hook')
  .action(() => {
    log.title('👮 PushGuard Initialization');
    
    if (createConfig()) {
      log.success('Created .pushguard.json');
    } else {
      log.info('.pushguard.json already exists');
    }

    installHook();
  });

program
  .command('check')
  .description('Run checks on staged files (or all files)')
  .option('-s, --strict', 'Exit with code 1 if violations found')
  .option('--all', 'Check all files instead of just staged')
  .action((options) => {
    log.title('👮 PushGuard Check');
    const config = loadConfig();

    let filesToCheck = [];
    if (options.all) {
      // Simplification: recursively find all js/ts files
      // For now, let's just stick to a glob pattern or simple recursion if requested
      // But typically pre-push checks staged files.
      // Let's warn implementation limit for --all or implement a simple recursive finder.
      // Implementing simple recursive finder for now.
      const getAllFiles = (dir, fileList = []) => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          if (config.ignore && config.ignore.includes(file)) return;
          if (file.startsWith('node_modules') || file.startsWith('.git')) return;
          
          const filePath = path.join(dir, file);
          if (fs.statSync(filePath).isDirectory()) {
            getAllFiles(filePath, fileList);
          } else {
            fileList.push(filePath);
          }
        });
        return fileList;
      };
      filesToCheck = getAllFiles(process.cwd());
    } else {
      filesToCheck = getStagedFiles();
    }

    if (filesToCheck.length === 0) {
      log.info('No files to check.');
      return;
    }

    log.info(`Scanning ${filesToCheck.length} files...`);
    const violations = validate(filesToCheck, config);

    if (violations.length > 0) {
      log.title(`\n🚨 Found ${violations.length} violations:`);
      
      violations.forEach(v => {
        const color = v.severity === 'ERROR' ? chalk.red : chalk.yellow;
        console.log(color(`[${v.severity}] ${v.message}`));
        if (v.file) console.log(chalk.gray(`  at ${v.file}:${v.line}`));
        if (v.details) {
            v.details.forEach(d => console.log(chalk.gray(`  at ${d}`)));
        }
      });

      if (options.strict && violations.some(v => v.severity === 'ERROR')) {
        console.log('');
        log.error('❌ Checks failed. Push aborted.');
        process.exit(1);
      }
    } else {
      log.success('\n✨ All checks passed!');
    }
  });

program
  .command('generate')
  .description('Generate .env.example from current code usage')
  .action(() => {
    log.title('📝 Generating .env.example');
    
    // Scan all files for this command
    const getAllFiles = (dir, fileList = []) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        if (file.startsWith('node_modules') || file.startsWith('.git')) return;
        
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
          getAllFiles(filePath, fileList);
        } else {
          fileList.push(filePath);
        }
      });
      return fileList;
    };

    const files = getAllFiles(process.cwd());
    const usage = extractAllEnvUsage(files);
    const uniqueKeys = [...new Set(usage.map(u => u.key))].sort();

    if (uniqueKeys.length === 0) {
      log.info('No environment variables detected in code.');
      return;
    }

    const content = uniqueKeys.map(key => `${key}=`).join('\n');
    const examplePath = path.resolve(process.cwd(), '.env.example');

    if (fs.existsSync(examplePath)) {
      // Merge logic? Or just overwrite? 
      // Safe approach: Append missing
      const existing = fs.readFileSync(examplePath, 'utf-8');
      const lines = existing.split('\n');
      const existingKeys = lines.map(l => l.split('=')[0].trim()).filter(Boolean);
      
      const newKeys = uniqueKeys.filter(k => !existingKeys.includes(k));
      if (newKeys.length > 0) {
        fs.appendFileSync(examplePath, '\n' + newKeys.map(key => `${key}=`).join('\n'));
        log.success(`Added ${newKeys.length} new variables to .env.example`);
      } else {
        log.info('No new variables to add to .env.example');
      }
    } else {
      fs.writeFileSync(examplePath, content);
      log.success('Created .env.example');
    }
  });

program.parse();
