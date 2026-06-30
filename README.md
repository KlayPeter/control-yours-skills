<div align="center">
  <img src="public/logo.svg" alt="Control Your Skills Logo" width="120" />
  <h1>✨ Control Your Skills ✨</h1>
  <p><strong>多 Agent 时代的本地化 AI 技能全枢纽</strong></p>

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
    <b>解决多 Agent 工具（Cursor, Claude, Codex, Qoder 等）共存时的 Skill 碎片化与版本混乱痛点。</b><br/>
    <b>构建单一信源（Single Source of Truth），一处修改，全局生效。</b>
  </p>
  <p>
    <a href="./README_EN.md">English</a> | 简体中文
  </p>
</div>

---

## 🎯 为什么需要 Control Your Skills？

当前 AI Coding 发展百花齐放，开发者经常同时使用多个 AI Agent 干活。然而，工具可以无缝切换，Skill 却无法自动跟随：
- 在 Codex 里更新了 Prompt，Claude Code 里还是旧版。
- 各个工具目录下并存同名但内容迥异的副本，手动复制陷入混乱。

**Control Your Skills** 采用 **“中心仓库 + 靶向分发”** 的 Local Mode 模式理念：将散落的 Skill 收敛为单一信源，向多 Agent 环境智能挂载与同步，彻底消除多 Agent 环境下的 Skill 冗余与版本不一致问题。

---

## 🚀 核心特性 (Features)

### 🏛️ 1. 统一的中心仓库 (Central Skill Repository)
- **单一信源**：为你网上搜集或本地编写的零散 Skill 建立一个“家”。系统在本地构建标准化的中心仓库，所有 Skill 集中存储，分类管理。
- **输入隔离**：外部引入的 Skill 先进入“暂存区 (Staging)”进行审查与分析，确认无误后再入库，防止垃圾文件污染。

### 🔄 2. 多环境分发与状态同步 (Multi-Environment Sync)
- **精准下发**：将中心仓库的技能一键同步至系统级 `.agents`、项目级 `.codex` 或任意自定义工作区目录。
- **状态可视化**：底层构建了严密的状态机，在 UI 上实时透出每一个 Skill 的同步状态。
  - ✅ `Synced`: 完美同步
  - ⚠️ `Local Changes`: 目标端被临时修改
  - 🔄 `Outdated`: 待更新
  - ❌ `Conflict`: 产生版本冲突

### 🤖 3. 智能解析与多源导入 (Smart Ingestion)
- **GitHub 直连导入**：仅需输入 GitHub 仓库地址，系统即可自动拉取。
- **AI 赋能元数据提取**：配置 AI 模型后，系统会自动阅读仓库的 `README.md`，智能提取技能名称、描述及安装策略；无 AI 时也能平滑降级至规则引擎。
- **本地 ZIP / 文件夹**：支持拖拽导入本地现有的压缩包或目录。

### 💻 4. 极致化现代客户端 (Modern Desktop App)
打破传统 CLI 的晦涩操作，基于 **Electron + Next.js + TypeScript** 打造的高颜值、响应式桌面客户端。图表化概览、拖拽式交互、一键处理冲突，让极客的配置流转变成流畅的产品体验。

---

## 🗺️ 开发计划 (Roadmap & Future Plans)

我们正在持续进化，未来将进一步打通云端生态：

- [ ] **🌐 Registry Mode (云端注册中心)**：接入 Nacos AI Registry 等云端中心，支持跨设备同步与团队级别的 Skill 资产协作。
- [ ] **🧠 强 AI 驱动技能检索 (AI-Powered Skill Discovery)**：提供原生的智能搜索框，用自然语言搜罗全网优质开源技能。
- [ ] **🏆 技能排行榜与趋势 (Skill Leaderboard & Trends)**：提供多维度的热门榜单（新星榜、飙升榜、不同主题分类等）。

---

## 📥 下载安装 (Download & Install)

前往我们的 [Releases 页面](https://github.com/KlayPeter/control-yours-skills/releases/latest) 下载适用于你系统的最新安装包。

- **Windows**: `Control Your Skills-Setup-<version>.exe`
*(macOS 和 Linux 安装包正在构建中)*

---

## 🛠️ 本地开发 (Local Development)

### 环境依赖
- 操作系统: Windows, macOS, 或 Linux
- Node.js: `v20+`
- npm: `v11+` / pnpm: `v9+`

### 快速启动

1. **安装依赖**
   ```bash
   pnpm install
   ```

2. **运行开发环境**
   ```bash
   pnpm run dev
   ```
   *该命令将启动 Next.js 本地服务，并自动启动 Electron 桌面窗口及热更新监听。*

### 构建与打包

```bash
pnpm run build
pnpm run dist
```
生成的安装包将存放在 `release/` 目录下。

> **提示**: 对于公开发布版本，强烈建议使用仓库内配置好的 GitHub Actions 工作流（`.github/workflows/release.yml`）。

---

<div align="center">
  <i>Built with ❤️ for the AI Agent Ecosystem. Take Control of Your Skills.</i>
</div>
