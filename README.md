<p align="center">
  <img src="assets/gitmedic-logo.svg" alt="GitMedic Logo" width="160" height="160" />
</p>

<h1 align="center">🩺 GitMedic</h1>

<p align="center">
  <strong>Diagnose, cure, and test-prove your codebase on autopilot.</strong><br>
  <em>The first AI GitHub App with a TDD-first engine: Every PR comes with an automated reproduction test proving the bug is cured.</em>
</p>

<p align="center">
  <a href="https://github.com/marketplace"><img src="https://img.shields.io/badge/Marketplace-GitMedic-blue?logo=github" alt="GitHub Marketplace" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript" alt="TypeScript" /></a>
  <a href="https://probot.github.io/"><img src="https://img.shields.io/badge/Powered%20By-Probot-black?logo=probot" alt="Probot" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
  <a href="PRIVACY.md"><img src="https://img.shields.io/badge/Privacy-Policy-green.svg" alt="Privacy Policy" /></a>
  <a href="TERMS.md"><img src="https://img.shields.io/badge/Terms-of%20Service-purple.svg" alt="Terms of Service" /></a>
</p>

---

## ⚡ Why GitMedic? (The Problem with Existing AI Bots)

Most AI bots (like CodeRabbit or Sweep) open Pull Requests saying *"I think this fixes it"*, leaving engineers to manually test and debug hallucinations.

**GitMedic is different.** Built with a **TDD-First Multi-Agent Architecture**:
1. 🩺 **Diagnostician Agent:** Analyzes the issue, searches the repo, and isolates root causes.
2. 🧪 **Reproducer Agent:** Writes an automated unit test that **fails initially**, proving the bug exists.
3. 💊 **Surgeon Agent:** Applies minimal, surgical code patches until the reproduction test and CI test suite turn **100% green**.
4. 📋 **Reporter Agent:** Opens a clean Pull Request containing the diagnostic summary, the regression test, and proof of passing CI.

---

## 🚀 Quick Usage

Once GitMedic is installed on your repository:

### 1. On-Demand Cure via Comments
Comment on any issue:
```text
@gitmedic fix this bug
```
or
```text
@gitmedic cure
```

### 2. Auto-Cure on Labels
Add the label `gitmedic` or `bug` to any issue, and GitMedic will automatically start the surgical pipeline!

---

## 🛠️ Architecture & Tech Stack

```text
D:\gitmedic\
  ├── src/
  │    ├── config/env.ts         # Type-safe configuration with Zod
  │    ├── core/
  │    │     ├── diagnostician.ts # Root cause analyzer
  │    │     ├── reproducer.ts    # TDD failing test writer
  │    │     ├── surgeon.ts       # Code patcher & test runner
  │    │     └── reporter.ts      # Markdown discharge PR generator
  │    ├── git/sandbox.ts        # Isolated sterile Git sandbox
  │    ├── llm/provider.ts       # Multi-model AI provider (Gemini / Claude / OpenAI)
  │    ├── handlers/             # Probot Webhook event listeners
  │    ├── index.ts              # Probot App entrypoint
  │    └── server.ts             # Production server runner
```

---

## 💻 Local Development Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/ghazy2001/gitmedic.git
cd gitmedic
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Provide your API keys:
- `GEMINI_API_KEY` (Free and fast!) or `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`
- `WEBHOOK_PROXY_URL` (Generate one instantly for free at [smee.io/new](https://smee.io/new))

### 3. Run the Development Server
```bash
npm run dev
```

---

## 💼 Business & Monetization Model (GitHub Marketplace)

- **Free Tier:** 10 automated cures/month for public open-source repos.
- **Pro Tier ($29/month):** Unlimited cures for private repos, priority runner speed, and Slack/Discord notifications.
- **Team Tier ($99/month):** Up to 10 private repositories with custom test commands and branch protections.

---

## 👤 Author
**Mahmoud Ghazy** ([@ghazy2001](https://github.com/ghazy2001))  
*Building elite autonomous software engineering tools.*
