import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const cfg = path.join(os.homedir(), "AppData", "Roaming", "xdg.config", ".wrangler", "config", "default.toml");
const toml = fs.readFileSync(cfg, "utf8");
const token = toml.match(/oauth_token = "([^"]+)"/)?.[1];
const account = toml.match(/account_id = "([^"]+)"/)?.[1] ?? "a724c05c7d938cb9360efb917dc73f1a";
if (!token) throw new Error("no oauth token");
const H = { Authorization: `Bearer ${token}` };

async function get(url) {
	const r = await fetch(url, { headers: H, signal: AbortSignal.timeout(20000) });
	const text = await r.text();
	let body = null;
	try {
		body = JSON.parse(text);
	} catch {}
	return { status: r.status, body, text };
}

const scripts = await get(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts`);
console.log("scripts:", scripts.status, scripts.body?.success);
for (const s of scripts.body?.result ?? []) console.log("  -", s.id, s.modified_on ?? "");

const dep = await get(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/firefly/deployments`);
console.log("\ndeployments:", dep.status, dep.body?.success);
if (dep.body?.result) {
	for (const d of dep.body.result.deployments ?? []) {
		console.log("  -", d.id, d.created_on, d.source ?? "");
		for (const v of d.versions ?? []) console.log("      version", v.version_id, (v.percentage ?? 100) + "%");
	}
}

const vers = await get(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/firefly/versions`);
console.log("\nversions:", vers.status, vers.body?.success);
for (const v of vers.body?.result?.items ?? []) console.log("  -", v.id, v.number, v.created_on, JSON.stringify(v.metadata?.bindings?.map((b) => b.type) ?? []));
