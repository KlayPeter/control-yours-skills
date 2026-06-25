<div align="center">
  <img src="assets/logo.png" alt="Control Your Skills Logo" width="120" />
  <h1>✨ Control Your Skills ✨</h1>
  <p><strong>Your Ultimate Local-First AI Skill Manager & Hub | 你的私人本地化 AI 技能全枢纽</strong></p>

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
    <br/>
    <em>赋能开发者无缝发现、分类、安装和分发全生态的 AI 技能资产。</em>
  </p>
</div>

---

## 🚀 Features (核心特性)

### 💻 1. System Skills Aggregation (系统技能聚合)
Automatically scans your computer and brings all scattered system-level AI skills into one centralized view. Instantly detect and manage your `.codex`, `.claude`, `.agents`, and other global skill profiles.
> **一键侦测：** 自动扫描并展示你电脑里 `.codex`、`.claude`、`.agents` 等目录下的所有现成 Skills。

### 📂 2. Project-Level Skills Parsing (项目技能解析)
Import any local workspace or development project, and our engine will deep-scan to uncover hidden skills. View all project-bound skills in a crystal-clear directory tree.
> **深度解析：** 导入本地项目，系统即可瞬间揪出潜藏在项目任意角落的 Skills，以清晰的目录树结构呈现给你。

### 🗂️ 3. Visual Categorization & Precision Installation (可视化分类与精准安装)
The ultimate solution for organizing the endless ocean of open-source skills found online.
- **Custom Local Archive**: Set up a unified local skill library and create custom categories (e.g., `video`, `img`, up to two levels deep).
- **Smart Node Detection**: The engine automatically distinguishes between "Categories" (standard folders) and "Skills" (folders containing a `SKILL.md` file), marking them with distinct visual indicators.
- **Targeted Installation**: When installing or saving a new skill, use our global selection modal to place it exactly into the precise sub-category you want.
> **核心亮点：** 为你在网上搜集的零散 Skill 建立一个“家”。你可以在本地配置库自由创建二级分类目录。系统会智能检测目录下的 `SKILL.md` 文件来区分“分类目录”和“技能节点”。安装时可直接下发至指定的分类中，井井有条。

### 🔄 4. Cross-Environment Distribution (全生态互通流转)
Break the silos between different AI platforms and projects. As long as there are no naming conflicts, you can freely **copy, transfer, and distribute** any skill across your entire ecosystem with a single click.
> **万物互连：** 打破平台孤岛，无论是 `.codex` 系统技能、还是某个项目专有的技能，只要名字不冲突，均支持一键相互复制穿梭与分发！实现“一处发现，处处可用”。

---

## 🗺️ Roadmap & Future Plans (开发计划)

We are constantly evolving to make skill management effortless and intelligent. Here is what's coming next:
> **即将推出：**

- [ ] **🔗 URL One-Click Install (一键链接安装)**: Found an amazing skill on GitHub? Just paste the link! The system will automatically parse the repository and seamlessly install the skill into your designated local category—no manual downloading required. *(仅需贴入 GitHub 等网址，系统自动解析并替你一键安装到指定分类下。)*
- [ ] **🧠 AI-Powered Skill Discovery (强 AI 驱动技能检索)**: A robust search engine driven by AI. Simply type _"Find some skills for making logos"_, and our AI will fetch, evaluate, and recommend the best matching skills with detailed reviews. *(搜索框输入自然语言需求，AI 替你搜罗全网、测评并推荐，看中后直接一键安装！)*
- [ ] **🏆 Skill Leaderboard & Trends (技能排行榜与趋势)**: Discover fresh capabilities through our curated leaderboards. Explore "Trending Repos", "Fastest Rising Stars", and "Top Rated" skills across various thematic categories to keep your AI toolkit cutting-edge. *(提供不同维度的排行榜，随时获取最新鲜好用的开源技能推荐。)*

---

## 📥 Download & Install (下载安装)

Head over to our [Releases Page](https://github.com/KlayPeter/control-yours-skills/releases/latest) and download the latest setup file for your platform.

- **Windows**: `Control Your Skills-Setup-<version>.exe`
*(macOS and Linux installers are coming soon!)*

---

## 🛠️ Local Development (本地开发)

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
