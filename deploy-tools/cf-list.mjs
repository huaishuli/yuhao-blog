import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const cfg = path.join(os.homedir(), "AppData", "Roaming", "xdg.config", ".wrangler", "config", "default.toml");
const toml = fs.readFileSync(cfg, "utf8");
const token = toml.match(/oauth_token = "([^"]+)"/)?.[1];
if (!token) throw new Error("no oauth token");
const account = toml.match(/account_id = "([^"]+)"/)?.[1] ?? "a724c05c7d938cb9360efb917dc73f1a";

const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts`, {
	headers: { Authorization: `Bearer ${token}` },
});
const json = await res.json();
console.log("status", res.status, "success", json.success);
if (json.result) {
	for (const s of json.result) console.log(s.id, s.modified_on ?? "");
}
if (json.errors) console.log(JSON.stringify(json.errors));
