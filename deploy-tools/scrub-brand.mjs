// Mechanical branding renames: Firefly-specific technical identifiers -> Huaishuli.
import fs from "node:fs";

const read = (p) => fs.readFileSync(p, "utf8");
const write = (p, s) => fs.writeFileSync(p, s);
const sub = (p, from, to) => {
	const s = read(p);
	const n = s.split(from).join(to);
	if (n === s) {
		console.log("MISS", p, "|", from);
		return;
	}
	write(p, n);
	console.log("ok  ", p, "|", from.slice(0, 50));
};

// 1. rename the MDX UI barrel
if (fs.existsSync("src/components/firefly-mdx.ts")) {
	fs.renameSync("src/components/firefly-mdx.ts", "src/components/huaishuli-mdx.ts");
	console.log("renamed firefly-mdx.ts -> huaishuli-mdx.ts");
}
sub("src/components/huaishuli-mdx.ts", "// Firefly 专属 MDX 文章 UI 组件集合", "// 本站 MDX 文章 UI 组件集合");
sub("src/components/huaishuli-mdx.ts", "@/components/firefly-mdx", "@/components/huaishuli-mdx");
sub("src/components/common/Timeline.astro", "@/components/firefly-mdx", "@/components/huaishuli-mdx");
sub("src/astro-modules.d.ts", "firefly-mdx.ts", "huaishuli-mdx.ts");

// 2. CSS keyframes
sub("src/styles/waves.css", "firefly-waves-slide-up", "huaishuli-waves-slide-up");

// 3. build platform env override key
sub("src/utils/build-platform.ts", "FIREFLY_BUILD_PLATFORM", "HUAISHULI_BUILD_PLATFORM");

// 4. config comments pointing at the upstream demo API
sub("src/config/dynamicConfig.ts", "https://firefly.cuteleaf.cn/api/dynamic.json", "https://example.com/api/dynamic.json");
sub("src/types/dynamicConfig.ts", "https://firefly.cuteleaf.cn/api/dynamic.json", "https://example.com/api/dynamic.json");

// 5. twikoo stylesheet header
sub("public/assets/css/twikoo-custom.css", "Firefly 主题专用：https://github.com/CuteLeaf/Firefly", "本站 Twikoo 评论样式定制");

// 6. package name
sub("package.json", '"name": "firefly"', '"name": "huaishuli-blog"');

// 7. astro build ignore glob
sub("astro.config.mjs", '"**/Firefly-docs/**"', '"**/docs/**"');

// 8. github card cache: drop the upstream repo entry
const cardPath = "src/constants/github-card-data.json";
const cards = JSON.parse(read(cardPath));
const before = Object.keys(cards).length;
for (const key of Object.keys(cards)) {
	if (/cuteleaf|firefly/i.test(key) || /firefly/i.test(JSON.stringify(cards[key]))) delete cards[key];
}
write(cardPath, JSON.stringify(cards, null, "\t") + "\n");
console.log("github cards", before, "->", Object.keys(cards).length);

// 9. lqips: drop stale keys (regenerated during build)
const lqipsPath = "src/constants/lqips.json";
if (fs.existsSync(lqipsPath)) {
	const lqips = JSON.parse(read(lqipsPath));
	const beforeCount = Object.keys(lqips).length;
	for (const key of Object.keys(lqips)) {
		const rel = key.replace(/^(src:|public:)/, "");
		const full = key.startsWith("src:") ? `src/${rel}` : `public/${rel}`;
		if (!fs.existsSync(full)) delete lqips[key];
	}
	write(lqipsPath, JSON.stringify(lqips, null, "\t") + "\n");
	console.log("lqips", beforeCount, "->", Object.keys(lqips).length);
}
