# Vite 8 / Vite+ / OXC / 版本号更新计划

日期：2026-06-03

## 目标

- 将本项目从 Vite 6 升级到 Vite 8。
- 在本地开发命令中引入 Vite+，用更统一的 CLI 管理开发、构建、检查等流程。
- 用 OXC 工具链替代 ESLint，其中 lint 运行器使用 `oxlint`。
- 参考 `D:\Desktop\python\MusicWeb\qq-music-api` 的自动版本号更新系统，但不引入任何 npm 发布流程。
- 移除当前 Codecov 集成，同时保留本地覆盖率能力，方便后续继续查看测试覆盖情况。
- 让迁移一次性到达清晰终态，同时保持可回退、可验证。

## 非目标

- 不把本项目发布到 npm。
- 不复制 `qq-music-api` 的 workspace / MCP 包发布行为。
- 本次迁移不把格式化工具切到 `oxfmt`，保持 Prettier 作为唯一格式化入口。
- 不把这次工具链迁移和当前工作区已有的 GameKee 数据变更混在一起。
- 不在工具链迁移中顺手改变浏览器端 cookie/session 存储策略，除非单独做安全与体验评估。
- 分支策略明确收敛到 `main`。只有确认外部保护规则仍依赖 `master` 时，才临时保留 `master` 兼容。

## 最佳一次性改造推荐

如果目标是“一次性改造好”，推荐不要把 Vite 8、Vite+、Oxlint、版本系统、Codecov 移除拆成多轮长期试探，而是做成一个专门的工具链改造分支，最后一次性合入。

推荐终态：

- **运行环境**：统一 Node 24，`packageManager` 固定为 `npm@11.16.0`。
- **构建工具**：升级到 Vite 8，并让 `dev`、`build`、`preview` 都通过本地 `vite-plus` 的 `vp` 入口执行。
- **配置组织**：拆分 `vite.config.ts` 和 `vitest.config.ts`，避免 Vite+ / Vite / Vitest 类型和职责混在一个文件里。
- **Lint**：用 `oxlint` 替换 ESLint，删除 ESLint 依赖与 `eslint.config.js`；保留 `stylelint`、`prettier`、`vue-tsc`。
- **格式化**：继续用 Prettier，不引入 `oxfmt`，避免一次迁移同时改变格式化结果。
- **OXC Transform**：不新增自定义 `oxc-transform` 插件。Vite 8 已内置 OXC 流水线，本项目是 Vue 单页应用，没有必要额外加一层 transform。
- **版本系统**：参考 `qq-music-api` 的脚本结构，新增自动版本号、CHANGELOG 和 `public/version.json`，但删除所有 npm publish / registry / dist-tag / workspace 同步逻辑。
- **版本触发**：启用 `workflow_dispatch` 和 `push main` 自动 bump，但必须加 bot 防循环和 paths 过滤，避免文档、测试、版本提交自己反复触发。
- **Codecov**：彻底移除 GitHub Actions 上传和 `codecov.yml`，但保留 `npm run test:coverage` 作为本地和 CI 覆盖率报告。
- **Qodana**：删除 Qodana 工作流和配置，静态检查收敛到 Oxlint、Stylelint、vue-tsc 和测试。
- **部署**：Vercel 继续使用 `npm run build`，因为 `build` 最终会走 `vue-tsc -b && npm run vp -- build`；同时确保 Vercel Node 版本满足 Vite 8/Vite+ 要求。
- **结构整理**：完成必要收口后，继续把蓝图业务迁入 `src/features/blueprint/`：入口放 `src/app/`，蓝图组件、composables、domain、i18n、services 和测试按 feature 边界组织。

这套方案的取舍是：工具链一次到位，业务结构只做最有收益的收口。这样迁移完成后项目会进入一个更现代、清晰的状态，但 diff 不会膨胀到难以 review。

### 推荐改造边界

一次性改造建议包含：

- 修复当前已知失败测试，让迁移基线变绿。
- 升级 Vite 8、Vite+、Vitest、Vue 插件、Vue TSC、TypeScript、Oxlint 和 Node 类型。
- 移除 ESLint 依赖、配置和 README 描述。
- 移除 Codecov workflow 步骤和 `codecov.yml`。
- 新增 `.oxlintrc.json`。
- 新增 `vitest.config.ts`，让 `vite.config.ts` 专注应用构建。
- 新增版本脚本和 `.github/workflows/version.yml`。
- 新增 `public/version.json` 生成流程。
- 更新 README 的启动、构建、测试、CI、版本号和部署说明。
- 移动 `fetch_gamekee_data.py` 到 `scripts/data/fetch_gamekee_data.py`，并更新引用文档。
- 将 `useBlueprintParser.ts` 中的 API/session/cookie/qrcode 副作用拆到 `useShareQuerySession.ts`，保持对外 composable API 不变。
- 将旧的 components / composables / utils / i18n / services 分层目录收口到 `src/features/blueprint/`，并同步迁移测试到 `tests/features/blueprint/`。

一次性改造不建议包含：

- 引入额外全局状态框架或路由系统。
- 引入 pnpm/yarn。
- 引入 oxfmt 替换 Prettier。
- 添加 Playwright E2E 依赖。
- 改变 Vercel rewrite 后端地址。
- 改变分享码查询 cookie 名称、有效期或存储策略。

### 推荐提交切分

虽然可以一次性完成，但最好拆成 5 个提交，方便 review 和回滚：

1. `test: stabilize current blueprint summary baseline`
2. `chore(tooling): migrate to vite 8 vite-plus and oxlint`
3. `ci: remove codecov and align node workflows`
4. `chore(release): add automatic version metadata workflow`
5. `refactor(structure): organize data script and parser services`

这 5 个提交可以在同一个 PR 中完成。这样满足“一次性改造好”，又不会把所有风险糊成一个无法拆解的大提交。

