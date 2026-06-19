# Control Your Skills

`Control Your Skills` 是一个本地优先的桌面端 Skill Manager，目标是把项目里的 skills、ZIP 导入来源、远程仓库来源和已安装 skills 统一放到一个工作台里管理。

当前项目已经提供一个可运行的 MVP，包含这些能力：

- Electron + Next.js 桌面工作台
- SQLite 本地数据存储
- 本地 ZIP 导入、解析 `SKILL.md`、进入 staging 后安装
- GitHub 仓库 / 远程 ZIP 先暂存再解析
- 扫描项目根目录下的 `.codex`、`.claude`、`.agent`、`.agents`
- 点击 provider 卡片查看该目录下面识别到的 skills
- 设置默认安装目录、临时目录、冲突策略
- 查看日志、安装记录、失败记录

## 环境要求

- Node.js 24+
- npm 11+
- Windows PowerShell

## 安装依赖

```bash
npm install
```

如果系统盘空间紧张，建议把 npm 缓存和临时目录切到项目盘：

```powershell
$env:npm_config_cache='F:\personal\poject\control-your-skills\.npm-cache'
$env:TEMP='F:\personal\poject\control-your-skills\.tmp'
$env:TMP='F:\personal\poject\control-your-skills\.tmp'
npm install
```

## 启动项目

开发模式：

```bash
npm run dev
```

这个命令会同时启动：

- Next.js 开发服务：`http://127.0.0.1:3211`
- Electron main / preload 构建监听
- Electron 桌面窗口

只启动前端开发服务：

```bash
npm run dev:web
```

生产构建：

```bash
npm run build
```

只启动构建后的前端服务：

```bash
npm run start:web
```

## 使用说明

1. 第一次启动后，先到 `Settings` 配置默认安装目录。
2. 如果 `tempDir` 留空，程序会使用应用内部的临时目录。
3. 在 `Import` 页面可以导入本地 ZIP，或者添加 GitHub / 远程 ZIP 来源。
4. 在 `Overview` 和 `Import` 页面可以点击 `Codex`、`Claude`、`Agent`、`Agents` 卡片，查看项目中现有的 skills。
5. 在 `Staging` 页面完成解析、安装、删除等操作。

## 校验命令

类型检查：

```bash
npm run typecheck
```

Lint：

```bash
npm run lint
```

完整检查：

```bash
npm run check
```

测试：

```bash
npm test
```
