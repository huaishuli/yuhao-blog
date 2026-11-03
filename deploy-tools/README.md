# deploy-tools

部署与排查用的零依赖 Node 脚本（不参与 Astro 构建，不会被 `pnpm build` 打包进 `dist/`）。
运行方式：`node deploy-tools/<脚本> [参数]`。如果终端里没有 `node`，先执行：

```powershell
$env:PATH = "C:\Users\19352\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin;$env:PATH"
```

| 脚本 | 作用 | 示例 |
| --- | --- | --- |
| `serve.mjs` | 用本地静态服务器模拟 Cloudflare 静态资源托管来预览 `dist/`（目录自动补 `index.html`，未命中返回 `404.html`），改完配置想先本地看效果时用 | `node deploy-tools/serve.mjs` → http://127.0.0.1:8099 ；端口可用 `PORT=9000` 覆盖 |
| `bind-domain.mjs` | 把一个**已接入 Cloudflare 且状态 active** 的域名绑定到 Worker `huaishuli`（custom domain），用于让站点摆脱被墙的 `*.workers.dev` | `node deploy-tools/bind-domain.mjs example.com www.example.com` |
| `cf-check.mjs` | 读取本机 wrangler 的 OAuth 凭证，检查 Worker 是否存在、workers.dev 子域、账号下的 Zone 列表 | `node deploy-tools/cf-check.mjs` |
| `cf-deploy-status.mjs` | 列出账号下所有 Worker、`huaishuli` 的部署记录与当前生效版本 | `node deploy-tools/cf-deploy-status.mjs` |
| `cf-list.mjs` | 精简版：只列 Worker 脚本 | `node deploy-tools/cf-list.mjs` |
| `download.mjs` | 断点续传下载器（`fetch` + `Range` + 重试），当初用来从镜像拉源码 zip；换网络/换镜像时需要重新拉仓库时可用 | `node deploy-tools/download.mjs <url> <out-file>` |

## 说明

- 这些脚本只依赖 Node 内置模块，不需要 `pnpm install`。
- `cf-*.mjs` / `bind-domain.mjs` 会读取 `%APPDATA%\xdg.config\.wrangler\config\default.toml` 里的 OAuth token（与 `wrangler` 命令同一份凭证，令牌会自动续期）。
- 站点构建/部署本身用仓库根目录的 `deploy.cmd`，不需要这些脚本。
