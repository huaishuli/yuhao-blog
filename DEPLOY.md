# 部署说明（Cloudflare Pages + Workers）

## 线上地址

| 用途 | 地址 |
| --- | --- |
| 正式站点（Cloudflare Pages，push 自动构建） | <https://huaishuli.pages.dev> |
| 备用站点（Cloudflare Worker 静态资源，手动部署） | <https://huaishuli.yuhao-house.workers.dev> |
| GitHub 仓库 | <https://github.com/huaishuli/yuhao-blog> |
| 内容后台（Pages CMS） | <https://app.pagescms.org> |

- Cloudflare 账号：`z215690442012@outlook.com`（Account ID `a724c05c7d938cb9360efb917dc73f1a`，workers.dev 子域 `yuhao-house`）
- Pages 项目名：`huaishuli`；Worker 名：`huaishuli`
- 部署方式：Astro 静态构建产物 `dist/`。Pages 负责自动构建，Workers 用 Static Assets 直接托管同一份 `dist/`（**没有**启用 `CF_WORKERS` 适配器，不跑 SSR）

## 两种发布方式

### 1. 改内容 / 改代码后 push（推荐）

```bat
git add -A
git commit -m "content: 写点什么"
git push
```

push 之后 Cloudflare Pages 会自动拉取仓库、执行 `pnpm build`、把 `dist/` 发布到 <https://huaishuli.pages.dev>。构建配置在 Cloudflare 上：Build command `pnpm build`，Output directory `dist`。

当本机连不上 `github.com:443`（大陆网络常见）时，用 GitHub REST API 代替 push：

```powershell
powershell -ExecutionPolicy Bypass -File deploy-tools/with-gh-token.ps1 -Script deploy-tools/gh-sync.mjs -ScriptArgs "content: 写点什么"
```

`gh-sync.mjs` 会对比远端 `main` 与本地工作树，自动提交新增、修改与删除（等价于 `git add -A && git commit && git push`）。

### 2. 本地手动部署到 Worker

在仓库根目录执行：

```bat
deploy.cmd
```

只上传已有的 `dist/`（不重新构建）：

```bat
deploy.cmd --skip-build
```

脚本做的事：把 DSH 自带 Node 24 加进 PATH（`npx` 来自 `C:\Program Files\nodejs`）→ `pnpm build` → `wrangler deploy`。

手动等价命令（PowerShell）：

```powershell
$env:PATH = "C:\Users\19352\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin;$env:PATH;C:\Program Files\nodejs"
$env:NODE_ENV = "production"
node "C:\Users\19352\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\pnpm\bin\pnpm.mjs" build
node node_modules\wrangler\bin\wrangler.js deploy
```

本地开发：`pnpm dev`（默认 <http://localhost:4321>）；本地预览生产构建：`pnpm preview`。

## 内容后台（Pages CMS）

仓库根目录的 `.pages.yml` 定义了 Pages CMS 的后台界面：

- `文章` → `src/content/posts`（frontmatter 字段全量映射，含封面图、标签、置顶、系列、密码等；正文用富文本编辑器；新建时「链接别名」必填，它决定文件名和网址，如 `my-first-post` → `/posts/my-first-post/`）
- `动态` → `src/content/dynamic`（文件名按 `年-月-日-时分秒.md` 自动生成）
- `项目` → `src/content/projects`
- `关于我` / `留言板` → `src/content/spec/about.md`、`guestbook.md`
- 图片上传目录：`public/assets/images/uploads`，后台选图后自动写入 `/assets/images/uploads/xxx.png`

使用步骤：打开 <https://app.pagescms.org> → 用 GitHub 登录 → 授权 Pages CMS 访问 `huaishuli/yuhao-blog` 仓库 → 选择该仓库 → 在左侧选集合增删改内容。保存即提交到仓库 `main` 分支，Cloudflare Pages 自动重新构建上线。

已知限制：`.mdx` 文件（如 `src/content/spec/friends.mdx`）不会出现在后台列表里，需要本地编辑；`posts/images` 这类子目录里的图片会以文件夹形式出现，但不作为可编辑条目；后台「删除」只删除它列出的 `.md`，子目录与 mdx 需要本地删。

## 关键文件

| 文件 | 作用 |
| --- | --- |
| `.pages.yml` | Pages CMS 后台配置（集合、字段、媒体目录） |
| `wrangler.jsonc` | Worker 名称 `huaishuli`、`compatibility_date: 2026-11-03`、`assets.directory: ./dist`、`not_found_handling: 404-page` |
| `src/config/siteConfig.ts` | 站点标题 / 副标题 / `site_url` / 描述 / 导航与页面开关 |
| `src/config/backgroundWallpaper.ts` | 首页横幅文案（标题、打字机副标题、按钮链接）与壁纸 |
| `src/config/profileConfig.ts` | 侧栏头像、昵称、简介、社交链接 |
| `src/content/posts`、`src/content/dynamic` | 文章与动态；当前是自有的 2 篇文章 + 4 条动态，主题示例内容已全部清空 |

## 工具目录 `deploy-tools/`

部署与排查用的零依赖 Node 脚本，不参与构建、不会进 `dist/`。详见 `deploy-tools/README.md`：

- `serve.mjs` — 本地起静态服务器预览 `dist/`（模拟 Cloudflare 静态托管行为）
- `gh-sync.mjs` — 工作树与远端 `main` 对齐后整批提交（新增/修改/删除），`git push` 不通时用它
- `gh-commit.mjs` — 只提交指定文件的旧版脚本，保留作兼容
- `with-gh-token.ps1` — 从 Windows 凭据管理器取 GitHub token 并运行上面两个脚本
- `gh-probe.mjs` — 查远端最近提交与目录树
- `scrub-brand.mjs` / `audit-brand.mjs` — 品牌词批量改名与审计
- `brand-assets.py` — 生成 favicon（Pillow）
- `bind-domain.mjs` — 把已接入 Cloudflare 的域名绑定到 Worker `huaishuli`
- `cf-check.mjs` / `cf-deploy-status.mjs` / `cf-list.mjs` — 用 wrangler 凭证查 Worker、部署版本、Zone
- `download.mjs` — 断点续传下载器（当初拉源码用）

## 依赖与缓存

`node_modules/` 已安装好。Cloudflare Pages 构建时会自行 `pnpm install` 并缓存依赖（构建机默认 Node 22，满足 `package.json` 的 `>=22.23`）。本地 build 前若 pnpm 想重装依赖，加 `CI=true` 跳过交互确认。

## 访问网络提示

`*.workers.dev` 在当前网络（中国大陆）被 DNS 污染 + TCP 阻断，本机打不开；`*.pages.dev` 目前可正常访问，所以日常请用 <https://huaishuli.pages.dev>。需要长期稳定访问时，把域名接入 Cloudflare 后绑定到 Pages 项目（控制台 Pages → 项目 → Custom domains），并与 `site_url` 保持一致。

## 站点初始化状态

- `siteConfig.siteStartDate` 设为 `2026-11-03`（侧栏「运行时长」从这天开始算）
- 内容：2 篇自有文章、4 条动态、1 个项目；相册 `acg-2026`（二次元收藏）
- favicon 是程序生成的「H」渐变图标（`public/favicon/huaishuli-*.png`），要换直接替换这些文件
- 看板娘（pio）默认关闭，spine 模型目录已清空，需要时自备模型放到 `public/pio/models/spine/<名称>/` 再改 `src/config/pioConfig.ts`
