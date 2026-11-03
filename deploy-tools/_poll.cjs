const fs = require("fs"), path = require("path");
const toml = fs.readFileSync(path.join(process.env.APPDATA, "xdg.config", ".wrangler", "config", "default.toml"), "utf8");
const tok = (toml.match(/oauth_token\s*=\s*"([^"]+)"/) || [])[1];
const acc = "a724c05c7d938cb9360efb917dc73f1a";
const target = "f66657b";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  for (let i = 0; i < 60; i++) {
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acc}/pages/projects/huaishuli/deployments?per_page=5`, { headers: { Authorization: `Bearer ${tok}` } });
    const j = await r.json();
    const d = (j.result || []).find((x) => (x.deployment_trigger?.metadata?.commit_hash || "").startsWith(target));
    if (d) {
      const st = d.latest_stage || {};
      console.log(`[${new Date().toISOString()}] ${d.id.slice(0,8)} stage=${st.name}/${st.status}`);
      if (st.status === "success" || st.status === "failure" || st.status === "canceled") break;
    } else console.log("deployment for", target, "not found yet");
    await sleep(30000);
  }
  const res = await fetch("https://huaishuli.pages.dev/?cachebust=" + Date.now());
  const html = await res.text();
  console.log("LIVE", res.status, html.length);
  console.log("title:", (html.match(/<title>(.*?)<\/title>/) || [])[1]);
  for (const kw of ["Firefly", "firefly", "流萤", "你好，Huaishuli", "Huaishuli"]) {
    const n = (html.match(new RegExp(kw, "g")) || []).length;
    console.log(kw, "->", n);
  }
})();