### 最佳终态文件变化

推荐最终会新增或调整这些文件：

```text
.github/workflows/test.yml          # Node 24、无 Codecov、继续 lint/style/test/build
.github/workflows/version.yml       # 自动版本号、CHANGELOG、version.json，不发布 npm
.oxlintrc.json                      # Oxlint 配置
package.json                        # Vite 8 / Vite+ / Oxlint / scripts / engines / packageManager
package-lock.json                   # npm lockfile
vite.config.ts                      # 只保留应用 Vite 配置
vitest.config.ts                    # 测试与 coverage 配置
tsconfig.node.json                  # include vite/vitest config
README.md                           # 工具链、CI、版本、部署说明
public/version.json                 # 版本脚本生成
scripts/data/fetch_gamekee_data.py  # 从根目录迁入
scripts/release/compute-release-version.mjs
scripts/release/bump-version.js
scripts/release/generate-changelog.js
scripts/release/generate-version.js
src/app/                            # 应用入口、根组件、全局样式
src/features/blueprint/             # 蓝图 feature：组件、composables、domain、i18n、services、types
tests/features/blueprint/           # 按 feature 镜像的单元测试
```

应删除：

```text
codecov.yml
eslint.config.js
fetch_gamekee_data.py               # 根目录旧位置
```

## 当前项目基线

- 当前技术栈：Vue 3、Vite 6、Vitest 4、TypeScript、ESLint、Stylelint、Prettier。
- 当前脚本：
  - `dev`：`vite`
  - `build`：`vue-tsc -b && vite build`
  - `lint`：`eslint .`
  - `test:coverage`：`vitest run --coverage`
  - `test:ci`：`npm run lint && npm run check:i18n && npm run test:coverage && npm run build`
- 当前 CI 会在 `.github/workflows/test.yml` 中上传覆盖率到 Codecov。
- 当前 Codecov 配置文件是 `codecov.yml`。
- 当前 GitHub Actions 的 Test workflow 曾监听 `main` 和 `master`，但本地/远端分支主线显示为 `main`。本次推荐把 workflow 收敛到 `main`，如外部保护规则仍依赖 `master`，先迁移保护规则。
- 当前 `vercel.json` 明确使用 `npm run build` 和 `dist` 输出，并把 `/api/:path*` rewrite 到 `https://beta-api.ead.jamyido.cn/api/:path*`。
- 当前 `qodana.yaml` 和 `.github/workflows/qodana.yml` 已纳入移除范围，避免保留第二套静态分析配置。
- 写计划前的本地验证结果：
  - `npm run lint`：通过
  - `npm run lint:style`：通过
  - `npm run check:i18n`：通过
  - `npm run build`：通过
  - `npm run test:run`：迁移前曾失败，原因是旧的 `blueprintSummaryBuilder.test.ts` 仍期待预览图片 URL 包含 `990125`，但应用已经解析本地 GameKee 图片资源；当前测试已按新结构迁移并通过。

## 外部版本目标

2026-06-03 通过 `npm view` 验证：

| 包 | 目标版本 |
|---|---:|
| `vite` | `^8.0.16` |
| `vite-plus` | `0.1.23`，`0.1.24` 目前要求未发布的 `@vitest/coverage-v8@4.1.8` |
| `@vitejs/plugin-vue` | `^6.0.7` |
| `oxlint` | `^1.68.0` |
| `vitest` | `^4.1.7` |
| `@vitest/coverage-v8` | `^4.1.7` |
| `vue-tsc` | `^3.3.3` |
| `typescript` | `6.0.3` |
| `@types/node` | `^25.9.1` |
| `npm` | `11.16.0` |
| `oxc-transform` | 本次不引入 |

Vite 8、Vite+ 和当前 Oxlint 都要求 Node `^20.19.0 || >=22.12.0`。CI 应从泛化的 Node 22 调整到明确兼容的版本；如果参考两个外部项目，优先使用 Node 24。

## 实施补充记录

2026-06-04 实际落地时补充以下兼容性结论：

- `vite-plus@0.1.23` 可用，`vite-plus@0.1.24` 暂不采用，因为它要求尚未发布的 `@vitest/coverage-v8@4.1.8`。
- `vite.config.ts` 中使用 `vite-plus` 的 `defineConfig` 时，`ConfigEnv`、`UserConfig`、`PluginOption` 也应从 `vite-plus` 导入。混用普通 `vite` 的 `UserConfig` 会在 TypeScript 6 下触发过深类型比较。
- `@vitejs/plugin-vue` 的插件类型和 Vite+ core 类型存在当前版本口径差异，需要把 `vue()` 收窄为 `vite-plus` 的 `PluginOption`，否则类型检查可能失败。
- TypeScript 6 会把 `baseUrl` 弃用提示提升为错误。本项目只需要 `paths` 映射，可以移除 `tsconfig.app.json` 的 `baseUrl`，不建议用 `ignoreDeprecations` 掩盖。
- `npm run vp:version` 能正常启动 Vite+，但当前 Vite+ 的工具探测输出可能显示部分本地工具为 `Not found`。应以 `npm ls vite vite-plus @voidzero-dev/vite-plus-core` 和 `npm run build` 作为最终确认。
- `scripts/release/generate-changelog.js` 应使用 `execFileSync('git', args)` 形式调用 git，避免把 tag/range 拼进 shell 字符串。

## 文档调研结论

- Vite 8 是官方 Rolldown 版本线。旧的 `rolldown-vite` 迁移包路径应替换为正式的 `vite: ^8.0.0`。
- Vite 8 核心流水线已经包含 Rolldown 和 OXC，并对许多既有 Rollup / esbuild 配置提供兼容转换。
- Vite 内部已经有 OXC transform 支持；本项目最佳方案是不额外添加自定义 `oxc-transform` 插件。
- Vite+ 提供 `vp dev`、`vp build`、`vp lint`、`vp fmt`、`vp check` 和 staged/check 工作流，统一封装 Vite、Vitest、Oxlint、Oxfmt 和任务运行能力。

