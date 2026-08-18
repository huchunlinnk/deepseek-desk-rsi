# 贡献指南

感谢你为 RSI 引擎出力。这是一个 DeepSeek Harness（DSH）插件，它驱动的环路是 **AI for AI —— DSH 维护 DSH**。

## 开发

```sh
# 1. 克隆并安装预构建的工具注册表（用于跑测试）
git clone https://github.com/huchunlinnk/deepseek-desk-rsi.git
npm install --no-save --no-package-lock @deepseek-ai/dsh-tools

# 2. 测试
npm test                 # smoke（注册 6 工具 + prompt）+ e2e（真实 git 环路）

# 3. 上游 harness 变更后，重新生成对等契约
node scripts/gen-parity.mjs /path/to/deepseek-harness
```

若要对着本地已构建的 harness checkout 开发，可改为把它的包 symlink 进 `node_modules/@deepseek-ai/`。

## 约定

- **纯 ESM JavaScript + JSDoc。** 无构建步骤，git 安装开箱即用。
- **一个工具一个文件**，放在 `tools/` 下；编排只在 `index.js`；纪律在 `prompt.js`。
- **密钥绝不进源码。** 用环境变量 / GitHub secrets / DSH 凭据库。
- **测试描述行为。** 开 PR 前跑 `npm test`；新增工具要配测试。

## 提交

1. 比 bug 修复更大的改动，先开 issue。
2. 开分支、改、测。
3. 开 PR；保持小而单一关注点。
4. 给仓库打 `dsh` 和 `dsh-plugin` topic，便于社区索引。
