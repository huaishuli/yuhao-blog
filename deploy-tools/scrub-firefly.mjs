import fs from "node:fs";
import path from "node:path";

const root = "D:/My_task_dsh/My-web_1/src";
const exts = [".ts", ".astro", ".svelte", ".md", ".mdx", ".css"];
const map = [
	["__fireflyLayoutInit", "__yuhaoLayoutInit"],
	["__fireflyHasAutoOpenedLyrics", "__yuhaoHasAutoOpenedLyrics"],
	["fireflyCachedSubtitle", "yuhaoCachedSubtitle"],
	["firefly:page:loaded", "yuhao:page:loaded"],
];

function walk(dir, out = []) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) walk(p, out);
		else if (exts.includes(path.extname(e.name))) out.push(p);
	}
	return out;
}

const changed = [];
for (const file of walk(root)) {
	let text = fs.readFileSync(file, "utf8");
	const before = text;
	for (const [from, to] of map) text = text.split(from).join(to);
	if (text !== before) {
		fs.writeFileSync(file, text, "utf8");
		changed.push(path.relative(root, file));
	}
}
console.log("changed:", changed.join(", ") || "(none)");

const left = [];
for (const file of walk(root)) {
	const text = fs.readFileSync(file, "utf8");
	text.split("\n").forEach((line, i) => {
		if (/firefly/i.test(line)) left.push(`${path.relative(root, file)}:${i + 1}: ${line.trim().slice(0, 110)}`);
	});
}
console.log("remaining lines:", left.length);
console.log(left.join("\n"));