## 参考项目：`luo_music_new`

路径：`D:\Desktop\python\MusicWeb\luo_music_new`

值得借鉴的模式：

- 添加本地 Vite+ 包装脚本：
  - `vp`：`node ./node_modules/vite-plus/bin/vp`
  - `vp:version`：`npm run vp -- --version`
  - `vp:help`：`npm run vp -- help`
- 开发和预览命令优先通过 Vite+ 执行，避免依赖全局 CLI。
- 类型检查和 lint 保持分离：
  - `typecheck`：`vue-tsc --noEmit ...`
  - `lint`：架构检查加 `vp lint` 或 `oxlint`
- 当测试面变复杂时，保留显式 Vitest 配置，不把所有测试行为都藏在通用 Vite 配置里。
- npm scripts 变长时，把项目特定构建逻辑下沉到小脚本中维护。

当前项目暂时不需要借鉴的部分：

- Electron 专用 Vite 配置拆分。
- 原生模块 rebuild helper。
- 多运行时 `APP_RUNTIME` 处理。
- Electron 打包脚本。

## 参考项目：`qq-music-api`

路径：`D:\Desktop\python\MusicWeb\qq-music-api`

值得借鉴的模式：

- 用 `oxlint` 替换 ESLint。
- 添加 `.oxlintrc.json`，明确忽略目录和少量项目规则。
- 提交前检查可以暂不引入 `lint-staged`，避免本次改造额外改变 Git hook 体验；若以后需要，再用 `lint-staged` 搭配 `oxlint --fix`。
- 借鉴简单的版本计算和 bump 流程，落地到本项目的 `scripts/release/` 目录。
- 根据 conventional commit 历史生成 `CHANGELOG.md`。
- 生成项目本地 `public/version.json`，用于部署排障和版本查看。
- 添加 `.github/workflows/version.yml`，在 `main` 上自动 bump 版本，并用 `[skip ci]` 把生成的版本元数据提交回仓库。

必须移除或避免复制的部分：

- `publishConfig`
- `.github/workflows/package.yml`
- 所有 `npm publish` 步骤
- npm dist-tag 逻辑
- 基于 npm registry 状态计算 beta/stable channel 的逻辑
- MCP workspace 版本同步
- GitHub Packages / npm provenance 设置

## 两个参考项目的结构分析

### 当前项目结构判断

当前 `blueprint_analysis` 仍是一个较轻量的单页 Vue 工具，但源码已按 feature 边界收口：

- `src/app/`：应用入口、根组件和全局样式
- `src/features/blueprint/components/`：蓝图界面组件
- `src/features/blueprint/composables/`：布局、路径、解析、i18n、分享码会话等组合式逻辑
- `src/features/blueprint/domain/`：蓝图领域逻辑，已按 `parser/`、`layout/`、`path/`、`template/`、`catalog/` 分层
- `src/features/blueprint/i18n/`：界面、物品、组件类型与建筑文案，已拆分为独立消息表
- `src/features/blueprint/services/`：Supabase 缓存、分享码查询、session、passport、二维码等外部边界
- `tests/features/blueprint/`：按 feature 镜像的单元测试
- `data/gamekee_buildings/`：前端运行时使用的 GameKee 建筑数据
- `data/fixtures/`：本地样例蓝图
- `data/templates/`：模板参考资产
- `scripts/`：i18n 检查、数据抓取、版本号脚本
- `docs/plans/`：迁移计划文档

本轮结构收口后，主要压力点已经从“大目录混杂”变为“少数复杂领域文件继续拆小”：

- `src/features/blueprint/domain/parser/blueprintDomain.ts` 仍承载较多传送带方向推断逻辑，后续可在有回归用例保护时继续拆成方向优化、布局归一化、节点映射三个文件。
- `src/features/blueprint/services/shareQuery/sessionLifecycle.ts` 已承接 session、passport、query 请求编排，后续如果继续膨胀，可再拆 `sessionRequest.ts` 和 `passportSync.ts`。
- `BlueprintLayout.vue` 已抽出 toolbar 和 viewport composable，但 SVG 图层仍可继续拆成 grid/building/path layer。

### 从 `luo_music_new` 可参考的结构

`luo_music_new` 是大型 Vue/Electron 应用，它的完整复杂度不适合照搬，但有几个结构习惯值得参考：

- **配置分层**：`.config/` 放 Vite、Vitest、Playwright 这类工具配置，`config/` 放共享配置 helper。本项目不需要照搬完整 `.config/` 目录，但本次应至少拆出 `vitest.config.ts`，让 Vite 和 Vitest 职责分离。
- **脚本分组**：`scripts/build/`、`scripts/dev/`、`scripts/runtime/`、`scripts/utils/` 并配 `scripts/README.md`。本项目本次采用轻量版：数据抓取脚本放 `scripts/data/`，版本脚本放 `scripts/release/`。
- **feature 收口**：`src/features/<domain>/components|composables` 用于收纳成规模业务域。本项目已采用 `src/features/blueprint/`，后续新增蓝图能力应继续在该 feature 内落位。
- **结构计划文档**：`docs/plans/` 下沉淀迁移路线和归属审计。本项目已经开始采用这个模式，应继续把工具链、数据抓取、结构收口计划写进 `docs/plans/`。
- **边界脚本**：大型项目用脚本检查架构边界。本项目暂时不需要复杂边界检查，但可以在领域目录成形后添加轻量检查，防止 UI 层反向污染纯解析逻辑。

不建议照搬：

- Electron / native / packages/shared 的运行时隔离。
- 复杂 build target 调度。
- 插件系统和桌面端 packaging 目录。

### 从 `qq-music-api` 可参考的结构

