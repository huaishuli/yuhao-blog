#!/usr/bin/env node
// EdgeOne（TEO）命令行工具：TC3-HMAC-SHA256 签名 + 常用动作，零依赖（Node 18+ 自带 fetch）。
//
// 凭证从环境变量读：
//   $env:TENCENTCLOUD_SECRET_ID  = "AKID..."
//   $env:TENCENTCLOUD_SECRET_KEY = "..."
// 可选：$env:TENCENTCLOUD_REGION（默认空，TEO 不需要 Region）、$env:TEO_ENDPOINT（默认国内站 teo.tencentcloudapi.com）
//
// 用法：
//   node deploy-tools/teo.mjs plans                                 列出套餐（找免费版的 PlanId）
//   node deploy-tools/teo.mjs zones                                 列出站点
//   node deploy-tools/teo.mjs create-zone yuhaohuaishuli.cn         建站点（默认 NS 接入 + 境外加速区）
//   node deploy-tools/teo.mjs create-zone yuhaohuaishuli.cn --plan edgeone-xxx
//   node deploy-tools/teo.mjs domains zone-xxx                      列出加速域名
//   node deploy-tools/teo.mjs add-domain zone-xxx yuhaohuaishuli.cn --origin huaishuli.pages.dev
//   node deploy-tools/teo.mjs call DescribeZones '{}'               直接调任意 Action
//
// 所有输出都是 API 原始 JSON 的精简版，出错时打印完整错误。

import crypto from "node:crypto";

const API_VERSION = process.env.TC_VERSION ?? "2022-09-01";
const SERVICE = process.env.TC_SERVICE ?? "teo";
const ENDPOINT = process.env.TEO_ENDPOINT ?? `${SERVICE}.tencentcloudapi.com`;
const REGION = process.env.TENCENTCLOUD_REGION ?? "";
const SECRET_ID = process.env.TENCENTCLOUD_SECRET_ID ?? "";
const SECRET_KEY = process.env.TENCENTCLOUD_SECRET_KEY ?? "";

const sha256 = (s) => crypto.createHash("sha256").update(s, "utf8").digest("hex");
const hmac = (key, s) => crypto.createHmac("sha256", key).update(s, "utf8").digest();

/** TC3-HMAC-SHA256 签名并调用 JSON API。 */
async function call(action, payload = {}) {
	if (!SECRET_ID || !SECRET_KEY) {
		throw new Error("缺少凭证：请设置 TENCENTCLOUD_SECRET_ID / TENCENTCLOUD_SECRET_KEY");
	}
	const body = JSON.stringify(payload);
	const timestamp = Math.floor(Date.now() / 1000);
	const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
	const contentType = "application/json; charset=utf-8";

	// 1. 规范请求串：POST + "/" + 空查询串 + 参与签名的头 + 签名头列表 + body 哈希
	const signedHeaders = "content-type;host";
	const canonicalHeaders = `content-type:${contentType}\nhost:${ENDPOINT}\n`;
	const canonicalRequest = ["POST", "/", "", canonicalHeaders, signedHeaders, sha256(body)].join("\n");

	// 2. 待签名字符串
	const credentialScope = `${date}/${SERVICE}/tc3_request`;
	const stringToSign = ["TC3-HMAC-SHA256", String(timestamp), credentialScope, sha256(canonicalRequest)].join("\n");

	// 3. 逐层派生签名密钥
	const secretDate = hmac(`TC3${SECRET_KEY}`, date);
	const secretService = hmac(secretDate, SERVICE);
	const secretSigning = hmac(secretService, "tc3_request");
	const signature = crypto.createHmac("sha256", secretSigning).update(stringToSign, "utf8").digest("hex");

	const authorization =
		`TC3-HMAC-SHA256 Credential=${SECRET_ID}/${credentialScope}, ` +
		`SignedHeaders=${signedHeaders}, Signature=${signature}`;

	const headers = {
		Authorization: authorization,
		"Content-Type": contentType,
		Host: ENDPOINT,
		"X-TC-Action": action,
		"X-TC-Timestamp": String(timestamp),
		"X-TC-Version": API_VERSION,
	};
	if (REGION) headers["X-TC-Region"] = REGION;

	const res = await fetch(`https://${ENDPOINT}/`, { method: "POST", headers, body });
	const text = await res.text();
	let json;
	try {
		json = JSON.parse(text);
	} catch {
		throw new Error(`HTTP ${res.status} 返回的不是 JSON：${text.slice(0, 500)}`);
	}
	const response = json.Response ?? {};
	if (response.Error) {
		const err = new Error(`${action} 失败：${response.Error.Code} — ${response.Error.Message}`);
		err.code = response.Error.Code;
		err.requestId = response.RequestId;
		throw err;
	}
	return response;
}

