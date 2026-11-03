// Sync the working tree to GitHub via the Git Data API.
// Used when `git push` is blocked (github.com:443 unreachable) but api.github.com works.
//
// Usage: node deploy-tools/gh-sync.mjs "commit message" [--dry]
// Requires env: GITHUB_TOKEN, GITHUB_REPO ("owner/name"). Branch defaults to main.

import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH ?? "main";

if (!TOKEN || !REPO) {
	console.error("Missing GITHUB_TOKEN or GITHUB_REPO");
	process.exit(1);
}

const argv = process.argv.slice(2);
const dry = argv.includes("--dry");
const message =
	argv.filter((a) => !a.startsWith("--")).join(" ").trim() ||
	"chore: sync working tree";

// Directories never pushed (mirrors .gitignore) and temporary build output.
const SKIP_DIRS = new Set([
	".git",
	"node_modules",
	"dist",
	".astro",
	".wrangler",
	".chrome-tmp",
	".idea",
	".vscode",
]);
const SKIP_FILES = [
	/^deploy-tools\/\.chrome-tmp\//,
	/^deploy-tools\/.*\.(png|log)$/,
	/^deploy-tools\/_/,
	/^deploy-tools\/\./,
	/^\.dev\.vars$/,
	/^\.git-askpass/,
];

const api = async (route, init = {}) => {
	const res = await fetch(`https://api.github.com${route}`, {
		...init,
		headers: {
			Authorization: `Bearer ${TOKEN}`,
			Accept: "application/vnd.github+json",
			"X-GitHub-Api-Version": "2022-11-28",
			"User-Agent": "huaishuli-gh-sync",
			...(init.headers ?? {}),
		},
	});
	if (!res.ok) {
		throw new Error(`${init.method ?? "GET"} ${route} -> ${res.status} ${await res.text()}`);
	}
	return res.json();
};

const blobSha = (buf) =>
	createHash("sha1")
		.update(`blob ${buf.length}\0`)
		.update(buf)
		.digest("hex");

async function walk(dir, base = "") {
	const out = [];
	for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
		const rel = base ? `${base}/${entry.name}` : entry.name;
		if (entry.isDirectory()) {
			if (SKIP_DIRS.has(entry.name)) continue;
			out.push(...(await walk(path.join(dir, entry.name), rel)));
			continue;
		}
		if (!entry.isFile()) continue;
		if (SKIP_FILES.some((re) => re.test(rel))) continue;
		out.push(rel);
	}
	return out;
}

const main = async () => {
	const ref = await api(`/repos/${REPO}/git/ref/heads/${BRANCH}`);
	const head = ref.object.sha;
	const commit = await api(`/repos/${REPO}/git/commits/${head}`);
	const baseTree = commit.tree.sha;
	const tree = await api(`/repos/${REPO}/git/trees/${baseTree}?recursive=1`);

	const remote = new Map();
	for (const e of tree.tree) {
		if (e.type === "blob") remote.set(e.path, e.sha);
	}

	const localPaths = await walk(ROOT);
	const local = new Map();
	for (const rel of localPaths) {
		const buf = await fs.readFile(path.join(ROOT, rel));
		local.set(rel, { sha: blobSha(buf), buf });
	}

	const changed = [];
	const deleted = [];
	for (const [rel, info] of local) {
		if (remote.get(rel) !== info.sha) changed.push({ path: rel, ...info });
	}
	for (const rel of remote.keys()) {
		if (!local.has(rel)) deleted.push(rel);
	}

	console.log(`head ${head.slice(0, 7)}: ${changed.length} add/update, ${deleted.length} delete`);
	for (const c of changed.slice(0, 40)) console.log(`  M ${c.path}`);
	if (changed.length > 40) console.log(`  ... ${changed.length - 40} more`);
	for (const d of deleted.slice(0, 40)) console.log(`  D ${d}`);
	if (deleted.length > 40) console.log(`  ... ${deleted.length - 40} more`);

	if (dry || (changed.length === 0 && deleted.length === 0)) return;

	const entries = [];
	const queue = [...changed];
	const workers = Array.from({ length: 6 }, async () => {
		while (queue.length) {
			const item = queue.shift();
			const blob = await api(`/repos/${REPO}/git/blobs`, {
				method: "POST",
				body: JSON.stringify({ content: item.buf.toString("base64"), encoding: "base64" }),
			});
			entries.push({ path: item.path, mode: "100644", type: "blob", sha: blob.sha });
		}
	});
	await Promise.all(workers);
	for (const rel of deleted) {
		entries.push({ path: rel, mode: "100644", type: "blob", sha: null });
	}

	const newTree = await api(`/repos/${REPO}/git/trees`, {
		method: "POST",
		body: JSON.stringify({ base_tree: baseTree, tree: entries }),
	});
	const newCommit = await api(`/repos/${REPO}/git/commits`, {
		method: "POST",
		body: JSON.stringify({ message, tree: newTree.sha, parents: [head] }),
	});
	await api(`/repos/${REPO}/git/refs/heads/${BRANCH}`, {
		method: "PATCH",
		body: JSON.stringify({ sha: newCommit.sha }),
	});
	console.log(`pushed ${newCommit.sha.slice(0, 7)} (${changed.length} files, ${deleted.length} deletions)`);
};

main().catch((err) => {
	console.error(err.message);
	process.exit(1);
});