`qq-music-api` 是服务端/API 项目，不适合直接搬 controller/service/route 到前端，但它的分层原则很有价值：

- **Side effect 和纯逻辑分离**：`services/` 处理上游请求，`controllers/` 处理 HTTP 表面。本项目已借鉴为：纯蓝图解析放 `src/features/blueprint/domain/`，分享码查询、session、cookie、二维码生成放 `src/features/blueprint/services/` 与 `useShareQuerySession.ts`。
- **文档化项目入口**：`AGENTS.md` 和 `docs/agent-instructions/*` 把入口、命令、分层规则写清楚。本项目后续可新增轻量 `docs/architecture.md` 或 `docs/project-structure.md`，说明 `data/`、`src/features/`、`src/domain/`、`scripts/` 的职责。
- **测试按层镜像**：`tests/unit/`、`tests/integration/`、`tests/unit/services/` 等按职责组织。本项目已改成 `tests/features/blueprint/`，与源码 feature 边界对应。
- **版本和 changelog 脚本独立**：版本计算、changelog、version metadata 都在 `scripts/` 下独立维护。本项目可直接借鉴，但去掉所有 npm publish 相关内容。

不建议照搬：

- Koa API 的 `controllers/routes/middlewares` 运行时结构。
- workspace MCP 包结构。
- 发布工作流和 npm registry 读取逻辑。
- 大量 API 文档页组织方式。

### 建议的本项目目标结构

工具链迁移完成后，可以按低风险顺序逐步收口为：

```text
blueprint_analysis/
  data/
    gamekee_buildings/
    fixtures/
      blueprints/
    templates/
      blueprint-layouts/
  docs/
    plans/
    architecture.md              # 结构说明，可在本次 README 更新后补充
  scripts/
    check-i18n.mjs
    data/
      fetch_gamekee_data.py      # 从根目录迁入
    release/
      bump-version.js
      compute-release-version.mjs
      generate-changelog.js
      generate-version.js
  src/
    app/                         # 应用启动、全局状态编排，暂不强制新建
    components/                  # 真正跨 feature 复用的 UI 组件
    features/
      blueprint/
        components/              # BlueprintLayout / Overview / Header 等
        composables/             # useBlueprintLayout* / useBlueprintPath* 等
        domain/
          catalog/               # GameKee 建筑目录和本地图片映射
          layout/                # 布局盒、主题和显示边界
          parser/                # JSON 解析、节点归一化和 summary 构建
          path/                  # 传送带/管道路径几何和贴边规则
          template/              # 模板别名、连接点和占地规则
        i18n/                    # UI、物品、组件类型、建筑文案
        services/
          cache/                 # Supabase 缓存读写
          shareQuery/            # session、passport、QR、查询请求
        index.ts                 # app 层使用的 feature public API
      shared/                    # 等出现跨 feature 复用后再建
  tests/
    features/
      blueprint/
```

一次性改造中已落地最有收益的结构动作：`fetch_gamekee_data.py` 迁入 `scripts/data/`，版本脚本放入 `scripts/release/`，蓝图业务收口到 `features/blueprint`，测试目录镜像 feature，分享码 session 副作用下沉到 services，`domain/`、`i18n/` 和 `data/` 继续按语义细分。后续不建议再大规模搬目录，除非新增第二个 feature 或跨 feature 复用层。

### 结构优化建议优先级

| 优先级 | 动作 | 参考来源 | 原因 |
|---|---|---|---|
| P0 | 把 `fetch_gamekee_data.py` 移到 `scripts/data/`，并在 README 或 `scripts/README.md` 说明用途 | `luo_music_new` | 根目录更干净，数据抓取脚本归属清楚 |
| P1 | 拆分 `useBlueprintParser.ts`：会话/API/cookie/二维码进入 `useShareQuerySession.ts` | `qq-music-api` | 已完成，解析器只保留文本/文件到 summary 的职责 |
| P1 | 把蓝图纯逻辑从泛化 utils 收到 `features/blueprint/domain/` | 两者共同原则 | 已完成，领域逻辑和通用入口分开 |
| P2 | 建立 `features/blueprint/`，迁入蓝图专属组件和 composables | `luo_music_new` | 已完成，降低跨目录搜索成本 |
| P2 | 继续细分 `domain/`、`i18n/`、`data/` 目录语义 | 两者共同原则 | 已完成，当前为 domain 子域、独立消息表和 fixtures/templates 数据目录 |
| P2 | 测试目录跟随新结构镜像迁移 | `qq-music-api` | 已完成，当前为 `tests/features/blueprint/` |
| P3 | 新增 `docs/architecture.md` 或 `docs/project-structure.md` | 两者共同原则 | 防止未来结构和 README 继续漂移 |
| P3 | 当工具配置继续变多后，再考虑 `.config/` 和 `config/` 分层 | `luo_music_new` | 当前一次性改造只拆 `vitest.config.ts`，不做过度目录化 |

## 建议迁移阶段

### Phase 0：稳定当前基线

目的：避免在单测已红的基线上做工具链迁移。

任务：

- 修复 `tests/features/blueprint/domain/parser/blueprintSummaryBuilder.test.ts`，让预览图片断言匹配新的本地 GameKee 资源行为。
- 运行：
  - `npm run lint`
  - `npm run lint:style`
  - `npm run check:i18n`
  - `npm run test:run`
  - `npm run build`

退出标准：

- 在依赖和工具链大改前，基线检查全部通过。

### Phase 1：移除 Codecov 集成

目的：移除外部覆盖率上传和状态检查依赖，但不移除本地覆盖率能力。

任务：

- 删除 `codecov.yml`。
- 从 `.github/workflows/test.yml` 中移除 `CODECOV_TOKEN` 环境变量和 `codecov/codecov-action` 步骤。
- 从 `README.md` 中移除 Codecov 相关说明。
- 保留 `npm run test:coverage`，继续用于本地覆盖率和 CI 信号。
- 在需要的工具中继续忽略或排除 `coverage/**`。

