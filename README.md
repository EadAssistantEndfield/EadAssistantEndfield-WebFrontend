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

## 环境变量

项目根目录提供了 [`.env.example`](./.env.example)。

- `VITE_API_BASE_URL`
  - 默认留空，前端会请求同域 `/api/...`
  - 推荐部署方式也是保留为空，再由部署平台把 `/api` 反向代理到后端
  - 只有后端已经正确开启浏览器 CORS 时，才应该改成完整后端地址
- `VITE_PUBLIC_BASE_PATH`
  - 默认是 `/`
  - 如果站点部署在子路径，例如 `https://example.com/blueprint_analysis/`，设为 `/blueprint_analysis/`

## 部署

推荐使用“同域静态站点 + `/api` 反向代理”：

1. 前端静态资源直接部署 `dist/`
2. 浏览器继续请求同域 `/api/...`
3. 由 Nginx、Vercel 或其他网关把 `/api` 转发到 `https://beta-api.ead.jamyido.cn`

### Vercel

仓库里的 [`vercel.json`](./vercel.json) 已经包含：

- `npm run build`
- `dist` 作为输出目录
- `/api/:path* -> https://beta-api.ead.jamyido.cn/api/:path*` 的 rewrite

这意味着 Vercel 根路径部署时，`VITE_API_BASE_URL` 可以保持为空，避免浏览器直接跨域访问后端。

### 子路径部署

如果不是部署在站点根路径，而是类似：

```text
https://example.com/blueprint_analysis/
```

请在构建前设置：

```bash
VITE_PUBLIC_BASE_PATH=/blueprint_analysis/
```

这样 Vite 会把产物里的资源路径改写到正确的子路径下。

### 非 Vercel 部署

如果你自己配 Nginx、Caddy 或其他反向代理，至少要满足两件事：

1. 静态资源从 `VITE_PUBLIC_BASE_PATH` 对应的路径提供
2. 同域 `/api/` 请求被反向代理到 `https://beta-api.ead.jamyido.cn/api/`

如果部署方案必须让浏览器直接访问后端域名，请先确认后端已经允许对应前端域名的 CORS 预检请求，否则分享码查询仍然会失败。

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
