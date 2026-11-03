import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const cfg = path.join(os.homedir(), "AppData", "Roaming", "xdg.config", ".wrangler", "config", "default.toml");
const toml = fs.readFileSync(cfg, "utf8");
const token = toml.match(/oauth_token = "([^"]+)"/)?.[1];
if (!token) throw new Error("no oauth token");
const account = toml.match(/account_id = "([^"]+)"/)?.[1] ?? "a724c05c7d938cb9360efb917dc73f1a";
const H = { Authorization: `Bearer ${token}` };

async function get(url) {
	const r = await fetch(url, { headers: H });
	let body;
	try {
		body = await r.json();
	} catch {
		body = null;
	}
	return { status: r.status, body };
}

const script = await get(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/huaishuli`);
console.log("script:", script.status, "success:", script.body?.success, "id:", script.body?.result?.id, "modified:", script.body?.result?.modified_on);
if (script.body?.errors) console.log("errors:", JSON.stringify(script.body.errors));

const subs = await get(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/subdomain`);
console.log("workers.dev subdomain:", subs.status, subs.body?.result?.subdomain);

const zones = await get("https://api.cloudflare.com/client/v4/zones?per_page=50");
console.log("zones:", zones.status, zones.body?.success);
for (const z of zones.body?.result ?? []) console.log("  -", z.name, z.status, z.id);
if (zones.body?.errors) console.log("zone errors:", JSON.stringify(zones.body.errors));
