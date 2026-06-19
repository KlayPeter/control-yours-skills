# Control Your Skills

Control Your Skills 是一个本地优先的桌面 Skill Manager MVP，用来统一导入、暂存、安装和浏览本地或远程的 Codex Skills。

## Current MVP

- Electron + Next.js 桌面工作台
- 本地 SQLite 数据层
- 本地 ZIP 导入与 `SKILL.md` 识别
- GitHub / 远程 ZIP 来源暂存
- 已安装 Skill 列表与 `SKILL.md` 详情浏览
- 设置页、日志页和基础验证链路

## Tech Stack

- Electron
- Next.js 15
- TypeScript
- Tailwind CSS
- better-sqlite3
- Vitest

## Requirements

- Node.js 24+
- npm 11+
- Windows PowerShell

## Install

```bash
npm install
```

如果系统盘空间很紧张，可以把 npm 缓存和临时目录切到项目盘再安装：

```powershell
$env:npm_config_cache='F:\personal\poject\control-your-skills\.npm-cache'
$env:TEMP='F:\personal\poject\control-your-skills\.tmp'
$env:TMP='F:\personal\poject\control-your-skills\.tmp'
npm install
```

## Run

开发模式：

```bash
npm run dev
```

这个命令会同时启动：

- Next.js 开发服务 `http://127.0.0.1:3000`
- Electron 主进程与 preload 构建监听
- Electron 桌面窗口

仅启动 Web 界面：

```bash
npm run dev:web
```

生产构建：

```bash
npm run build
```

仅启动构建后的 Web 服务：

```bash
npm run start:web
```

## Validation Commands

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