退出标准：

- `rg -n "codecov|Codecov|CODECOV" .` 不再返回活跃项目引用。
- CI 仍然运行测试和构建，但不再上传覆盖率。

### Phase 2：升级到 Vite 8

目的：先迁移打包器和运行时基础。

任务：

- 更新依赖：
  - `vite` 到 `^8.0.16`
  - `@vitejs/plugin-vue` 到 `^6.0.7`
  - `vitest` 和 `@vitest/coverage-v8` 到兼容的最新 4.x
  - `vue-tsc` 到最新 3.x
- 同步升级 TypeScript 到 `6.0.3`，并用 `vue-tsc -b`、Vitest 和 i18n 检查确认没有 TS 主版本回归。
- 更新 `engines`、`packageManager`、CI Node 和 npm 版本：
  - `node`: `^20.19.0 || >=22.12.0`
  - CI 实际使用 Node `24`
  - `packageManager`: `npm@11.16.0`
- 拆分配置：
  - `vite.config.ts` 只保留应用构建、dev server、alias、base。
  - `vitest.config.ts` 只保留测试 include/exclude/coverage。
  - `tsconfig.node.json` include 两个配置文件。
- 保持核心 Vite 行为接近当前版本：
  - 保留 `normalizePublicBasePath`
  - 保留 `server.proxy`
  - 保留 alias
  - 将 Vitest coverage 配置原样迁入 `vitest.config.ts`
- 验证 `build.rollupOptions` 的兼容转换是否足够；只有确实需要时才加入 Vite 8 / Rolldown 专用配置。
- Vercel 部署也必须满足同一 Node 要求；如果仓库 `package.json` 增加 `engines.node`，应同步检查 Vercel 项目设置或环境是否会使用兼容 Node。

退出标准：

- `npm run build` 在 Vite 8 下通过。
- `npm run test:run` 通过。
- 开发服务器仍以相同 host/port 行为启动。

### Phase 3：引入并接管 Vite+

目的：用 Vite+ CLI 标准化本地开发、构建和预览命令。

任务：

- 添加 `vite-plus` dev dependency。
- 添加脚本：
  - `vp`：`node ./node_modules/vite-plus/bin/vp`
  - `vp:version`：`npm run vp -- --version`
  - `vp:help`：`npm run vp -- help`
- 主命令一次性切到 Vite+：
  - `dev`：`npm run vp -- dev`
  - `build`：`vue-tsc -b && npm run vp -- build`
  - `preview`：`npm run vp -- preview`
- `test`、`test:run`、`test:coverage` 继续直接使用 Vitest，避免把测试入口藏进通用命令。
- `vite.config.ts` 使用 `vite-plus` 的 `defineConfig`，并保留 Vite 标准配置。
- `vitest.config.ts` 使用 `vitest/config` 的 `defineConfig`，确保测试配置稳定。

退出标准：

- `npm run vp:version` 通过。
- `npm run dev` 仍然在 `127.0.0.1:4173` 启动应用。
- `npm run build` 保持通过。
- `npm run preview` 能预览 `dist` 产物。

### Phase 4：用 Oxlint 替换 ESLint

目的：降低 lint 延迟，并移除 ESLint 依赖栈。

任务：

- 添加 `.oxlintrc.json`。
- 添加 `oxlint` dev dependency。
- 修改脚本：
  - `lint`：`oxlint`
  - `lint:fix`：`oxlint --fix`
- 移除：
  - `eslint`
  - `@eslint/js`
  - `typescript-eslint`
  - `eslint-plugin-vue`
  - `eslint-config-prettier`
  - `globals`
  - `vue-eslint-parser`
  - `eslint.config.js`
- 保留 `stylelint`，因为 Oxlint 不替代 CSS/Vue style lint。
- 保留 `vue-tsc`，因为 Oxlint/OXC 不替代 Vue 类型检查。

初始 `.oxlintrc.json` 建议：

```json
{
  "$schema": "https://raw.githubusercontent.com/oxc-project/oxc/main/npm/oxlint/configuration_schema.json",
  "ignorePatterns": ["dist", "coverage", "node_modules", "data/gamekee_buildings/images"],
  "rules": {
    "no-unused-vars": "warn",
    "no-console": "off",
    "no-const-assign": "error",
    "no-empty-file": "error",
    "sort-keys": "off"
  }
}
```

退出标准：

- `npm run lint` 通过 Oxlint。
- `npm run lint:style` 仍然通过。
- `package.json` 中不再保留 ESLint 相关包。

### Phase 5：明确不添加显式 OXC Transform

目的：避免在 Vite 8 已内置 OXC 的基础上重复引入自定义 transform 层。

决策：

- 本次迁移不添加 `oxc-transform` 依赖。
- 不新增 `plugins/vite-plugin-oxc-transform.ts`。
- Vite 8 已经内部使用 OXC，而本项目是 Vue 前端应用，并不像 `qq-music-api` 那样有 Node library build。
- 未来只有在出现可量化的 transform 瓶颈，或需要直接控制 TS/TSX 类型擦除时，再单独评估。

退出标准：

- `package.json` 不包含 `oxc-transform`。
- Vite 8 build/test 均通过。

### Phase 6：添加自动版本号更新，但不发布

目的：获得类似 `qq-music-api` 的自动版本元数据能力，同时明确避免 npm 发布。

触发策略：

- 同时启用 `workflow_dispatch` 和 `push` 到 `main`。
- 使用 `if: github.actor != 'github-actions[bot]'` 防止 bot 提交循环。
- 使用 `paths-ignore` 排除纯文档、测试、覆盖率、版本产物等不应 bump 的改动。
- 版本提交使用 `[skip ci]`，避免版本提交触发普通 Test workflow。
- 默认主线版本策略采用 `minor + 1, patch = 0`，与 `qq-music-api` 的 `computeMainVersion` 一致。

