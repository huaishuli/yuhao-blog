// Survey Firefly branding occurrences across the repo.
import fs from "node:fs";
import path from "node:path";

const root = "D:/My_task_dsh/My-web_1";
const skipDirs = new Set(["node_modules", "dist", ".git", ".astro", "deploy-tools", ".wrangler"]);
const exts = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".astro", ".svelte", ".md", ".mdx", ".json", ".yml", ".yaml", ".css", ".html", ".toml", ".txt", ".svg", ".webmanifest", ".xml"]);
const pattern = /firefly|流萤/i;

function walk(dir, out = []) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) {
			if (skipDirs.has(e.name)) continue;
			walk(p, out);
		} else if (exts.has(path.extname(e.name).toLowerCase())) {
			out.push(p);
		}
	}
	return out;
}

const byTop = new Map();
const hits = [];
for (const file of walk(root)) {
	const rel = path.relative(root, file).replaceAll("\\", "/");
	const text = fs.readFileSync(file, "utf8");
	if (!pattern.test(text)) continue;
	const lines = text.split("\n");
	let count = 0;
	lines.forEach((line, i) => {
		if (pattern.test(line)) {
			count++;
			hits.push({ rel, line: i + 1, text: line.trim().slice(0, 140) });
		}
	});
	const top = rel.includes("/") ? rel.split("/")[0] : "(root)";
	byTop.set(top, (byTop.get(top) ?? 0) + count);
}

console.log("=== counts by top-level path ===");
for (const [k, v] of [...byTop.entries()].sort((a, b) => b[1] - a[1])) console.log(String(v).padStart(5), k);

console.log("\n=== files (non-content) ===");
const contentDirs = ["src/content/", "Firefly-Docs/", "docs/"];
for (const h of hits) {
	if (contentDirs.some((d) => h.rel.startsWith(d))) continue;
	console.log(`${h.rel}:${h.line}: ${h.text}`);
}

const contentCounts = new Map();
for (const h of hits) {
	if (!contentDirs.some((d) => h.rel.startsWith(d))) continue;
	contentCounts.set(h.rel, (contentCounts.get(h.rel) ?? 0) + 1);
}
console.log("\n=== content files ===");
for (const [k, v] of [...contentCounts.entries()].sort((a, b) => b[1] - a[1])) console.log(String(v).padStart(5), k);
