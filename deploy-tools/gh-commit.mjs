// Commit local files to GitHub through the REST API (git data API).
// Usage: GITHUB_TOKEN=... node gh-commit.mjs "commit message" <path> [<path> ...]
// Deleting: pass a path that no longer exists locally — it becomes a tree entry with sha:null.
//
// Why not fetch(): on some networks the keep-alive connection to api.github.com answers
// POST/PUT with a bare 500. Opening a fresh connection per request (Connection: close)
// and retrying transient 5xx fixes it.
import fs from "node:fs";
import https from "node:https";
import path from "node:path";

const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error("GITHUB_TOKEN missing");
const repo = process.env.GITHUB_REPO || "huaishuli/yuhao-blog";
const branch = process.env.GITHUB_BRANCH || "main";
const [message, ...files] = process.argv.slice(2);
if (!message || files.length === 0) throw new Error("usage: gh-commit.mjs <message> <file...>");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const request = (method, url, body) =>
	new Promise((resolve, reject) => {
		const data = body ? JSON.stringify(body) : undefined;
		const headers = {
			Authorization: `Bearer ${token}`,
			Accept: "application/vnd.github+json",
			"X-GitHub-Api-Version": "2022-11-28",
			"User-Agent": "huaishuli-deploy-tool",
			Connection: "close",
		};
		if (data) {
			headers["Content-Type"] = "application/json";
			headers["Content-Length"] = Buffer.byteLength(data);
		}
		const req = https.request(
			{ host: "api.github.com", path: `/repos/${repo}${url}`, method, headers },
			(res) => {
				let text = "";
				res.setEncoding("utf8");
				res.on("data", (chunk) => (text += chunk));
				res.on("end", () => {
					if (res.statusCode >= 200 && res.statusCode < 300) {
						resolve(text ? JSON.parse(text) : null);
					} else {
						reject(new Error(`${method} ${url} -> ${res.statusCode} ${text.slice(0, 300)}`));
					}
				});
			},
		);
		req.on("error", reject);
		req.setTimeout(60000, () => {
			req.destroy();
			reject(new Error(`timeout ${method} ${url}`));
		});
		if (data) req.write(data);
		req.end();
	});

const api = async (method, url, body, tries = 6) => {
	for (let attempt = 1; ; attempt++) {
		try {
			return await request(method, url, body);
		} catch (error) {
			const transient = /-> 5\d\d|timeout|ECONNRESET|socket hang up/.test(error.message);
			if (!transient || attempt >= tries) throw error;
			console.log(`retry ${attempt} ${method} ${url}: ${error.message.slice(0, 90)}`);
			await sleep(2500 * attempt);
		}
	}
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
		console.log("delete", file);
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
