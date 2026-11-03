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

- `文章` → `src/content/posts`（frontmatter 字段全量映射，含封面图、标签、置顶、系列、密码等；正文用富文本编辑器）
- `动态` → `src/content/dynamic`
- `项目` → `src/content/projects`
- `关于我` / `留言板` → `src/content/spec/about.md`、`guestbook.md`
- 图片上传目录：`public/assets/images/uploads`，文章里引用 `/assets/images/uploads/xxx.png`

使用步骤：打开 <https://app.pagescms.org> → 用 GitHub 登录 → 授权 Pages CMS 访问 `huaishuli/yuhao-blog` 仓库 → 选择该仓库 → 在左侧选集合增删改内容。保存即提交到仓库 `main` 分支，Cloudflare Pages 自动重新构建上线。

已知限制：`.mdx` 文件（如 `src/content/posts/mdx-example.mdx`、`src/content/spec/friends.mdx`）不会出现在后台列表里，需要本地编辑；`posts/images`、`posts/guide` 里的图片会以文件夹形式出现，但不作为可编辑条目。

## 关键文件

| 文件 | 作用 |
| --- | --- |
| `.pages.yml` | Pages CMS 后台配置（集合、字段、媒体目录） |
| `wrangler.jsonc` | Worker 名称 `huaishuli`、`compatibility_date: 2026-11-03`、`assets.directory: ./dist`、`not_found_handling: 404-page` |
| `src/config/siteConfig.ts` | 站点标题 / 副标题 / `site_url` / 描述 / 导航与页面开关 |
| `src/config/backgroundWallpaper.ts` | 首页横幅文案（标题、打字机副标题、按钮链接）与壁纸 |
| `src/config/profileConfig.ts` | 侧栏头像、昵称、简介、社交链接 |
| `src/content/posts`、`src/content/dynamic` | 文章与动态内容（当前是主题自带的示例内容） |

## 工具目录 `deploy-tools/`

部署与排查用的零依赖 Node 脚本，不参与构建、不会进 `dist/`。详见 `deploy-tools/README.md`：

- `serve.mjs` — 本地起静态服务器预览 `dist/`（模拟 Cloudflare 静态托管行为）
- `bind-domain.mjs` — 把已接入 Cloudflare 的域名绑定到 Worker `huaishuli`
- `cf-check.mjs` / `cf-deploy-status.mjs` / `cf-list.mjs` — 用 wrangler 凭证查 Worker、部署版本、Zone
- `download.mjs` — 断点续传下载器（当初拉源码用）

## 依赖与缓存

`node_modules/` 已安装好（1175 个包）。Cloudflare Pages 构建时会自行 `pnpm install` 并缓存依赖，本地不需要额外配置。

## 访问网络提示

`*.workers.dev` 在当前网络（中国大陆）被 DNS 污染 + TCP 阻断，本机打不开；`*.pages.dev` 目前可正常访问，所以日常请用 <https://huaishuli.pages.dev>。需要长期稳定访问时，把域名接入 Cloudflare 后绑定到 Pages 项目（控制台 Pages → 项目 → Custom domains），并与 `site_url` 保持一致。

## 已知示例内容现象

主题自带示例文章的 `published` 是 `1970-01-02`，页面上会显示这个日期；换成自己的文章或改 frontmatter 即可。
