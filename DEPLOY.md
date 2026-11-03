# 部署说明（Cloudflare Workers 静态资源）

## 线上地址

- 站点：<https://firefly.yuhao-house.workers.dev>
- Cloudflare Worker 名称：`firefly`
- Cloudflare 账号：`z215690442012@outlook.com`（Account ID `a724c05c7d938cb9360efb917dc73f1a`，workers.dev 子域 `yuhao-house`）
- 部署方式：Astro 静态构建产物 `dist/` 由 Workers 的 Static Assets 直接托管（**没有**启用 `CF_WORKERS` 适配器，也不跑 SSR）

## 一键重新部署

在仓库根目录双击或执行：

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

## 关键文件

| 文件 | 作用 |
| --- | --- |
| `wrangler.jsonc` | Worker 名称、`compatibility_date: 2026-11-03`、`assets.directory: ./dist`、`not_found_handling: 404-page`（未匹配路径返回 `404.html`） |
| `src/config/siteConfig.ts` | 站点标题 / 副标题 / `site_url` / 描述 / 导航与页面开关。`site_url` 已改为上面的 workers.dev 地址，绑定自定义域名后要同步修改并重新构建 |
| `src/config/*Config.ts` | 侧边栏、评论、统计、字体、看板娘、页面开关等功能配置 |
| `src/content/posts`、`src/content/dynamic` | 文章与动态内容（当前是主题自带的示例内容） |

## 工具目录 `deploy-tools/`

部署与排查用的零依赖 Node 脚本，不参与构建、不会进 `dist/`。详见 `deploy-tools/README.md`：

- `serve.mjs` — 本地起静态服务器预览 `dist/`（模拟 Cloudflare 静态托管行为）
- `bind-domain.mjs` — 把已接入 Cloudflare 的域名绑定到 Worker `firefly`
- `cf-check.mjs` / `cf-deploy-status.mjs` / `cf-list.mjs` — 用 wrangler 凭证查 Worker、部署版本、Zone
- `download.mjs` — 断点续传下载器（当初拉源码用）

## 依赖与缓存

`node_modules/` 已安装好（1175 个包）。pnpm 的全局内容仓库（store，约 1 GB）原先放在工作区外的 `.firefly-tools\pnpm-home`，已随目录清理一起删除：**不影响已装好的依赖和构建**（node_modules 里是硬链接，数据仍然有效）。只有以后 `pnpm install` 新增/更新依赖时会重新下载一遍。

## 访问网络提示

`*.workers.dev` 在当前网络（中国大陆）被 DNS 污染 + TCP 阻断（本机解析到 `174.36.228.136`，连接超时；Cloudflare 边缘 IP 也被 SNI 阻断），因此**本机无法直接打开线上地址**，部署本身是成功的（`wrangler` 上传与版本发布均返回成功，Cloudflare API 显示版本 100% 生效）。需要国内可访问时：

1. 把一个已托管在 Cloudflare 的域名绑定到该 Worker（`wrangler` 或控制台 Workers → Settings → Domains & Routes → Add custom domain），然后把 `src/config/siteConfig.ts` 的 `site_url` 改成该域名并重新 `deploy.cmd`；
2. 或临时用代理 / VPN 访问 workers.dev。

当前 Cloudflare 账号下没有任何 Zone（域名），所以自定义域名需要先把域名接入 Cloudflare。

## 构建产物

`dist/` 约 329 个文件、22.8 MB（含 `pagefind` 搜索索引、`_astro` 资源、`og` 分享图、`rss.xml`/`atom.xml`、`sitemap`）。构建流程见 `package.json` 的 `build` 脚本：GitHub 卡片数据 → LQIP → VNDB 封面（本站未启用）→ `astro build` → 精简看板娘资源（省 15 MiB）→ 字体子集化（本站用系统字体，跳过）→ 内联脚本压缩 → Pagefind 索引。

## 已知示例内容现象

示例文章 `src/content/posts/firefly.md` 等把 `published` 写成 `1970-01-02`，页面上会显示这个日期；换成自己的文章或改 frontmatter 即可。
