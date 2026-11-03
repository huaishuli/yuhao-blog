// Commit local files to GitHub through the REST API (git data API).
// Usage: GITHUB_TOKEN=... node gh-commit.mjs "commit message" <path> [<path> ...]
import fs from "node:fs";
import path from "node:path";

const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error("GITHUB_TOKEN missing");
const repo = process.env.GITHUB_REPO || "huaishuli/yuhao-blog";
const branch = process.env.GITHUB_BRANCH || "main";
const [message, ...files] = process.argv.slice(2);
if (!message || files.length === 0) throw new Error("usage: gh-commit.mjs <message> <file...>");

const api = async (method, url, body) => {
	const res = await fetch(`https://api.github.com/repos/${repo}${url}`, {
		method,
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/vnd.github+json",
			"X-GitHub-Api-Version": "2022-11-28",
			"User-Agent": "huaishuli-deploy-tool",
			...(body ? { "Content-Type": "application/json" } : {}),
		},
		body: body ? JSON.stringify(body) : undefined,
	});
	const text = await res.text();
	if (!res.ok) throw new Error(`${method} ${url} -> ${res.status} ${text.slice(0, 300)}`);
	return text ? JSON.parse(text) : null;
};

const ref = await api("GET", `/git/ref/heads/${branch}`);
const headSha = ref.object.sha;
const headCommit = await api("GET", `/git/commits/${headSha}`);
const baseTree = headCommit.tree.sha;

const entries = [];
for (const file of files) {
	const abs = path.resolve(file);
	if (!fs.existsSync(abs)) {
		entries.push({ path: file.replaceAll("\\", "/"), mode: "100644", type: "blob", sha: null });
		continue;
	}
	const content = fs.readFileSync(abs).toString("base64");
	const blob = await api("POST", "/git/blobs", { content, encoding: "base64" });
	entries.push({ path: file.replaceAll("\\", "/"), mode: "100644", type: "blob", sha: blob.sha });
	console.log("blob", file, blob.sha.slice(0, 8));
}

const tree = await api("POST", "/git/trees", { base_tree: baseTree, tree: entries });
const commit = await api("POST", "/git/commits", {
	message,
	tree: tree.sha,
	parents: [headSha],
});
await api("PATCH", `/git/refs/heads/${branch}`, { sha: commit.sha, force: false });
console.log("pushed commit", commit.sha.slice(0, 8), "files:", entries.length, "from head", headSha.slice(0, 8));
