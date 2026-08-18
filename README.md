# deepseek-desk-rsi

[English](./README.en.md) | 中文

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

一个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）插件，让*下游*应用与高速演进的*上游* harness 保持同步——工人就是 DSH 自己。

**AI for AI：DSH 维护 DSH。**

## 为什么做这个

DeepSeek Harness 目前是 `0.1.x-rc`，频繁出破坏性变更。一个锁死版本的桌面壳（或任何下游应用）几天就会腐坏。手工追上游是一份全职工作。这个 bundle 把这份工作交给 agent——并且给它**硬的、可自动化的成功信号**，让这个环不会跑偏。

## 为什么 —— 最大的优势

1. **真正的 AI for AI。** 工人就是 DeepSeek Harness 自己：它对比上游 diff、改集成胶水、构建、测试、回滚、开 PR——除了最后 merge 那一下，全程无人。
2. **"一模一样"是机器校验的，不是口头承诺。** `rsi_parity` 强制一个 128 插件契约（`parity.json`，从官方 `dsh-base` + `dsh-web-app` 两个 bundle 生成）。上游任何增删改名都会变成硬失败——精确名字匹配，不是子串。
3. **不会失控的进化。** 有界修复（最多 3 轮）、Memento 检查点（`rsi_checkpoint` / `rsi_rollback`）、PR 闸门——环只提议，人来 merge。
4. **零构建即装。** 纯 ESM + JSDoc，无 `prepare` 脚本：`dsh plugin add github:huchunlinnk/deepseek-desk-rsi#main` 直接可用。

## 环路

```
perceive  →  integrate  →  verify  →  parity  →  repair（有界）→  propose
```

| 阶段 | 谁 | 怎么做 |
|---|---|---|
| perceive | 工具 `rsi_perceive` | fetch 上游，对比上次同步以来的 commit log + stat |
| integrate | agent（现有工具） | 用 `bash` / `edit` / `subagent` / `workflow` 把相关 harness 变更应用进应用的胶水 |
| verify | 工具 `rsi_verify` | **硬适应度函数**：`cargo build && cargo test && bash scripts/smoke-web.sh`，退出码 0 才算过 |
| parity | 工具 `rsi_parity` | **同面门**：`parity.json` 里的每个必需插件都还在 |
| repair | agent + `rsi_checkpoint` / `rsi_rollback` | 改动前先 checkpoint（Memento），verify/parity 失败后回滚重试 |
| propose | 工具 `rsi_propose` | commit、推分支、用 `gh` 开 PR——人审闸门 |

环路纪律由一个 bundle 注入的 system-prompt 段（`rsi:loop`）强制执行，agent 无法偷偷跳过某个阶段。

## 工具

| 工具 | 作用 | 设计模式 |
|---|---|---|
| `rsi_perceive` | 对比上游相对某个 base ref 的差异 | — |
| `rsi_checkpoint` | 提交一个带标签的快照 | Memento（捕获） |
| `rsi_rollback` | `git reset --hard` 回到某个检查点 | Memento（恢复） |
| `rsi_verify` | 跑构建/测试/服务冒烟适应度命令 | — |
| `rsi_parity` | 用 `--dump-config` 精确匹配校验 `parity.json` | — |
| `rsi_propose` | 用 `gh` 开 PR | Command（人审闸门） |

五个阶段是一条 **Pipeline**；整个环是**有界递归**（最多 3 轮修复）。

## 安装

```sh
dsh plugin --profile rsi add github:huchunlinnk/deepseek-desk-rsi#main
dsh --profile rsi "Run the daily upstream sync: perceive, integrate, verify, parity, repair if needed, then propose a PR."
```

`profile/` 目录是一个起始无头 profile（`dsh-base` + `dsh-headless` + `dsh-desk-rsi`）。把它复制进 `$DSH_HOME/profiles/rsi` 并指向你的仓库。

## 对等契约

`parity.json` 列出了官方 `dsh-base` + `dsh-web-app` 两个 bundle 里的全部插件（128 个）加上宿主端点。同步后少了任何一个名字，`rsi_parity` 就会失败。上游增删改名插件后，从官方 bundle 重新生成：

```sh
node scripts/gen-parity.mjs /path/to/deepseek-harness
```

## 设计原则

- **第一性原则** —— 复用 harness（`@deepseek-ai/dsh-tools`、`@deepseek-ai/cordis` 是 DSH 提供的 peer 依赖）；绝不重写 bash、git 或子代理。
- **奥卡姆剃刀** —— 纯 ESM JavaScript，零构建、零 `prepare`；git 安装开箱即用。
- **设计模式** —— Pipeline（阶段）、Memento（检查点/回滚）、Command（PR 闸门）、Strategy（桌面端的更新策略）、有界递归。

## 仓库结构

```
index.js           单入口；注册 6 个工具 + 环路 prompt
prompt.js          rsi:loop system-prompt 段（纪律）
tools/             一个文件一个工具
lib/exec.js        有界 shell 执行器
scripts/           smoke.js、e2e-loop.mjs、gen-parity.mjs
profile/           起始无头 profile
parity.json        128 插件契约
```

## 测试

```sh
npm install --no-save --no-package-lock @deepseek-ai/dsh-tools   # 预构建的注册表 + cordis peer
npm test   # smoke（注册 6 工具 + prompt）+ e2e（真实 git 跑 perceive→checkpoint→rollback→verify→parity）
```

若要对着本地已构建的 harness checkout 开发，可以改为把它的包 symlink 进 `node_modules/@deepseek-ai/`。

## 安全

一个正在运行的环就是拥有 shell 权限的本地用户。密钥绝不进源码；PR 是闸门；把 upstream 钉到你信任的 commit。见 [`SECURITY.md`](./SECURITY.md)。

## 许可证

[MIT](./LICENSE)
