// Probe GitHub repo state: recent commits + content tree.
import process from "node:process";

const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPO || "huaishuli/yuhao-blog";
const api = async (url) => {
	const res = await fetch(`https://api.github.com/repos/${repo}${url}`, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/vnd.github+json",
			"User-Agent": "huaishuli-probe",
		},
	});
	if (!res.ok) throw new Error(`${url} -> ${res.status} ${await res.text()}`);
	return res.json();
};

const commits = await api("/commits?per_page=8");
console.log("=== recent commits on default branch");
for (const c of commits) console.log(c.sha.slice(0, 8), c.commit.author.date, JSON.stringify(c.commit.message.split("\n")[0]));

const tree = await api("/git/trees/main?recursive=1");
const paths = tree.tree.map((t) => t.path);
console.log("\n=== src/content entries");
for (const p of paths.filter((p) => p.startsWith("src/content/"))) console.log(p);