function print(value) {
	console.log(JSON.stringify(value, null, 2));
}

const argv = process.argv.slice(2);
const flags = {};
const positionals = [];
for (let i = 0; i < argv.length; i++) {
	const token = argv[i];
	if (token.startsWith("--")) {
		const next = argv[i + 1];
		if (next && !next.startsWith("--")) {
			flags[token.slice(2)] = next;
			i++;
		} else {
			flags[token.slice(2)] = true;
		}
	} else {
		positionals.push(token);
	}
}

function arg(name, fallback = undefined) {
	return flags[name] === undefined ? fallback : flags[name];
}

async function findPlanId(explicit) {
	if (explicit) return explicit;
	const res = await call("DescribePlans", { Limit: 20, Offset: 0 });
	const plans = res.Plans ?? [];
	const usable = plans.filter((p) => (p.Status ?? "").toLowerCase() !== "expired");
	if (!usable.length) {
		console.error("账号下没有套餐。免费版需要先在控制台「领取」一次（edgeone.ai 上的免费套餐活动），领完再跑本命令。");
		process.exit(2);
	}
	const free = usable.find((p) => /free|basic|试用/i.test(`${p.PlanType ?? ""}${p.PlanName ?? ""}`)) ?? usable[0];
	console.error(`使用套餐 ${free.PlanId}（${free.PlanName ?? free.PlanType ?? "?"}，状态 ${free.Status ?? "?"}）`);
	return free.PlanId;
}

const [command, ...rest] = positionals;

try {
	switch (command) {
		case "plans": {
			const res = await call("DescribePlans", { Limit: 20, Offset: 0 });
			print(
				(res.Plans ?? []).map((p) => ({
					PlanId: p.PlanId,
					PlanName: p.PlanName ?? p.PlanType,
					Status: p.Status,
					Area: p.Area,
					ZoneNumber: p.ZoneNumber,
				})),
			);
			break;
		}
		case "zones": {
			const res = await call("DescribeZones", { Limit: 50, Offset: 0 });
			print(
				(res.Zones ?? []).map((z) => ({
					ZoneId: z.ZoneId,
					ZoneName: z.ZoneName,
					Type: z.Type,
					Area: z.Area,
					Status: z.Status,
					PlanId: z.PlanId,
					CreatedOn: z.CreatedOn,
					NameServers: z.NameServers,
				})),
			);
			break;
		}
		case "create-zone": {
			const zoneName = rest[0];
			if (!zoneName) throw new Error("用法：create-zone <apex域名> [--type full|partial] [--area overseas|global|mainland] [--plan edgeone-xxx]");
			const payload = {
				ZoneName: zoneName,
				Type: arg("type", "full"),
				Area: arg("area", "overseas"),
				PlanId: await findPlanId(arg("plan", process.env.TEO_PLAN_ID)),
			};
			const res = await call("CreateZone", payload);
			print({ ZoneId: res.ZoneId, OwnershipVerification: res.OwnershipVerification });
			break;
		}
		case "domains": {
			const zoneId = rest[0];
			if (!zoneId) throw new Error("用法：domains <zoneId>");
			const res = await call("DescribeAccelerationDomains", { ZoneId: zoneId, Limit: 50, Offset: 0 });
			print(
				(res.AccelerationDomains ?? []).map((d) => ({
					DomainName: d.DomainName,
					Cname: d.Cname,
					Status: d.DomainStatus,
					Origin: d.OriginDetail,
				})),
			);
			break;
		}
		case "add-domain": {
			const [zoneId, domainName] = rest;
			if (!zoneId || !domainName) {
				throw new Error("用法：add-domain <zoneId> <加速域名> [--origin huaishuli.pages.dev] [--protocol HTTPS]");
			}
			const res = await call("CreateAccelerationDomain", {
				ZoneId: zoneId,
				DomainName: domainName,
				OriginInfo: { OriginType: "IP_DOMAIN", Origin: arg("origin", "huaishuli.pages.dev") },
				OriginProtocol: arg("protocol", "HTTPS"),
				HttpsOriginPort: Number(arg("port", "443")),
			});
			print(res);
			break;
		}
		case "call": {
			const action = rest[0];
			if (!action) throw new Error("用法：call <Action> [json]，json 省略时读环境变量 TEO_PAYLOAD");
			const raw = rest[1] ?? process.env.TEO_PAYLOAD ?? "{}";
			print(await call(action, JSON.parse(raw)));
			break;
		}
		default:
			console.error("命令：plans | zones | create-zone | domains | add-domain | call");
			process.exit(2);
	}
} catch (e) {
	console.error(`\n${e.message}`);
	if (e.requestId) console.error(`RequestId: ${e.requestId}`);
	process.exit(1);
}
