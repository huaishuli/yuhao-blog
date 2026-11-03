// 把已接入 Cloudflare 的域名绑定到 Worker（firefly）
// 用法: node bind-domain.mjs example.com [www.example.com]
// 前提: 域名已 Add a site 且 Zone 状态为 active
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const cfg = path.join(os.homedir(), "AppData", "Roaming", "xdg.config", ".wrangler", "config", "default.toml");
const toml = fs.readFileSync(cfg, "utf8");
const token = toml.match(/oauth_token = "([^"]+)"/)?.[1];
const account = toml.match(/account_id = "([^"]+)"/)?.[1] ?? "a724c05c7d938cb9360efb917dc73f1a";
if (!token) throw new Error("no oauth token in wrangler config");
const H = { Authorization: `Bearer ${token}`, "content-type": "application/json" };
const SERVICE = "firefly";

const hostnames = process.argv.slice(2);
if (!hostnames.length) {
	console.error("usage: node bind-domain.mjs <example.com> [www.example.com]");
	process.exit(1);
}

async function api(method, url, body) {
	const r = await fetch(`https://api.cloudflare.com/client/v4${url}`, {
		method,
		headers: H,
		body: body ? JSON.stringify(body) : undefined,
	});
	const text = await r.text();
	let json = null;
	try {
		json = JSON.parse(text);
	} catch {}
	return { status: r.status, json, text };
}

const zones = await api("GET", "/zones?per_page=50");
const list = zones.json?.result ?? [];
console.log("zones:", list.map((z) => `${z.name}(${z.status})`).join(", ") || "(none)");

for (const hostname of hostnames) {
	const apex = hostname.split(".").slice(-2).join(".");
	const zone = list.find((z) => z.name === apex || z.name === hostname) ?? list.find((z) => hostname.endsWith(`.${z.name}`));
	if (!zone) {
		console.log(`SKIP ${hostname}: no matching zone in this account (add the site to Cloudflare first)`);
		continue;
	}
	if (zone.status !== "active") {
		console.log(`SKIP ${hostname}: zone ${zone.name} status=${zone.status} (wait for nameserver activation)`);
		continue;
	}
	const res = await api("PUT", `/accounts/${account}/workers/domains/${hostname}`, {
		environment: "production",
		hostname,
		service: SERVICE,
		zone_id: zone.id,
		zone_name: zone.name,
	});
	console.log(`PUT ${hostname} ->`, res.status, res.json?.success ? "OK" : "FAILED", JSON.stringify(res.json?.result ?? res.json?.errors ?? res.text).slice(0, 300));
}

const after = await api("GET", `/accounts/${account}/workers/domains`);
console.log("\ncurrent custom domains:");
for (const d of after.json?.result ?? []) console.log("  -", d.hostname, "->", d.service, d.environment);
