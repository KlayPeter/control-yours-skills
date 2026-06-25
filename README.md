<div align="center">
  <img src="public/logo.svg" alt="Control Your Skills Logo" width="120" />
  <h1>✨ Control Your Skills ✨</h1>
  <p><strong>你的私人本地化 AI 技能全枢纽</strong></p>

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
    <b>赋能开发者无缝发现、分类、安装和分发全生态的 AI 技能资产。</b>
  </p>
  <p>
    <a href="./README_EN.md">English</a> | 简体中文
  </p>
</div>

---

## 🚀 核心特性 (Features)

### 💻 1. 系统技能聚合 (System Skills Aggregation)
**一键侦测**：自动扫描并展示你电脑里 `.codex`、`.claude`、`.agents` 等目录下的所有现成 Skills。让散落的系统级配置尽收眼底。

### 📂 2. 项目技能解析 (Project-Level Skills Parsing)
**深度解析**：导入任意本地开发项目，系统即可瞬间揪出潜藏在项目任意角落的 Skills，以清晰的目录树结构呈现给你，方便统一管理。

### 🗂️ 3. 可视化分类与精准安装 (Visual Categorization & Precision Installation)
为你在网上搜集的零散 Skill 建立一个“家”。
- **自定义本地归档**：你可以在本地配置库自由创建最多至两级的分类目录（如 `video`, `img` 等）。
- **智能节点识别**：系统会智能检测目录下的 `SKILL.md` 文件来精准区分“分类目录”与“技能节点”。
- **精准下发**：安装新技能时，你可通过全局弹窗，直接将其下发至指定的细分分类中，从此告别混乱，井井有条。

### 🔄 4. 全生态互通流转 (Cross-Environment Distribution)
**万物互连**：打破各平台与项目的生态孤岛。无论是系统级技能，还是某个项目专有的技能库，只要名字不冲突，均支持一键相互**复制、穿梭与分发**！
- 从 `.codex` 直接发送到 `.claude`
- 导入本地归档的宝藏技能直接复制到你的工作项目中
实现真正的“一处发现，处处可用”。

---

## 🗺️ 开发计划 (Roadmap & Future Plans)

我们正在持续进化，为了让 AI 技能管理更加智能和无感。即将推出的杀手级功能：

- [ ] **🔗 一键链接安装 (URL One-Click Install)**：仅需贴入 GitHub 或其他网址，系统自动解析仓库，并替你一键安装至指定的本地分类下，再也不需要繁琐的手动下载与解压！
- [ ] **🧠 强 AI 驱动技能检索 (AI-Powered Skill Discovery)**：提供原生的智能搜索框。只需输入自然语言（例如：“找一些制作 logo 的 skills”），内置 AI 大模型将替你搜罗全网、做严格的代码测评并推荐。看中后直接一键入库！ *(注：为保障隐私与灵活性，此功能所需的 AI 模型/API 密钥将支持由用户自行配置。)*
- [ ] **🏆 技能排行榜与趋势 (Skill Leaderboard & Trends)**：提供多维度的热门榜单（新星榜、飙升榜、不同主题分类等），随时为你推荐全网最新鲜、最好用的开源技能。

---

## 📥 下载安装 (Download & Install)

前往我们的 [Releases 页面](https://github.com/KlayPeter/control-yours-skills/releases/latest) 下载适用于你系统的最新安装包。

- **Windows**: `Control Your Skills-Setup-<version>.exe`
*(macOS 和 Linux 安装包即将到来！)*

---

## 🛠️ 本地开发 (Local Development)

`Control Your Skills` 基于极其现代和稳健的技术栈构建：**Electron**, **Next.js**, 和 **TypeScript**。

### 环境依赖
- 操作系统: Windows, macOS, 或 Linux
- Node.js: `v20+`
- npm: `v11+`

### 快速启动

1. **安装依赖**
   ```bash
   npm install
   ```

2. **运行开发环境**
   ```bash
   npm run dev
   ```
   *该命令将启动 Next.js 本地服务（`http://127.0.0.1:3211`），并自动启动 Electron 桌面窗口及热更新监听。*

### 构建与打包

如果你想在本地生成 Windows 安装包：
```bash
npm run build
npm run dist:win
```
生成的安装包将存放在 `release/` 目录下。

> **提示**: 对于公开发布版本，强烈建议使用仓库内配置好的 GitHub Actions 工作流（`.github/workflows/release.yml`），它能全自动、完美地处理依赖安装、编译及 NSIS 安装包的生成。

---

<div align="center">
  <i>Built with ❤️ for the AI Agent Ecosystem. Take Control of Your Skills.</i>
</div>
