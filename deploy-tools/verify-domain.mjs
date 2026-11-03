#!/usr/bin/env node
// 验证自定义域名的接入状态：DNS 解析、TLS 证书、HTTP 响应、缓存头、404 行为，并与源站对比延迟。
// 零依赖，只用 Node 内置模块。可在改完 NS/CNAME 后立刻跑一遍确认「真的能打开」。
//
// 用法：
//   node deploy-tools/verify-domain.mjs                     # 默认检查 yuhaohuaishuli.cn
//   node deploy-tools/verify-domain.mjs example.com
//   node deploy-tools/verify-domain.mjs example.com --origin https://huaishuli.pages.dev
//
// 判定：✗ 表示硬失败（退出码 1），! 表示可疑但不致命，✓ 表示通过。

import dns from "node:dns/promises";
import https from "node:https";
import tls from "node:tls";

const argv = process.argv.slice(2);
const domain = argv.find((a) => !a.startsWith("--")) ?? "yuhaohuaishuli.cn";
const origin = argv.includes("--origin") ? argv[argv.indexOf("--origin") + 1] : "https://huaishuli.pages.dev";
const originHost = new URL(origin).hostname;

const RESOLVERS = [
	["AliDNS", "223.5.5.5"],
	["DNSPod", "119.29.29.29"],
	["Cloudflare", "1.1.1.1"],
];

const results = [];
function report(level, area, detail) {
	results.push({ level, area, detail });
	const mark = level === "ok" ? "✓" : level === "warn" ? "!" : "✗";
	console.log(`${mark} [${area}] ${detail}`);
}

/** 用指定 DNS 服务器查询，失败返回 { error }。 */
async function query(server, name, type) {
	const resolver = new dns.Resolver({ timeout: 4000, tries: 2 });
	resolver.setServers([server]);
	try {
		return { values: await resolver.resolve(name, type) };
	} catch (e) {
		return { error: e.code ?? e.message };
	}
}

function tlsInfo(host, port = 443) {
	return new Promise((resolve) => {
		const socket = tls.connect(
			{ host, port, servername: host, ALPNProtocols: ["h2", "http/1.1"], timeout: 12000 },
			() => {
				const cert = socket.getPeerCertificate();
				const protocol = socket.getProtocol();
				const alpn = socket.alpnProtocol;
				socket.end();
				resolve({ ok: true, cert, protocol, alpn });
			},
		);
		socket.on("error", (e) => resolve({ ok: false, error: e.message }));
		socket.on("timeout", () => {
			socket.destroy();
			resolve({ ok: false, error: "TLS 握手超时" });
		});
	});
}

function httpRequest(url, method = "GET") {
	return new Promise((resolve) => {
		const u = new URL(url);
		const started = process.hrtime.bigint();
		const req = https.request(
			{
				host: u.hostname,
				port: u.port || 443,
				path: `${u.pathname}${u.search}`,
				method,
				servername: u.hostname,
				headers: { "user-agent": "dsh-verify-domain/1.0", accept: "*/*" },
				timeout: 20000,
			},
			(res) => {
				let ttfb = null;
				let bytes = 0;
				const chunks = [];
				res.once("data", () => {
					ttfb = Number(process.hrtime.bigint() - started) / 1e6;
				});
				res.on("data", (chunk) => {
					bytes += chunk.length;
					if (bytes < 3_000_000) chunks.push(chunk);
				});
				res.on("end", () =>
					resolve({
						ok: true,
						status: res.statusCode,
						headers: res.headers,
						ttfb,
						total: Number(process.hrtime.bigint() - started) / 1e6,
						bytes,
						body: Buffer.concat(chunks).toString("utf8"),
					}),
				);
			},
		);
		req.on("timeout", () => req.destroy(new Error("HTTP 超时")));
		req.on("error", (e) => resolve({ ok: false, error: e.message }));
		req.end();
	});
}

function ms(n) {
	return `${Math.round(n)} ms`;
}

const summary = { resolve: false, tls: false, http: false };

console.log(`\n检查 ${domain}（源站 ${origin}）\n`);

// ── 1. DNS ────────────────────────────────────────────────
let apexAddress = null;
let wwwAddress = null;

for (const [label, server] of RESOLVERS) {
	const ns = await query(server, domain, "NS");
	const a = await query(server, domain, "A");
	const cname = await query(server, domain, "CNAME");
	const addr = a.values?.[0] ?? cname.values?.[0] ?? null;
	if (addr) {
		apexAddress ??= addr;
		report("ok", label, `NS=${(ns.values ?? []).join(",") || "?"} | ${domain} → ${addr}`);
	} else {
		report("fail", label, `NS=${(ns.values ?? []).join(",") || "?"} | ${domain} 没有 A/CNAME（${a.error ?? cname.error}）`);
	}

	const wwwA = await query(server, `${domain}`, "A");
	const wwwC = await query(server, `www.${domain}`, "CNAME");
	const wwwAddr = wwwC.values?.[0] ?? null;
	if (wwwAddr) {
		wwwAddress ??= wwwAddr;
		report("ok", label, `www.${domain} → CNAME ${wwwAddr}`);
	} else {
		const wwwA2 = await query(server, `www.${domain}`, "A");
		if (wwwA2.values?.length) {
			wwwAddress ??= wwwA2.values[0];
			report("ok", label, `www.${domain} → ${wwwA2.values[0]}`);
		} else {
			report("warn", label, `www.${domain} 没有解析记录（${wwwC.error}），www 将打不开`);
		}
	}
	void wwwA;
}
summary.resolve = Boolean(apexAddress);

