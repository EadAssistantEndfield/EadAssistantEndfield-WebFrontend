# Blueprint Analysis

这个目录是独立的 `Vite + Vue 3 + TypeScript` 蓝图分析前端。

## 启动

```bash
cd blueprint_analysis
npm install
npm run dev
```

默认开发地址：

```text
http://127.0.0.1:4173
```

## 功能

- 拖拽或上传本地蓝图 `json`
- 直接粘贴 JSON 并重新解析
- 渲染蓝图概览、建筑统计、平面布局、节点清单
- 使用 Vue 3 Composition API + `<script setup>`

## 构建

```bash
npm run build
npm run preview
```

## 测试

```bash
npm run test
npm run test:run
npm run test:coverage
```

- `npm run test`：本地 watch 模式开发测试
- `npm run test:run`：执行一次单元测试
- `npm run test:coverage`：生成覆盖率报告，输出到 `coverage/`
- `npm run test:ci`：按 CI 顺序执行 `lint`、`i18n 检查`、`覆盖率测试` 和 `build`

## CI

仓库新增了 GitHub Actions 工作流 [`test.yml`](./.github/workflows/test.yml)，会在 `push` 到 `main/master` 以及所有 `pull_request` 时自动执行：

- `npm ci`
- `npm run lint`
- `npm run check:i18n`
- `npm run test:coverage`
- `npm run build`

同时还提供了独立的 Qodana 工作流 [`qodana.yml`](./.github/workflows/qodana.yml)：

- `pull_request` 走 `pr-mode`，优先聚焦本次改动
- `push` 到 `main/master` 时执行完整扫描
- 会上传 Qodana 分析结果 artifact，避免把静态分析和普通测试绑在同一个 job

如果仓库启用了 Qodana Cloud 或当前镜像需要鉴权，请在 GitHub Actions Secrets 中配置 `QODANA_TOKEN`。

测试工作流也已接入 Codecov：

- `npm run test:coverage` 会额外生成 `coverage/lcov.info`
- GitHub Actions 会在存在 `CODECOV_TOKEN` 时自动上传覆盖率到 Codecov
- 仓库根目录的 [`codecov.yml`](./codecov.yml) 定义了 project/patch 状态检查和 `frontend` flag

如果要启用上传，请在 GitHub Actions Secrets 中配置 `CODECOV_TOKEN`。