推荐新增本地文件：

- `scripts/release/compute-release-version.mjs`
  - 本项目只保留稳定主线版本计算。
  - 建议行为：在 `main` 上 bump `minor` 并重置 `patch`，与 `qq-music-api` 的 `computeMainVersion` 一致。
  - 不查询 npm registry。
  - 不计算 beta 版本。
- `scripts/release/generate-changelog.js`
  - 根据 latest tag 之后的 conventional commits 生成或前置追加 `CHANGELOG.md`。
- `scripts/release/generate-version.js`
  - 生成 `public/version.json`。
  - 用于部署产物排障，不进入应用 bundle。
  - 字段包含 `name`、`version`、`commit`、`builtAt`。
- `scripts/release/bump-version.js`
  - 更新根目录 `package.json`。
  - 用 `npm install --package-lock-only --ignore-scripts` 刷新 `package-lock.json`。
  - 运行 changelog 和版本元数据生成。
  - 将 `new_version` 写入 `GITHUB_OUTPUT`。

推荐 `package.json` 脚本：

```json
{
  "scripts": {
    "changelog": "node scripts/release/generate-changelog.js",
    "version:bump": "node scripts/release/bump-version.js"
  }
}
```

推荐 workflow：

- 添加 `.github/workflows/version.yml`。
- 触发条件：
  - `workflow_dispatch`
  - `push` 到 `main`
- 增加 `paths-ignore`，建议排除：
  - `docs/**`
  - `README.md`
  - `tests/**`
  - `coverage/**`
  - `public/version.json`
  - `CHANGELOG.md`
  - `package.json`
  - `package-lock.json`
- 添加保护：
  - `if: github.actor != 'github-actions[bot]'`
- 权限：
  - `contents: write`
- 步骤：
  - checkout
  - setup Node 24
  - `npm ci`
  - 运行 `npm run version:bump`
  - 提交 `package.json`、`package-lock.json`、`CHANGELOG.md` 和 `public/version.json`
  - 使用 `[skip ci]` push 回 `main`

本项目明确禁止：

- `npm publish`
- package registry token 设置
- npm dist-tags
- GitHub Packages publish
- package provenance publish

退出标准：

- `workflow_dispatch` 和 `push main` 都能 bump 版本，并且只提交版本元数据。
- 不存在 publish job。
- `rg -n "npm publish|publishConfig|dist-tag|NPM_TOKEN" .github package.json scripts` 不返回活跃发布行为。
- bot guard 和 `paths-ignore` 不会产生循环提交。

### Phase 7：更新 README 和开发文档

任务：

- 将 README 中的工具链描述从 `Vite + Vue 3 + TypeScript` 更新为包含 Vite 8、Vite+ 和 Oxlint。
- 用 Oxlint 替换 ESLint 相关描述。
- 移除 Codecov 配置说明。
- 文档化：
  - Node 版本要求
  - `npm run vp:version`
  - `npm run lint`
  - `npm run lint:style`
  - `npm run test:run`
  - `npm run test:coverage`
  - 版本号自动更新 workflow 行为

退出标准：

- README 与实际脚本和 CI 行为一致。

## 建议最终脚本形态

```json
{
  "scripts": {
    "dev": "npm run vp -- dev",
    "build": "vue-tsc -b && npm run vp -- build",
    "check:i18n": "node scripts/check-i18n.mjs",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint": "oxlint",
    "lint:fix": "oxlint --fix",
    "lint:style": "stylelint \"src/**/*.{css,vue}\"",
    "lint:style:fix": "stylelint \"src/**/*.{css,vue}\" --fix",
    "preview": "npm run vp -- preview",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ci": "npm run lint && npm run lint:style && npm run check:i18n && npm run test:coverage && npm run build",
    "vp": "node ./node_modules/vite-plus/bin/vp",
    "vp:version": "npm run vp -- --version",
    "vp:help": "npm run vp -- help",
    "changelog": "node scripts/release/generate-changelog.js",
    "version:bump": "node scripts/release/bump-version.js"
  }
}
```

## 包管理器和 Lockfile 约束

本项目当前使用 npm 和 `package-lock.json`。迁移时应避免同时改变包管理器，减少变量。

建议：

- 保持 npm，不引入 pnpm/yarn。
- 在 `package.json` 中增加 `packageManager: "npm@11.16.0"`。
- CI 继续使用 `npm ci`，保证 lockfile 可复现。
- 修改依赖后必须提交 `package-lock.json`。
- 版本脚本刷新 lockfile 时使用 `npm install --package-lock-only --ignore-scripts`，避免触发无关 postinstall。
- CI 使用 Node 24，并显式安装或启用 npm 11.16.0，避免本地和 CI npm 版本漂移。

验证：

```bash
npm --version
npm ci
npm run build
```

## 执行前工作区隔离

当前工作区已有大量数据和业务文件变更，迁移工具链前应先把工作面隔离清楚，避免把不相关 diff 混入工具链提交。

建议：

- 先确认当前 GameKee 数据、`fetch_gamekee_data.py`、Vue 组件和测试变更是否属于另一个任务。
- 工具链迁移只修改和本计划相关的文件：`package.json`、`package-lock.json`、配置文件、CI workflow、README、版本脚本和必要的测试基线修复。
- 如果继续在当前分支执行，应在每个阶段提交前用 `git diff --name-only` 检查是否混入数据图片、业务组件或用户正在改的文件。
- 如果要正式落地迁移，推荐从干净的 `main` 或当前功能分支新建专门分支，例如 `chore/vite8-viteplus-oxlint`。

## CI、部署与环境补充考虑

### 分支触发策略

当前 Test workflow 曾同时监听 `main` 和 `master`，但仓库主线实际是 `main`。

建议：

