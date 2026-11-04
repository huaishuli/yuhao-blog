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

`*.workers.dev` 在当前网络（中国大陆）被 DNS 污染 + TCP 阻断，本机打不开；`*.pages.dev` 目前可正常访问。国内长期访问走 <https://yuhaohuaishuli.cn>，链路是「EdgeOne 海外免费版（香港/境外节点，免备案）→ 回源 `huaishuli.pages.dev`」，见下节。

## 国内访问：EdgeOne 海外免费版（免备案）

域名 `yuhaohuaishuli.cn` 注册在腾讯云，NS 当前指向 DNSPod（`bike.dnspod.net` / `puding.dnspod.net`），解析记录为空——没有迁移负担。发布入口不变，仍然是 push `main` → Cloudflare Pages 构建；EdgeOne 只做大陆方向的加速层：

```
浏览器 → EdgeOne 境外节点（免备案）→ 回源 huaishuli.pages.dev（Cloudflare Pages）
```

### 1. 添加站点（约 5 分钟）

1. 打开 <https://console.tencentcloud.com/edgeone>（腾讯云国际站控制台，国内站同一域名也能登），「添加站点」填 `yuhaohuaishuli.cn`
2. 套餐选**免费版**：流量/请求不限、1 个站点、200 个加速域名、免费 HTTPS 证书（Let's Encrypt，自动续期）
3. **加速区域必须选「全球可用区（不含中国大陆）」**——这是唯一免备案的选项；「中国大陆可用区」和「全球可用区」都要求 ICP 备案
4. 接入模式：推荐 **NS 接入**（apex 直接下发 A 记录，不用在 DNSPod 加 CNAME/TXT）；想保留 DNSPod 解析则选 **CNAME 接入**

### 2. 添加加速域名（回源配置是唯一容易踩坑的地方）

「域名服务 → 域名管理 → 添加域名」，`@`（apex）和 `www` 各加一次：

| 配置项 | 值 | 说明 |
| --- | --- | --- |
| 加速域名 | `@`、`www` | 均可加免费证书 |
| 源站类型 | 域名 | 不要选 IP |
| 源站地址 | `huaishuli.pages.dev` | 端口 443 |
| 回源协议 | HTTPS | Pages 只提供 HTTPS |
| 回源 HOST 头 | **使用源站域名** | 关键：Pages 按 Host 路由，用加速域名当 Host 会得到 404/522 |
| 证书 | HTTPS 配置 → 免费证书 | 一键申请，自动续期 |

### 3. 解析（二选一）

