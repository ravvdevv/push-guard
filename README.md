# push-guard 👮

[![npm version](https://img.shields.io/npm/v/push-guard.svg)](https://www.npmjs.com/package/push-guard)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

> Secure your environment variables and secrets before they reach your remote repository.

**push-guard** is a lightweight, zero-dependency Git pre-push enforcement tool designed for Node.js and TypeScript projects. It acts as a final gatekeeper, ensuring that your team maintains a strict contract between code usage and environment configuration.

---

## 📖 Table of Contents

- [Motivation](#-motivation)
- [Key Features](#-key-features)
- [Installation](#-installation)
- [Getting Started](#-getting-started)
- [Command Reference](#-command-reference)
- [Configuration](#-configuration)
- [Violation Rules](#-violation-rules)
- [CI/CD Integration](#-cicd-integration)
- [License](#-license)

---

## 🎯 Motivation

Modern applications rely heavily on `process.env`. However, the bridge between code and environment configuration is often brittle. Developers frequently:
- Add new environment variables without updating `.env.example`.
- Accidentally commit sensitive `.env` files to version control.
- Leak secrets (AWS keys, API tokens) by hardcoding them for "quick testing."

**push-guard** automates the detection of these risks, blocking unsafe pushes locally before they become security incidents.

---

## ✨ Key Features

- **Automated Git Hooks:** One-command installation of a native Git `pre-push` hook.
- **Smart Scanning:** Only scans modified files to keep your workflow fast (<1s).
- **Secret Detection:** Built-in regex patterns for AWS, Stripe, Slack, JWTs, and high-entropy strings.
- **Contract Enforcement:** Validates that every `process.env.KEY` used in code exists in your `.env.example`.
- **Zero-Config Generation:** Automatically build or update your `.env.example` from existing code.
- **Strict Mode:** Designed for CI/CD pipelines to ensure 100% compliance.

---

## 📦 Installation

```bash
# Using npm
npm install push-guard --save-dev

# Using bun
bun add push-guard --dev

# Using yarn
yarn add push-guard --dev
```

---

## 🚀 Getting Started

1. **Initialize the tool:**
   This creates `.pushguard.json` and installs the Git hook.
   ```bash
   npx push-guard init
   ```

2. **Run a manual audit:**
   ```bash
   npx push-guard check --all
   ```

3. **Sync your documentation:**
   Ensure your `.env.example` is up to date with your code.
   ```bash
   npx push-guard generate
   ```

---

## 🛠 Command Reference

| Command | Option | Description |
|:---|:---|:---|
| `init` | - | Installs Git pre-push hook & creates config. |
| `check` | `--all` | Scans all project files instead of just staged changes. |
| `check` | `--strict`| Exits with code 1 on ERROR level violations. |
| `generate`| - | Extracts all `process.env` usage and updates `.env.example`. |
| `--version`| - | Displays the current version of push-guard. |

---

## ⚙️ Configuration

A `.pushguard.json` file is created in your root directory upon initialization.

```json
{
  "strict": true,
  "ignore": [
    "**/node_modules/**",
    "**/dist/**",
    "**/tests/**"
  ],
  "secretScan": true,
  "required": [
    "NODE_ENV",
    "PORT"
  ]
}
```

---

## 🚨 Violation Rules

| Type | Severity | Condition |
|:---|:---:|:---|
| **ENV** | `ERROR` | A `process.env.VAR` is found in code but not in `.env.example`. |
| **SECRET** | `ERROR` | A hardcoded secret pattern (e.g., `AKIA...`) is detected in source. |
| **SECURITY**| `ERROR` | The `.env` file is tracked by Git (exists in `git ls-files`). |
| **CONFIG** | `WARN` | The `.env.example` file is missing entirely. |

---

## 🤖 CI/CD Integration

To use **push-guard** in your CI pipeline (GitHub Actions, GitLab CI, etc.), use the `--strict` and `--all` flags:

```bash
# Example for GitHub Actions
- name: Environment Audit
  run: npx push-guard check --all --strict
```

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).

---

<p align="center">
  Built with 👮 by the Open Source Community
</p>