- Test 和 Version workflow 都收敛到 `main`。
- `pull_request` 继续保留，不限制来源分支。
- 如果 GitHub 分支保护或外部平台仍引用 `master`，先迁移保护规则，再删除 workflow 中的 `master`。

### 静态检查边界

移除 ESLint 和 Qodana 后，静态检查边界收敛为 Oxlint、Stylelint、vue-tsc 和单元测试。Oxlint 负责 JS/TS 快速基础检查，Stylelint 负责样式，vue-tsc 负责 Vue SFC 与模板类型检查。

需要检查：

- `.github/workflows/qodana.yml` 和 `qodana.yaml` 均已删除。
- README、CI、计划文档不再把 Qodana 描述为活跃检查链路。
- `npm run test:ci` 覆盖 lint、stylelint、i18n、coverage 和 build。

### Vercel 部署

当前 `vercel.json` 使用：

- `framework: "vite"`
- `buildCommand: "npm run build"`
- `outputDirectory: "dist"`
- `/api/:path*` rewrite 到后端 API

迁移时需要守住：

- `build` 一次性切到 `vue-tsc -b && npm run vp -- build` 后，Vercel 继续只调用 `npm run build`。
- Vercel 需要做一次真实部署验证，确认 Vite+ build 输出仍是 `dist`。
- Vercel 的 Node 版本要满足 Vite 8 / Vite+ / Oxlint 的 Node `^20.19.0 || >=22.12.0` 要求。
- `.env.example` 中的 `VITE_API_BASE_URL` 默认留空语义不能变，否则 Vercel rewrite 可能失效。
- `VITE_PUBLIC_BASE_PATH=/` 的根部署行为和子路径部署行为都要验证。

### 环境变量和 API 代理不变量

迁移不能改变以下行为：

- `VITE_API_BASE_URL` 留空时，请求同域 `/api/...`。
- 开发环境通过 Vite `server.proxy` 代理 `/api`。
- Vercel 通过 `vercel.json` rewrite 代理 `/api`。
- 只有后端明确允许 CORS 时，才使用完整后端 origin。
- `normalizePublicBasePath` 对 `/`、`./`、子路径和完整 URL 的处理保持一致。

## TypeScript / Vitest 配置迁移策略

当前项目使用 `vitest/config` 的 `defineConfig` 把 Vite 和 Vitest 配置放在同一个 `vite.config.ts`。

建议：

- 本次直接拆出 `vitest.config.ts`。
- 拆分后 `vite.config.ts` 只保留应用构建和 dev server 配置，`vitest.config.ts` 保留测试 include/exclude/coverage。
- `tsconfig.node.json` 需要同步 include 新增配置文件，例如 `vite.config.ts`、`vitest.config.ts`、可能存在的 `.config/*.ts`。
- TypeScript 直接升级到 `6.0.3`，并通过 `vue-tsc -b` 和 Vitest 验证。

建议拆分形态：

```text
vite.config.ts          # base、plugins、alias、server.proxy
vitest.config.ts        # test.include、coverage、environment
tsconfig.node.json      # include 两个配置文件
```

## 版本元数据落点策略

`qq-music-api` 的版本系统包含版本计算、changelog、version metadata 和发布流程。本项目只需要前三者，且 version metadata 应先明确用途。

推荐决策：

| 用途 | 推荐落点 | 原因 |
|---|---|---|
| 部署排障、查看构建版本 | `public/version.json` | Vite 会原样复制到 `dist`，不进入应用 bundle |
| UI 中直接显示版本号 | `src/generated/version.ts` 或 `src/generated/version.json` | 可以被组件直接 import，但需要纳入 TS/lint/测试 |
| 只维护仓库版本和 changelog | 不生成 version metadata | 最少文件，避免无用产物 |

本次建议用 `public/version.json`，字段保持简单：

```json
{
  "name": "blueprint-analysis",
  "version": "0.1.0",
  "commit": "unknown",
  "builtAt": "2026-06-03T00:00:00.000Z"
}
```

注意：

- 如果 `builtAt` 每次运行都会变化，版本 workflow 之外不应频繁运行生成脚本，否则会造成无意义 diff。
- 如果使用 Git commit hash，GitHub Actions 中要确保 checkout 有足够信息。
- 如果本地运行没有 git 信息，应允许 `commit: "unknown"`，不要让脚本失败。

## 会话与凭据行为不变量

当前结构计划提到要拆分 `useBlueprintParser.ts`，但拆分时不能顺手改变 session/cookie 行为。这个文件涉及分享码查询、passport cookie、二维码、取消请求和错误本地化，属于用户可感知路径。

迁移和拆分时需要保持：

- cookie 名称、过期策略、读取/写入时机不变，除非单独做安全评估。
- 分享码查询的取消按钮行为不变。
- 二维码弹层的打开、关闭、过期提示不变。
- `VITE_API_BASE_URL` 和 `/api` 代理行为不变。
- 测试应覆盖“有 cookie 直接查询”和“无 cookie 触发登录/二维码”的关键路径。

## Oxlint 规则差异处理

Oxlint 的收益是速度和更轻的依赖栈，但它不是 ESLint + `eslint-plugin-vue` 的一比一替代。迁移时需要明确哪些检查由谁兜底。

建议分工：

| 检查类型 | 迁移后负责工具 | 说明 |
|---|---|---|
| JS/TS 基础正确性 | `oxlint` | 未使用变量、无效赋值、空文件等 |
| Vue SFC 类型和模板类型 | `vue-tsc` | 保留 `vue-tsc`，不要用 Oxlint 替代类型检查 |
| CSS 和 Vue `<style>` | `stylelint` | 保留现有 Stylelint |
| 格式化 | Prettier | 本次不切 `oxfmt` |
| 领域行为正确性 | Vitest | 尤其是蓝图解析、路径、模板映射 |
| Vue 专用风格规则 | 人工 review + focused tests | Oxlint 覆盖不足处不要假装已有等价规则 |