**A. NS 接入（推荐）**：EdgeOne 给出两个 NS 地址，到 [腾讯云域名控制台](https://console.cloud.tencent.com/domain) → 我的域名 → `yuhaohuaishuli.cn` → DNS 服务器 → 选「自定义」填入。DNSPod 里现在是空的，不会丢记录；生效通常 5 分钟～2 小时。

**B. CNAME 接入（保留 DNSPod）**：先做归属权验证，在 DNSPod 加：

| 主机记录 | 类型 | 值 | TTL |
| --- | --- | --- | --- |
| `edgeonereclaim` | TXT | 控制台给出的验证值 | 600 |

验证通过后，控制台会给每个加速域名分配 CNAME 目标，再在 DNSPod 加（TTL 600）：

| 主机记录 | 类型 | 值 |
| --- | --- | --- |
| `@` | CNAME | 分配的 `xxx.edgeone...` 目标 |
| `www` | CNAME | 同上或独立目标 |

### 4. 站点侧建议配置

- **强制 HTTPS** 开启（HSTS 可选，开启前确认所有子域都有证书）
- **缓存**：HTML 保持「遵循源站」（Pages 给 HTML 的 `cache-control` 是 `max-age=0, must-revalidate`，不会缓存旧页面）；`/_astro/*` 已在 `public/_headers` 里声明 `immutable` 长缓存，EdgeOne 跟随源站即可
- **智能压缩**：开 Gzip/Brotli
- **www ↔ apex**：用规则引擎加一条 301，只保留一个主域
- **404**：无需自定义错误页，Pages 自身返回真 404

### 5. 用 API 自动配置（可选，代替第 1～3 节的手点）

`deploy-tools/teo.mjs` 自带 TC3 签名，凭证只从环境变量读（不要写进仓库）：

```powershell
$env:TENCENTCLOUD_SECRET_ID  = "AKID..."
$env:TENCENTCLOUD_SECRET_KEY = "..."
node deploy-tools/teo.mjs plans                                     # 确认免费版套餐已领取，拿到 PlanId
node deploy-tools/teo.mjs create-zone yuhaohuaishuli.cn --plan edgeone-xxx
node deploy-tools/teo.mjs add-domain zone-xxx yuhaohuaishuli.cn --origin huaishuli.pages.dev
node deploy-tools/teo.mjs add-domain zone-xxx www.yuhaohuaishuli.cn --origin huaishuli.pages.dev
node deploy-tools/teo.mjs zones                                     # 复核状态与 NameServers
```

`create-zone` 默认 `Type=full`（NS 接入）、`Area=overseas`（免备案）。两种接入方式仍然绕不开的只有两件事：**改注册商 NS**（或加 CNAME/TXT），以及**领取免费套餐**——后者若账号里还没有套餐，`plans` 会直接提示。

### 6. 验收与切换

```powershell
$env:PATH = "C:\Users\19352\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin;$env:PATH"
node deploy-tools/verify-domain.mjs yuhaohuaishuli.cn
```

全绿（DNS/TLS/200/404/资源缓存都 ✓）**之后**再切站点配置，否则 canonical 会先指向一个打不开的域名：

- `src/config/siteConfig.ts:51`：`site_url` 改成 `https://yuhaohuaishuli.cn`
- `src/content/projects/huaishuli-blog.md:15`：站点地址同步改
- 提交后等 Pages 重新构建，再跑一次 `verify-domain.mjs`，确认 `canonical` 指向新域名

### 实际部署记录（2026-11-04 完成）

| 项目 | 值 |
| --- | --- |
| 站点 ZoneId | `zone-3wzf0kkz32qq`（`yuhaohuaishuli.cn`，`Type=full`，`Area=overseas`，套餐 `edgeone-3wy0b0y3ujsk` / plan-free） |
| NS | `ns1.qeodns.com` / `ns2.qeodns.com`（已在腾讯云域名侧用 `ModifyDomainDNS` 改好，`DomainId=domain-300x51cq`） |
| 加速域名 | `yuhaohuaishuli.cn`（`edge-3wzf0xo3ykrz`）、`www.yuhaohuaishuli.cn`（`edge-3wzf0zg7cqyh`），均 `online` |
| 回源 | `IP_DOMAIN` + `huaishuli.pages.dev`，`HTTPS`/443，`HostHeader=huaishuli.pages.dev` |
| 证书 | `teo-3wzf6q9eorpa`（apex）、`teo-3wzfvcufa2wu`（www），`eofreecert`，TrustAsia，到期 2027-01-31 |
| 边缘 IP | `43.174.246.112` / `43.174.247.112` |
| 强制 HTTPS | `ModifyZoneSetting ForceRedirect = {Switch:on, RedirectStatusCode:301}` |

API 踩坑清单（都已在本仓库 `teo.mjs` 的调用里验证过）：

1. `CreateAccelerationDomain` 的 `OriginInfo.OriginType` 要大写 `IP_DOMAIN`，文档示例里的小写 `ip_domain` 会报 `InvalidParameterValue`
2. 不传 `OriginInfo.HostHeader` 时会回落成加速域名本身，Pages 按 Host 路由 → 必须显式设成 `huaishuli.pages.dev`
3. EdgeOne 自动建的两条 CNAME 记录初始是 `disable`，站点 active 后仍然解析不到；要 `ModifyDnsRecordsStatus {RecordsToEnable:[...]}` 手动启用
4. `ModifyDnsRecordsStatus` 的参数名是 `RecordsToEnable`/`RecordsToDisable`，`DeleteDnsRecords` 的参数名是 `RecordIds`（只传 ZoneId 会静默成功但什么都不改）
5. 免费证书是**按加速域名逐个申请**的，`ModifyHostsCertificate {Hosts:[一个域名], Mode:"eofreecert"}`，漏了 www 就只有 apex 有证书
6. 改注册商 NS 用域名产品的 `ModifyDomainDNS`（`TC_SERVICE=domain`、`TC_VERSION=2018-08-08`），参数是 `DomainId` + `Dns`（不是 `DnsServers`）
7. EdgeOne 会把源站的 `Cache-Control` 去掉再回给浏览器（`eo-cache-status: HIT` 说明边缘确实在缓存）；`public/_headers` 的 `immutable` 只对源站/Pages 生效，浏览器侧拿不到，属免费版行为

### 已知限制

- 免备案 = 境外节点：大陆访问通常 40–120 ms（香港），比 pages.dev 稳定得多，但达不到备案 CDN 的水平
- 微信/QQ 内打开未备案的 `.cn` 域名可能被拦截提示，这只能靠备案解决
- 免费版没有 HTTP/3、智能加速、独立 DDoS 防护；源站仍是 Cloudflare
- 域名 NS 一旦改到 EdgeOne，DNSPod 的解析记录就失效；想切回按第 3 节反向操作即可

## 站点初始化状态

- `siteConfig.siteStartDate` 设为 `2026-11-03`（侧栏「运行时长」从这天开始算）
- 内容：2 篇自有文章、4 条动态、1 个项目；相册 `acg-2026`（二次元收藏）
- favicon 是程序生成的「H」渐变图标（`public/favicon/huaishuli-*.png`），要换直接替换这些文件
- 看板娘（pio）默认关闭，spine 模型目录已清空，需要时自备模型放到 `public/pio/models/spine/<名称>/` 再改 `src/config/pioConfig.ts`


## 2026-11-04：GitHub 自动构建通道故障与迁移

原 Pages 项目 `huaishuli` 的 GitHub 触发构建自 2026-11-03 14:56 UTC 起全部卡在 `initialize` 阶段（平台侧，非代码/权限问题），导致 Pages CMS 的改动无法自动上线。
处理：新建 Pages 项目 `huaishuli-site`（同仓库 `huaishuli/yuhao-blog`、`main` 分支、`pnpm build` → `dist`、build caching 开启），构建正常；EdgeOne 两个加速域名的源站已切到 `huaishuli-site.pages.dev`（回源 HOST 头同为源站域名）。

- 新项目默认域名：`https://huaishuli-site.pages.dev`
- 旧项目 `huaishuli` 保留但已非源站，`huaishuli.pages.dev` 仍是旧部署，可择机删除
- 若以后再遇到构建卡 `initialize`：直接新建项目迁移，不要反复 retry（retry 会发布旧内容）
- 源站切换命令：EdgeOne `ModifyAccelerationDomain`，`OriginInfo.Origin` 与 `HostHeader` 必须一起改
