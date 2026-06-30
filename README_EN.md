<div align="center">
  <img src="public/logo.svg" alt="Control Your Skills Logo" width="120" />
  <h1>✨ Control Your Skills ✨</h1>
  <p><strong>Your Ultimate Local-First AI Skill Manager & Hub in the Multi-Agent Era</strong></p>

  <p>
    <a href="https://github.com/KlayPeter/control-yours-skills/releases/latest">
      <img src="https://img.shields.io/github/v/release/KlayPeter/control-yours-skills?style=flat-square&color=007AFF" alt="Latest Release" />
    </a>
    <a href="https://nodejs.org/">
      <img src="https://img.shields.io/badge/Node.js-20+-43853D?style=flat-square&logo=node.js&logoColor=white" alt="Node Version" />
    </a>
    <a href="https://www.electronjs.org/">
      <img src="https://img.shields.io/badge/Electron-Desktop-47848F?style=flat-square&logo=electron&logoColor=white" alt="Electron" />
    </a>
  </p>

  <p>
    <b>Solving the pain point of Skill fragmentation and version chaos when co-existing with multiple AI Agent tools (Cursor, Claude, Codex, Qoder, etc.).</b><br/>
    <b>Building a Single Source of Truth: modify once, apply everywhere.</b>
  </p>
  <p>
    English | <a href="./README.md">简体中文</a>
  </p>
</div>

---

## 🎯 Why Control Your Skills?

The current AI Coding ecosystem is blossoming, and developers frequently use multiple AI Agents simultaneously. However, while tools can be switched seamlessly, Skills do not automatically follow:
- If you update a Prompt in Codex, Claude Code still has the old version.
- Replicas with the same name but vastly different contents co-exist across various tool directories, making manual copying chaotic.

**Control Your Skills** adopts the concept of **"Central Repository + Targeted Distribution"** in Local Mode: it converges scattered Skills into a Single Source of Truth, intelligently mounting and synchronizing them across multi-Agent environments, completely eliminating Skill redundancy and version inconsistencies.

---

## 🚀 Core Features

### 🏛️ 1. Central Skill Repository
- **Single Source of Truth**: Establish a "home" for scattered Skills gathered online or written locally. The system builds a standardized central repository locally, centrally storing and categorizing all Skills.
- **Input Isolation**: Externally imported Skills first enter the "Staging" area for review and analysis before officially entering the repository, preventing garbage files from contaminating the library.

### 🔄 2. Multi-Environment Sync
- **Precision Distribution**: Sync skills from the central repository to system-level `.agents`, project-level `.codex`, or any custom workspace directory with one click.
- **Visualized Status**: A rigorous state machine is built at the bottom layer, visually exposing the synchronization status of every Skill in real-time.
  - ✅ `Synced`: Perfectly synchronized
  - ⚠️ `Local Changes`: Temporarily modified at the destination
  - 🔄 `Outdated`: Pending update
  - ❌ `Conflict`: Version conflict generated

### 🤖 3. Smart Ingestion
- **GitHub Direct Import**: Just input the GitHub repository URL, and the system will automatically pull it.
- **AI-Powered Metadata Extraction**: After configuring an AI model, the system automatically reads the repository's `README.md`, intelligently extracting the skill name, description, and installation strategy; it degrades gracefully to a rules engine when no AI is present.
- **Local ZIP / Folders**: Supports drag-and-drop importing of existing local archives or directories.

### 💻 4. Modern Desktop App
Breaking away from the obscure operations of traditional CLIs, we've built a high-aesthetic, responsive desktop client based on **Electron + Next.js + TypeScript**. With graphical overviews, drag-and-drop interactions, and one-click conflict resolution, geeky configuration workflows are transformed into a smooth product experience.

---

## 🗺️ Roadmap & Future Plans

We are constantly evolving and will further integrate with the cloud ecosystem in the future:

- [ ] **🌐 Registry Mode**: Access cloud centers like Nacos AI Registry, supporting cross-device synchronization and team-level Skill asset collaboration.
- [ ] **🧠 AI-Powered Skill Discovery**: Provide a native smart search box to scour the internet for high-quality open-source skills using natural language.
- [ ] **🏆 Skill Leaderboard & Trends**: Offer multi-dimensional trending lists (rising stars, soaring lists, various themed categories, etc.).

---

## 📥 Download & Install

Head over to our [Releases Page](https://github.com/KlayPeter/control-yours-skills/releases/latest) and download the latest setup file for your platform.

- **Windows**: `Control Your Skills-Setup-<version>.exe`
*(macOS and Linux installers are being built)*

---

## 🛠️ Local Development

### Requirements
- OS: Windows, macOS, or Linux
- Node.js: `v20+`
- npm: `v11+` / pnpm: `v9+`

### Quick Start

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Run Development Server**
   ```bash
   pnpm run dev
   ```
   *This command starts the Next.js local server and automatically launches the Electron desktop window and hot-reload listener.*

### Build & Release

```bash
pnpm run build
pnpm run dist
```
The generated installer will be stored in the `release/` directory.

> **Note**: For public releases, it is highly recommended to use the pre-configured GitHub Actions workflow in the repository (`.github/workflows/release.yml`).

---

<div align="center">
  <i>Built with ❤️ for the AI Agent Ecosystem. Take Control of Your Skills.</i>
</div>
