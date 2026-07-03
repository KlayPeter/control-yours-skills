# 🤝 参与贡献 (Contributing)

感谢你对 **Control Your Skills** 产生兴趣并愿意参与贡献！正是因为有你的帮助，这个工具才会变得越来越好。

在提交代码或提出 Issue 之前，请花几分钟阅读以下指南。

## 🐛 报告 Bug 或 💡 提出新功能

如果你发现了 Bug，或者有好的点子想要添加新功能，请通过 [GitHub Issues](https://github.com/KlayPeter/control-yours-skills/issues) 提交。

在提交 Issue 时，请尽量提供：
- 问题的清晰描述或新功能的期望目标。
- 复现步骤（如果是 Bug）。
- 你的操作系统版本及应用版本。
- 相关的截图或录屏（非常有助于定位问题）。

## 🛠️ 本地开发指南

如果你想亲自修复 Bug 或开发新功能，欢迎提交 Pull Request (PR)！

### 1. 准备环境

确保你的本地开发环境已经安装了以下工具：
- **Node.js** (建议 v20 或以上版本)
- **pnpm** (推荐的包管理器)

### 2. 克隆项目与安装依赖

```bash
# 克隆仓库
git clone https://github.com/KlayPeter/control-yours-skills.git

# 进入目录
cd control-yours-skills

# 安装依赖包
pnpm install
```

### 3. 本地启动运行

项目是一个结合了 Next.js 前端和 Electron 后端的桌面应用。你可以通过以下命令在本地启动开发环境：

```bash
# 启动本地热更新开发服务
pnpm run dev
```

该命令会同时启动 Next.js 服务器，并弹出一个加载了开发页面的 Electron 桌面窗口。

### 4. 代码构建与打包

如果你想验证构建是否成功，或在本地打包安装程序：

```bash
# 验证代码并执行构建
pnpm run build

# 打包为当前系统的可执行文件 (如 Mac 的 .dmg 或 Windows 的 .exe)
pnpm run dist
```
生成的安装包将存放在 `release/` 目录下。

## 📝 提交 Pull Request (PR)

1. 在你的 GitHub 账号下 **Fork** 本仓库。
2. 从 `main` 分支拉出一个属于你的新分支：
   ```bash
   git checkout -b feature/my-awesome-feature
   # 或者如果是修复 bug:
   git checkout -b fix/issue-123
   ```
3. 进行代码修改，并确保符合项目的代码风格。
4. 运行 `pnpm run check` 确保没有类型错误，并运行 `pnpm run lint` 确保符合规范。
5. 提交你的修改并推送到你自己的远端仓库：
   ```bash
   git commit -m "feat: 增加了炫酷的新功能"
   git push origin feature/my-awesome-feature
   ```
6. 回到 GitHub 页面，向原仓库的 `main` 分支发起 Pull Request。

## 📜 代码规范

- 本项目使用 **TypeScript** 编写。请尽量补充必要的类型定义，避免使用 `any`。
- 前端框架为 **Next.js (App Router)** + **React**，使用 **Tailwind CSS** 进行样式管理。
- 提交信息请尽量遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/) 规范，例如 `feat: xxx`, `fix: xxx`, `docs: xxx`, `chore: xxx` 等。

## 🙏 再次感谢

每一行代码、每一个反馈对我来说都无比珍贵。感谢你让 Control Your Skills 变得更棒！
