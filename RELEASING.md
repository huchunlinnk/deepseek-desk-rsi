# 发布

首次公开发布前做一次下面这些。

## 1. Org

本仓库位于 `huchunlinnk`。如果你 fork 了它，把 `huchunlinnk` 换成你自己的用户/组织，改：

- `README.md`（安装命令）
- `profile/package.json`（`dsh-desk-rsi` 依赖）

## 2. 发布仓库

- 建 GitHub 仓库并推送。
- 加 topic `dsh`、`dsh-plugin`、`deepseek-harness`，便于社区索引。
- 在仓库 Settings → General 里启用 `.github/ISSUE_TEMPLATE/` 中的 issue 模板。

## 3. Secrets（绝不提交）

GitHub → Settings → Secrets and variables → Actions，加：

| 名称 | 用途 |
|---|---|
| `DEEPSEEK_API_KEY` | 运行 harness（对话 + 网页搜索） |

## 4. 验证

推送 → `ci.yml` 会跑 smoke + 端到端环路测试。测试绿了就打 `v0.1.0` 标签。
