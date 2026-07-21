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
    <a href="./LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT" />
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
- **差异确认**：覆盖或采纳前展示新增、修改、删除和文本差异；执行时再次校验目录哈希。
- **安全快照**：覆盖前自动保存目标版本，记录同步方向、决策、哈希和执行结果。

### 🤖 3. 智能解析与多源导入 (Smart Ingestion)
- **GitHub 可信安装**：输入公开 GitHub 仓库地址后，系统下载 `HEAD.zip`、解析 `SKILL.md` 并展示文件差异；确认后才安装或更新，且不会执行仓库命令。
- **AI 赋能元数据提取**：配置 AI 模型后，系统会自动阅读仓库的 `README.md`，智能提取技能名称、描述及安装策略；无 AI 时也能平滑降级至规则引擎。
- **本地 ZIP / 文件夹**：支持拖拽导入本地现有的压缩包或目录。

### 🧭 4. 内容、版本与资产治理 (Lifecycle & Governance)
- **SKILL.md 编辑**：在中心仓库中编辑并预览 `SKILL.md`；保存前自动创建版本快照。
- **版本历史与回滚**：查看、置顶和恢复历史版本；回滚前仍会保存当前内容。
- **标签与批量治理**：按名称、描述、分类和标签搜索；批量修改分类、添加标签或移除标签。
- **可配置保留策略**：设置每个 Skill 的普通快照数量和全部快照的磁盘容量上限；置顶版本不会被自动清理。

### 💻 5. 现代桌面客户端 (Modern Desktop App)
打破传统 CLI 的晦涩操作，基于 **Electron + Next.js + TypeScript** 打造的高颜值、响应式桌面客户端。图表化概览、拖拽式交互、一键处理冲突，让极客的配置流转变成流畅的产品体验。

---

## ✅ V2 已交付

V2 围绕“安全同步、版本治理、资产治理、可信来源”完成四个阶段：

- [x] **V2.1 安全同步**：目录差异预览、人工确认、并发哈希校验、安全快照、同步审计。
- [x] **V2.2 生命周期**：`SKILL.md` 编辑与预览、版本历史、置顶、回滚、数量和容量策略。
- [x] **V2.3 资产治理**：标签持久化、描述和标签搜索、分类/标签筛选、批量治理。
- [x] **V2.4 可信 GitHub**：公开仓库安装与更新审查、执行前二次校验、更新前快照和回滚。

完整的交付边界、验证方式和后续路线见 [V2 交付与后续路线](./docs/v2-delivery-and-roadmap.md)。

## 🔐 GitHub 可信安装边界

可信安装只接受公开的 `https://github.com/owner/repo` 仓库，并遵守以下规则：

- 只下载 GitHub 公开归档，单次下载上限为 100 MB。
- 拒绝 HTTP、内嵌凭据、本机地址和私有网络目标。
- 只复制识别出的 Skill 文件，不执行仓库中的脚本或安装命令。
- 安装或更新前展示逐文件差异；确认后再次校验远端和本地目录哈希。
- 更新已有 Skill 前创建安全快照，可在“内容与版本”中恢复。

## 🗺️ 后续路线 (V3+)

- [ ] **V3.0 发现与质量**：自然语言检索、来源信誉、兼容性检查、风险提示和质量评分。
- [ ] **V3.1 自动化策略**：可配置更新检查、通知、维护窗口和批量审查队列；默认仍需人工确认写入。
- [ ] **V3.2 可观测性**：操作时间线、快照容量统计、失败诊断导出和同步健康度。
- [ ] **V4.0 团队能力**：可选的团队 Registry、审批流程、角色权限和跨设备同步。

V3 不会默认执行第三方命令，也不会绕过 V2 建立的差异确认、快照和回滚链路。

---

## 📥 下载安装 (Download & Install)

前往项目的 [Releases 页面](https://github.com/KlayPeter/control-yours-skills/releases/latest) 下载适用于你系统的最新安装包。

- **Windows**: `Control Your Skills-Setup-<version>.exe`
- **macOS (Apple Silicon)**: `Control Your Skills-<version>-arm64.dmg`

> **⚠️ macOS 安装须知 (重要)**
> 由于本项目为免费开源工具，暂未进行 Apple 开发者签名。在 Mac 上首次安装打开时，系统可能会拦截并提示“应用已损坏，无法打开。你应该将它移到废纸篓”或“无法验证开发者”。
> **解决方法**：这属于 macOS 的 Gatekeeper 安全拦截机制，属于正常现象。请打开 Mac 的「终端 (Terminal)」应用，执行以下命令强制放行该应用：
> ```bash
> sudo xattr -cr "/Applications/Control Your Skills.app"
> ```
> 执行完毕后（期间可能需要输入开机密码），即可正常双击打开。

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

## 🤝 参与贡献 (Contributing)

发现 Bug？有很棒的新功能想法？欢迎提交 Issue 或 Pull Request！
在参与贡献之前，请务必阅读本项目的 [贡献指南 (CONTRIBUTING.md)](./CONTRIBUTING.md)。

---

## 📄 许可证 (License)

本项目采用 **MIT** 许可证开源。详情请参见 [LICENSE](./LICENSE) 文件。

---

<div align="center">
  <i>"开源是一场马拉松，AI 时代的探索更是如此。步履不停，构建不止。" 🏃‍♂️</i>
</div>