if (!apexAddress) {
	console.log("\n域名还没有生效，后面的 TLS / HTTP 检查跳过。NS 切换后通常 5 分钟到 2 小时生效。\n");
	process.exit(1);
}

// ── 2. TLS 证书 ───────────────────────────────────────────
const tlsRes = await tlsInfo(domain);
if (tlsRes.ok) {
	const cert = tlsRes.cert;
	const validTo = new Date(cert.valid_to);
	const days = Math.round((validTo.getTime() - Date.now()) / 86_400_000);
	const sanError = tls.checkServerIdentity(domain, cert);
	const issuer = cert.issuer?.O ?? cert.issuer?.CN ?? "?";
	const alpn = tlsRes.alpn === "h2" ? "HTTP/2" : (tlsRes.alpn ?? "HTTP/1.1");
	if (sanError) {
		report("fail", "TLS", `证书不覆盖 ${domain}：${sanError.message}（SAN: ${cert.subjectaltname ?? "无"}）`);
	} else {
		report("ok", "TLS", `${issuer} | ${tlsRes.protocol} | ${alpn} | 剩余 ${days} 天`);
	}
	if (days < 14) report("warn", "TLS", `证书 ${days} 天后过期，记得确认自动续签`);
	summary.tls = !sanError;
} else {
	report("fail", "TLS", `握手失败：${tlsRes.error}`);
}

// ── 3. HTTPS 页面 ─────────────────────────────────────────
const samples = [];
for (let i = 0; i < 3; i++) samples.push(await httpRequest(`https://${domain}/`));
const good = samples.filter((s) => s.ok);
if (!good.length) {
	report("fail", "HTTP", `首页打不开：${samples[0].error}`);
} else {
	const first = good[0];
	const ttfb = good.reduce((sum, s) => sum + (s.ttfb ?? s.total), 0) / good.length;
	const server = first.headers.server ?? "?";
	const title = first.body.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
	const canonical = first.body.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1];
	if (first.status === 200) {
		report("ok", "HTTP", `首页 200 | ${server} | TTFB 均值 ${ms(ttfb)} | ${(first.bytes / 1024).toFixed(0)} KB`);
		summary.http = true;
	} else {
		report("fail", "HTTP", `首页返回 ${first.status}（期望 200）`);
	}
	if (title) report(title.includes("Huaishuli") ? "ok" : "warn", "HTTP", `标题：${title}`);
	if (canonical) {
		report(canonical.includes(domain) ? "ok" : "warn", "HTTP", `canonical 指向 ${canonical}${canonical.includes(domain) ? "" : "（还没切 site_url）"}`);
	}
	if ((first.headers["cache-control"] ?? "").includes("immutable")) {
		report("warn", "缓存", `HTML 被标成 immutable：${first.headers["cache-control"]}，改内容后可能看不到更新`);
	}
}

// ── 4. 静态资源 ───────────────────────────────────────────
const assetPath = good[0]?.body.match(/["'](\/_astro\/[^"']+\.(?:js|css))["']/)?.[1];
if (assetPath) {
	const asset = await httpRequest(`https://${domain}${assetPath}`);
	if (asset.ok && asset.status === 200) {
		const cc = asset.headers["cache-control"] ?? "?";
		report(/max-age=\d{4,}/.test(cc) ? "ok" : "warn", "资源", `${assetPath} 200 | cache-control: ${cc}`);
	} else {
		report("fail", "资源", `${assetPath} 返回 ${asset.ok ? asset.status : asset.error}`);
	}
} else {
	report("warn", "资源", "首页里没找到 /_astro/ 资源，跳过");
}

// ── 5. robots / sitemap / 404 ─────────────────────────────
for (const [path, expect] of [
	["/robots.txt", 200],
	["/sitemap-index.xml", 200],
]) {
	const res = await httpRequest(`https://${domain}${path}`);
	report(res.ok && res.status === expect ? "ok" : "warn", "路径", `${path} → ${res.ok ? res.status : res.error}`);
	const hostLine = res.body?.match(/Sitemap:\s*(\S+)/i)?.[1];
	if (hostLine && !hostLine.includes(domain)) report("warn", "路径", `robots 里的 Sitemap 仍指向 ${hostLine}`);
}

const missing = await httpRequest(`https://${domain}/__verify_404_probe__/`);
if (missing.ok && missing.status === 404) {
	report("ok", "404", "未知路径返回 404（不是软 200），对 SEO 正确");
} else {
	report("warn", "404", `未知路径返回 ${missing.ok ? missing.status : missing.error}，建议在 EdgeOne 自定义错误页里回源 /404.html`);
}

// ── 6. 与源站对比 ─────────────────────────────────────────
if (summary.http) {
	const base = await httpRequest(`${origin}/`);
	if (base.ok) {
		const edgeTtfb = good.reduce((sum, s) => sum + (s.ttfb ?? s.total), 0) / good.length;
		const baseTtfb = base.ttfb ?? base.total;
		const ratio = edgeTtfb / baseTtfb;
		report("ok", "对比", `本机到 ${domain} ${ms(edgeTtfb)} vs ${originHost} ${ms(baseTtfb)}（${ratio.toFixed(2)}×）`);
	}
	void originHost;
}

const failures = results.filter((r) => r.level === "fail").length;
const warns = results.filter((r) => r.level === "warn").length;
console.log(`\n${failures === 0 ? "通过" : "未通过"}：${results.length - failures - warns} 项通过，${warns} 项可疑，${failures} 项失败。`);
if (summary.http) console.log(`提示：微信/QQ 内打开未备案域名可能被拦截提示，这是域名备案状态导致的，与解析无关。`);
console.log("");
process.exit(failures === 0 ? 0 : 1);