迁移步骤：

- 添加 `.oxlintrc.json`。
- 将 `lint` 直接切到 `oxlint`，`lint:fix` 切到 `oxlint --fix`。
- 删除 `eslint.config.js` 和 ESLint 依赖栈。
- 若发现 Vue 专用 lint 缺口，优先通过 `vue-tsc`、测试和文档化约束补齐，而不是强行保留整套 ESLint。

验证：

```bash
npm run lint
npm run lint:style
npm run build
```

## 验证矩阵

每个阶段后运行：

```bash
npm run lint
npm run lint:style
npm run check:i18n
npm run test:run
npm run build
```

移除 Codecov 后运行：

```bash
rg -n "codecov|Codecov|CODECOV" .
```

实现版本号 workflow 后运行：

```bash
node scripts/release/compute-release-version.mjs 0.0.0
npm run version:bump
git diff -- package.json package-lock.json CHANGELOG.md public/version.json
rg -n "npm publish|publishConfig|dist-tag|NPM_TOKEN" .github package.json scripts
```

引入 Vite+ 后运行：

```bash
npm run vp:version
npm run dev
```

Vite 8 / Vite+ 后验证环境和代理：

```bash
npm run dev
```

检查：

- `http://127.0.0.1:4173` 能打开。
- 分享码查询请求仍走 `/api/...`。
- `.env` 中 `VITE_API_BASE_URL=` 留空时不直接跨域请求后端。
- `VITE_PUBLIC_BASE_PATH=/` 构建产物可在根路径访问。
- `VITE_PUBLIC_BASE_PATH=/blueprint_analysis/` 构建产物资源路径正确。

CI 配置检查：

```bash
rg -n "main|master|CODECOV|codecov|eslint|oxlint|qodana|Qodana|version:bump" .github package.json README.md docs
```

检查：

- Codecov 已无活跃引用。
- Test / Version workflow 的分支策略统一到 `main`。
- 没有残留 Qodana workflow 或 `qodana.yaml`。
- `test:ci` 包含 `lint:style`，避免只在 workflow 中检查样式。

迁移 Vite 8 后补充资源和体积观察：

```bash
npm run build
Get-ChildItem dist\assets | Measure-Object
Get-ChildItem dist\assets | Sort-Object Length -Descending | Select-Object -First 20 Name,Length
```

观察点：

- `dist/assets` 资源数量是否异常增加。
- `index*.js` 和 `index*.css` 体积是否明显变大。
- GameKee 图片是否仍然能被正确输出和访问。
- `import.meta.glob` 解析路径是否和迁移前一致。

UI 冒烟验证：

```bash
npm run dev
```

浏览器检查：

- 默认蓝图能加载。
- JSON 编辑器能显示和重新解析。
- 布局图能显示建筑、路径和本地图片。
- 概览面板的建筑图标不出现大面积缺失。
- 分享码查询入口、二维码弹层和取消按钮仍可交互。

## 主要风险

- Vite 8 的 Node 版本要求可能让旧本地环境或旧 CI 环境失效。
- Vite 8 的 Rolldown 行为可能暴露资源处理或 chunking 差异，尤其是 `import.meta.glob` 和本地 GameKee 图片资源。
- Oxlint 不是 ESLint 的一比一替代品，尤其是 Vue 专用 lint 规则。需要用 `vue-tsc`、测试和重点 review 补上缺口。
- 每次 push 到 `main` 自动 bump 版本可能产生额外提交，因此 `[skip ci]` 和 bot actor guard 必须保留。
- 移除 Codecov 不应顺手移除本地 coverage。
- Vercel 如果使用不兼容 Node 版本，可能本地和 CI 都通过但部署失败。
- `public/version.json` 如果包含每次生成都会变化的时间戳，可能导致版本 workflow 之外出现噪音 diff。
- TypeScript 6 如果和 Vite 8 同提交升级，会增加问题定位难度。

## 回滚策略

每个阶段都应能独立回滚，不要把多个阶段压在一个提交里。

| 阶段 | 回滚方式 |
|---|---|
| Phase 0 基线修复 | 只回退测试断言或对应业务修复，保留验证命令记录 |
| Phase 1 Codecov 移除 | 恢复 `codecov.yml` 和 `.github/workflows/test.yml` 中的上传步骤 |
| Phase 2 Vite 8 | 回退 `package.json`、`package-lock.json`、`vite.config.ts`、CI Node 版本 |
| Phase 3 Vite+ | 保留依赖也可以，先把 `dev/build/preview` 切回直接 Vite；必要时移除 `vite-plus` 和 `vp:*` 脚本 |
| Phase 4 Oxlint | 临时恢复 ESLint 依赖和 `eslint.config.js`，把 `lint` 切回 `eslint .` |
| Phase 5 OXC Transform | 删除自定义插件和配置引用，回到 Vite 8 内置 transform |
| Phase 6 版本更新 | 删除 `.github/workflows/version.yml` 和版本脚本，回退 `package.json/package-lock.json/CHANGELOG.md/version.json` |
| Phase 7 README | 回退文档即可，不影响运行时代码 |

原则：

- 先回退命令入口，再回退依赖。
- 先恢复能跑的 CI，再清理残留文件。
- 如果失败来自工具链兼容，不要同时做结构迁移。

## 推荐执行顺序

1. 修复当前失败的单元测试。
2. 隔离当前工作区已有数据/业务改动，确保工具链迁移不混入无关 diff。
3. 移除 Codecov。
4. 升级 Vite 8 和相关核心依赖。
5. 添加 Vite+ CLI 包装脚本，并让 `dev/build/preview` 路由到 `vp`。
6. 用 Oxlint 替换 ESLint。
7. 添加自动版本号更新脚本和 workflow，但不添加发布行为。
8. 更新 README，并运行完整验证矩阵。
