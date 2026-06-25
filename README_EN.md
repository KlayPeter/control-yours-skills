<div align="center">
  <img src="assets/logo.png" alt="Control Your Skills Logo" width="120" />
  <h1>✨ Control Your Skills ✨</h1>
  <p><strong>Your Ultimate Local-First AI Skill Manager & Hub</strong></p>

  <p>
    <a href="https://github.com/KlayPeter/control-yours-skills/releases/latest">
      <img src="https://img.shields.io/github/v/release/KlayPeter/control-yours-skills?style=flat-square&color=007AFF" alt="Latest Release" />
    </a>
    <a href="https://nodejs.org/">
      <img src="https://img.shields.io/badge/Node.js-24+-43853D?style=flat-square&logo=node.js&logoColor=white" alt="Node Version" />
    </a>
    <a href="https://www.electronjs.org/">
      <img src="https://img.shields.io/badge/Electron-Desktop-47848F?style=flat-square&logo=electron&logoColor=white" alt="Electron" />
    </a>
  </p>

  <p>
    <b>Empowering you to seamlessly discover, categorize, install, and distribute AI Skills across your entire digital ecosystem.</b>
  </p>
  <p>
    English | <a href="./README.md">简体中文</a>
  </p>
</div>

---

## 🚀 Features

### 💻 1. System Skills Aggregation
Automatically scans your computer and brings all scattered system-level AI skills into one centralized view. Instantly detect and manage your `.codex`, `.claude`, `.agents`, and other global skill profiles.

### 📂 2. Project-Level Skills Parsing
Import any local workspace or development project, and our engine will deep-scan to uncover hidden skills. View all project-bound skills in a crystal-clear directory tree.

### 🗂️ 3. Visual Categorization & Precision Installation (Core)
The ultimate solution for organizing the endless ocean of open-source skills found online.
- **Custom Local Archive**: Set up a unified local skill library and create custom categories (e.g., `video`, `img`, up to two levels deep).
- **Smart Node Detection**: The engine automatically distinguishes between "Categories" (standard folders) and "Skills" (folders containing a `SKILL.md` file), marking them with distinct visual indicators.
- **Targeted Installation**: When installing or saving a new skill, use our global selection modal to place it exactly into the precise sub-category you want.

### 🔄 4. Cross-Environment Distribution (Omni-Routing)
Break the silos between different AI platforms and projects. As long as there are no naming conflicts, you can freely **copy, transfer, and distribute** any skill across your entire ecosystem with a single click.
- Send a system `.codex` skill to `.claude`.
- Inject a local archived skill directly into an imported project.
- Backup a project-specific skill into your global category library.

---

## 🗺️ Roadmap & Future Plans

We are constantly evolving to make skill management effortless and intelligent. Here is what's coming next:

- [ ] **🔗 URL One-Click Install**: Found an amazing skill on GitHub? Just paste the link! The system will automatically parse the repository and seamlessly install the skill into your designated local category—no manual downloading required.
- [ ] **🧠 AI-Powered Skill Discovery**: A robust search engine driven by AI. Simply type _"Find some skills for making logos"_, and our AI will fetch, evaluate, and recommend the best matching skills with detailed reviews.
- [ ] **🏆 Skill Leaderboard & Trends**: Discover fresh capabilities through our curated leaderboards. Explore "Trending Repos", "Fastest Rising Stars", and "Top Rated" skills across various thematic categories to keep your AI toolkit cutting-edge.

---

## 📥 Download & Install

Head over to our [Releases Page](https://github.com/KlayPeter/control-yours-skills/releases/latest) and download the latest setup file for your platform.

- **Windows**: `Control Your Skills-Setup-<version>.exe`
*(macOS and Linux installers are coming soon!)*

---

## 🛠️ Local Development

`Control Your Skills` is built with a modern, robust tech stack: **Electron**, **Next.js**, and **TypeScript**.

### Requirements
- OS: Windows, macOS, or Linux
- Node.js: `v24+`
- npm: `v11+`

### Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```
   *This starts the Next.js dev server at `http://127.0.0.1:3211`, begins the Electron watch build, and launches the desktop window.*

### Build & Release

To create a local Windows installer:
```bash
npm run build
npm run dist:win
```
The output will be available in the `release/` directory.

> **Note**: For public releases, we highly recommend using the automated GitHub Actions workflow included in this repository (`.github/workflows/release.yml`), which handles dependency installation, bundling, and NSIS installer generation flawlessly.

---

<div align="center">
  <i>Built with ❤️ for the AI Agent Ecosystem. Take Control of Your Skills.</i>
</div>
