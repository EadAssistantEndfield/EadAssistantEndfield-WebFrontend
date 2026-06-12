# Blueprint Analysis

这个目录是独立的 `Vite 8 + Vite+ + Vue 3 + TypeScript` 蓝图分析前端。

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

- `npm run dev`：通过本地 `vite-plus` 启动 Vite dev server
- `npm run build`：先执行 `vue-tsc` 类型检查，再通过 `vite-plus` 构建
- `npm run preview`：通过 `vite-plus` 预览 `dist`

## 工具链

- Node：`^20.19.0 || >=22.12.0`，CI 使用 Node 24
- 包管理器：npm，项目固定 `npm@11.16.0`
- 构建：Vite 8 + Vite+
- Lint：Oxlint
- 样式检查：Stylelint
- 格式化：Prettier
- 测试：Vitest + V8 coverage

## 项目结构

源码采用 `app + features + shared` 的组织方向，目前核心业务集中在 `features/blueprint`：

```text
src/
  app/                         # 应用入口、根组件和全局样式
  features/
    blueprint/
      components/              # 蓝图 UI 组件
      components/layout/       # 平面布局视图的局部组件
      components/overview/     # 概览侧栏的局部组件
      composables/             # 蓝图相关 Vue 状态和交互逻辑
      domain/                  # 蓝图解析、布局、路径和模板规则
      domain/catalog/          # GameKee 建筑目录和本地图片映射
      domain/layout/           # 布局盒、主题和显示边界
      domain/parser/           # JSON 解析、节点归一化和 summary 构建
      domain/path/             # 传送带/管道路径几何和贴边规则
      domain/template/         # 模板别名、连接点和占地规则
      i18n/                    # 蓝图 UI、物品、建筑翻译
      services/                # 分享码查询等外部服务封装
      index.ts                 # app 层使用的 feature 公共出口
      types.ts                 # 蓝图领域类型
```

测试目录按同样的 feature 边界组织：

```text
tests/
  features/
    blueprint/
      composables/
      domain/
        parser/
        path/
        template/
      services/
```

约定：

- 组件只负责展示和少量组件内交互。
- composable 负责响应式状态、生命周期、副作用编排。
- domain 保持纯函数优先，放解析、几何、路径、模板等可测试逻辑。
- services 负责浏览器存储、API URL、请求数据等外部边界。
- `data/gamekee_buildings/` 是前端运行时使用的建筑目录；`data/fixtures/` 放本地样例；`data/templates/` 放模板参考资产。

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
npm run lint
npm run lint:style
npm run check:i18n
npm run test
npm run test:run
npm run test:coverage
npm run build
```

- `npm run test`：本地 watch 模式开发测试
- `npm run test:run`：执行一次单元测试
- `npm run test:coverage`：生成覆盖率报告，输出到 `coverage/`
- `npm run test:ci`：按 CI 顺序执行 `lint`、`stylelint`、`i18n 检查`、`覆盖率测试` 和 `build`

## 数据脚本

GameKee 建筑数据抓取脚本位于：

```bash
python scripts/data/fetch_gamekee_data.py
```

脚本依赖 `requests`、`playwright` 和 `Pillow`。抓取到的设备图片会统一转换为 WebP，并输出到 `data/gamekee_buildings/images/`，供前端建筑目录和本地图片解析使用。

本地样例蓝图位于 `data/fixtures/blueprints/`，模板参考文件位于 `data/templates/blueprint-layouts/`。

## CI

仓库提供 GitHub Actions 工作流 [`test.yml`](./.github/workflows/test.yml)，会在 `push` 到 `main` 以及所有 `pull_request` 时自动执行：

- `npm ci`
- `npm run lint`
- `npm run lint:style`
- `npm run check:i18n`
- `npm run test:coverage`
- `npm run build`

## 版本号

仓库提供 [`version.yml`](./.github/workflows/version.yml)，用于自动更新版本号、`CHANGELOG.md` 和 [`public/version.json`](./public/version.json)。

- `workflow_dispatch` 可手动触发
- `push` 到 `main` 时会自动触发
- bot 提交会被跳过，避免循环 bump
- 不包含 `npm publish`、npm registry token、dist-tag 或 GitHub Packages 发布逻辑
