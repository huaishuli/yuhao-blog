import http from "node:http";
import fs from "node:fs";
import path from "node:path";

// 以本文件所在目录为基准，指向仓库的 dist/，换机器也能用
const ROOT = path.resolve(import.meta.dirname, "..", "dist");
const PORT = Number(process.env.PORT ?? 8099);

const TYPES = {
	".html": "text/html; charset=utf-8",
	".htm": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".mjs": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".xml": "application/xml; charset=utf-8",
	".txt": "text/plain; charset=utf-8",
	".svg": "image/svg+xml",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".avif": "image/avif",
	".gif": "image/gif",
	".ico": "image/x-icon",
	".woff": "font/woff",
	".woff2": "font/woff2",
	".ttf": "font/ttf",
	".otf": "font/otf",
	".wasm": "application/wasm",
	".map": "application/json",
};

const server = http.createServer((req, res) => {
	const url = new URL(req.url, "http://localhost");
	let p = decodeURIComponent(url.pathname);
	if (p.endsWith("/")) p += "index.html";
	let file = path.join(ROOT, p);
	if (!file.startsWith(ROOT)) {
		res.writeHead(403).end("forbidden");
		return;
	}
	if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
	if (!fs.existsSync(file) && fs.existsSync(file + ".html")) file += ".html";
	if (!fs.existsSync(file)) {
		const notFound = path.join(ROOT, "404.html");
		res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
		res.end(fs.existsSync(notFound) ? fs.readFileSync(notFound) : "404");
		return;
	}
	res.writeHead(200, { "content-type": TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream" });
	fs.createReadStream(file).pipe(res);
});

server.listen(PORT, "127.0.0.1", () => console.log(`serving ${ROOT} at http://127.0.0.1:${PORT}/`));
