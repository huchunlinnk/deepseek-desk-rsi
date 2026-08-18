# 安全策略

## 报告漏洞

**不要**为安全漏洞开公开 issue。请通过 GitHub 的「报告漏洞」流程（Security → Advisories → New draft advisory）或 README 中指定的私密渠道私下报告给维护者。

请附上：

- 受影响的组件和版本。
- 最小复现步骤或确切条件。
- 影响（攻击者能得到什么）。

## 安全模型

`deepseek-desk-rsi` 驱动一个 **DeepSeek Harness 智能体**，它能改文件、跑 shell 命令、开 pull request。要把运行中的环当作一个拥有 shell 权限的本地用户。应保持的关键属性：

1. **绝不提交密钥。** API key 和 token 属于环境变量、GitHub Actions secrets 或 DSH 凭据库——绝不在源码、`cordis.patch.yml`、`parity.json` 或日志里。
2. **PR 是闸门。** 环只提议 PR、从不合并。用分支保护确保任何凭据都无法给环合并权限。
3. **信任你的上游。** `rsi_perceive` 对比、`integrate` 应用上游 `deepseek-harness` 的变更，这些会到达真实运行时。把上游 remote 钉到你信任的 commit，并在合并前 review 环开的每一个 PR。
4. **有界递归。** 环纪律（`prompt.js`）限制修复次数、改动前先 checkpoint，所以一次跑偏的同步会回滚而不是累积破坏。

## 本项目的报告方式

安全相关改动和代码走同一条路：开 PR、注明安全理由、合并前 review。不要把漏洞细节写进 PR 描述；留在私密 advisory 里。
