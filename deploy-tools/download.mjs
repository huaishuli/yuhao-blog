import fs from "node:fs";
const url = process.argv[2];
const out = process.argv[3];
const maxTries = 30;
let have = fs.existsSync(out) ? fs.statSync(out).size : 0;
console.log("start have", have);
for (let attempt = 1; attempt <= maxTries; attempt++) {
  try {
    const headers = have > 0 ? { Range: `bytes=${have}-` } : {};
    const r = await fetch(url, { headers, signal: AbortSignal.timeout(600000) });
    if (r.status !== 200 && r.status !== 206) throw new Error("HTTP " + r.status);
    const total = r.status === 206 ? have + Number(r.headers.get("content-length") || 0) : Number(r.headers.get("content-length") || 0);
    console.log(`attempt ${attempt} status ${r.status} total ${total}`);
    const f = fs.createWriteStream(out, { flags: r.status === 206 ? "a" : "w" });
    const reader = r.body.getReader();
    let last = Date.now(), lastBytes = have;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      await new Promise((res, rej) => f.write(Buffer.from(value), (e) => (e ? rej(e) : res())));
      have += value.length;
      if (Date.now() - last > 10000) {
        const kbs = (have - lastBytes) / 1024 / ((Date.now() - last) / 1000);
        console.log(`progress ${(have / 1048576).toFixed(2)}MB / ${(total / 1048576).toFixed(2)}MB ${kbs.toFixed(0)}KB/s`);
        last = Date.now(); lastBytes = have;
      }
    }
    await new Promise((res) => f.end(res));
    if (total && have < total) { console.log("incomplete, retrying"); continue; }
    console.log("DONE", have);
    process.exit(0);
  } catch (e) {
    console.log("attempt", attempt, "failed:", e.message);
    await new Promise((r) => setTimeout(r, 2000));
  }
}
console.log("GAVE UP", have);
process.exit(1);
