
// 部署完成后访问 /sub 获取订阅，访问 /admin 管理订阅内容

let BotToken = ''; //可以为空，或者@BotFather中输入/start，/newbot，并关注机器人
let ChatID = ''; //可以为空，或者@userinfobot中获取，/start
let TG = 0; //小白勿动， 开发者专用，1 为推送所有的访问信息，0 为不推送订阅转换后端的访问信息与异常访问
let FileName = 'CF-Workers-SUB';
let SUBUpdateTime = 6; //自定义订阅更新时间，单位小时
let total = 99;//TB
let timestamp = 4102329600000;//2099-12-31

//节点链接 + 订阅链接
let MainData = `
https://cfxr.eu.org/getSub
`;

let urls = [];
let subConverter = "SUBAPI.cmliussss.net"; //在线订阅转换后端。仅当设置了环境变量 SUBAPI 时才会使用远程后端；未设置 SUBAPI 时默认使用内置的本地 JS 订阅转换器（仅支持 Clash 格式）。
let subConfig = "https://raw.githubusercontent.com/lwtdzh/lwt-subcollection/master/LWT_Custom_Rule.ini"; //订阅配置文件
let subProtocol = 'https';
let useLocalConverter = false; //true 表示使用内置本地订阅转换器（未设置 SUBAPI 时），false 表示使用远程订阅转换后端

export default {
	async fetch(request, env) {
		const userAgentHeader = request.headers.get('User-Agent');
		const userAgent = userAgentHeader ? userAgentHeader.toLowerCase() : "null";
		const url = new URL(request.url);
		const pathname = normalizePath(url.pathname);
		BotToken = env.TGTOKEN || BotToken;
		ChatID = env.TGID || ChatID;
		TG = env.TG || TG;
		useLocalConverter = !env.SUBAPI; // 未设置 SUBAPI 时启用本地转换器
		subConverter = env.SUBAPI || subConverter;
		if (subConverter.includes("http://")) {
			subConverter = subConverter.split("//")[1];
			subProtocol = 'http';
		} else {
			subConverter = subConverter.split("//")[1] || subConverter;
		}
		subConfig = env.SUBCONFIG || subConfig;
		FileName = env.SUBNAME || FileName;

		const currentDate = new Date();
		currentDate.setHours(0, 0, 0, 0);
		const timeTemp = Math.ceil(currentDate.getTime() / 1000);
		const fakeToken = await MD5MD5(`${env.ADMIN_PWD || "sub"}${timeTemp}`);
		const token = url.searchParams.get('token');

		let UD = Math.floor(((timestamp - Date.now()) / timestamp * total * 1099511627776) / 2);
		total = total * 1099511627776;
		let expire = Math.floor(timestamp / 1000);
		SUBUpdateTime = env.SUBUPTIME || SUBUpdateTime;

		if (pathname === "/") {
			return new Response(await homePage(), {
				status: 200,
				headers: {
					'Content-Type': 'text/html; charset=UTF-8',
				},
			});
		}

		if (pathname === "/admin") {
			const authResponse = authorizeAdmin(request, env);
			if (authResponse) return authResponse;
			if (env.KV) await 迁移地址列表(env, 'LINK.txt');
			await sendMessage(`#编辑订阅 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgentHeader}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
			return await KV(request, env, 'LINK.txt');
		}

		if (pathname !== "/sub") {
			if (TG == 1 && url.pathname !== "/" && url.pathname !== "/favicon.ico") await sendMessage(`#异常访问 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgent}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
			return new Response("Not found", {
				status: 404,
				headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
			});
		}

		if (!["GET", "HEAD"].includes(request.method)) {
			return new Response("Method not allowed", {
				status: 405,
				headers: { 'Allow': 'GET, HEAD' },
			});
		}

		if (env.KV) {
			await 迁移地址列表(env, 'LINK.txt');
			MainData = await env.KV.get('LINK.txt') || MainData;
		} else {
			MainData = env.LINK || MainData;
			if (env.LINKSUB) urls = await ADD(env.LINKSUB);
		}
			let 重新汇总所有链接 = await ADD(MainData + '\n' + urls.join('\n'));
			let 自建节点 = "";
			let 订阅链接 = "";
			let 订阅前缀映射 = {};	// 订阅链接 -> 名称前缀
			let 所有前缀 = [];	// 所有出现过的前缀（本地转换放置国旗 emoji 时用：前缀在最前，emoji 紧随其后）
			for (let x of 重新汇总所有链接) {
				const { link, prefix } = 解析前缀标记(x);
				if (!link) continue;
				if (prefix) 所有前缀.push(prefix);
				if (link.toLowerCase().startsWith('http')) {
					订阅链接 += link + '\n';
					if (prefix) 订阅前缀映射[link] = prefix;
				} else {
					自建节点 += 添加节点名称前缀(link, prefix) + '\n';
				}
			}
			MainData = 自建节点;
			urls = await ADD(订阅链接);
			await sendMessage(`#获取订阅 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgentHeader}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
			const isSubConverterRequest = request.headers.get('subconverter-request') || request.headers.get('subconverter-version') || userAgent.includes('subconverter');
			let 订阅格式 = 'base64';
			if (url.searchParams.has('b64') || url.searchParams.has('base64') || token == fakeToken) {
				订阅格式 = 'base64';
			} else if (url.searchParams.has('clash')) {
				订阅格式 = 'clash';
			} else if (url.searchParams.has('singbox') || url.searchParams.has('sb')) {
				订阅格式 = 'singbox';
			} else if (url.searchParams.has('surge')) {
				订阅格式 = 'surge';
			} else if (url.searchParams.has('quanx')) {
				订阅格式 = 'quanx';
			} else if (url.searchParams.has('loon')) {
				订阅格式 = 'loon';
			} else if (!(userAgent.includes('null') || isSubConverterRequest || userAgent.includes('nekobox') || userAgent.includes(('CF-Workers-SUB').toLowerCase()))) {
				if (userAgent.includes('sing-box') || userAgent.includes('singbox')) {
					订阅格式 = 'singbox';
				} else if (userAgent.includes('surge')) {
					订阅格式 = 'surge';
				} else if (userAgent.includes('quantumult')) {
					订阅格式 = 'quanx';
				} else if (userAgent.includes('loon')) {
					订阅格式 = 'loon';
				} else if (userAgent.includes('clash') || userAgent.includes('meta') || userAgent.includes('mihomo')) {
					订阅格式 = 'clash';
				}
			}

			let subConverterUrl;
			let 订阅转换URL = `${url.origin}/sub?token=${fakeToken}`;
			//console.log(订阅转换URL);
			let req_data = MainData;

			let 追加UA = 'v2rayn';
			if (url.searchParams.has('b64') || url.searchParams.has('base64')) 订阅格式 = 'base64';
			else if (url.searchParams.has('clash')) 追加UA = 'clash';
			else if (url.searchParams.has('singbox') || url.searchParams.has('sb')) 追加UA = 'singbox';
			else if (url.searchParams.has('surge')) 追加UA = 'surge';
			else if (url.searchParams.has('quanx')) 追加UA = 'Quantumult%20X';
			else if (url.searchParams.has('loon')) 追加UA = 'Loon';

			const 订阅链接数组 = [...new Set(urls)].filter(item => item?.trim?.()); // 去重
			if (订阅链接数组.length > 0) {
				const 请求订阅响应内容 = await getSUB(订阅链接数组, request, 追加UA, userAgentHeader, 订阅前缀映射);
				console.log(请求订阅响应内容);
				req_data += 请求订阅响应内容[0].join('\n');
				订阅转换URL += "|" + 请求订阅响应内容[1];
				if (订阅格式 == 'base64' && !isSubConverterRequest && !useLocalConverter && 请求订阅响应内容[1].includes('://')) {
					subConverterUrl = `${subProtocol}://${subConverter}/sub?target=mixed&url=${encodeURIComponent(请求订阅响应内容[1])}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
					try {
						const subConverterResponse = await fetch(subConverterUrl, { headers: { 'User-Agent': 'v2rayN/CF-Workers-SUB  (https://github.com/cmliu/CF-Workers-SUB)' } });
						if (subConverterResponse.ok) {
							const subConverterContent = await subConverterResponse.text();
							req_data += '\n' + atob(subConverterContent);
						}
					} catch (error) {
						console.log('订阅转换请回base64失败，检查订阅转换后端是否正常运行');
					}
				}
			}

			if (env.WARP) 订阅转换URL += "|" + (await ADD(env.WARP)).join("|");
			//修复中文错误
			const utf8Encoder = new TextEncoder();
			const encodedData = utf8Encoder.encode(req_data);
			//const text = String.fromCharCode.apply(null, encodedData);
			const utf8Decoder = new TextDecoder();
			const text = utf8Decoder.decode(encodedData);

			//去重
			const uniqueLines = new Set(text.split('\n'));
			const result = [...uniqueLines].join('\n');
			//console.log(result);

			let base64Data;
			try {
				base64Data = btoa(result);
			} catch (e) {
				function encodeBase64(data) {
					const binary = new TextEncoder().encode(data);
					let base64 = '';
					const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

					for (let i = 0; i < binary.length; i += 3) {
						const byte1 = binary[i];
						const byte2 = binary[i + 1] || 0;
						const byte3 = binary[i + 2] || 0;

						base64 += chars[byte1 >> 2];
						base64 += chars[((byte1 & 3) << 4) | (byte2 >> 4)];
						base64 += chars[((byte2 & 15) << 2) | (byte3 >> 6)];
						base64 += chars[byte3 & 63];
					}

					const padding = 3 - (binary.length % 3 || 3);
					return base64.slice(0, base64.length - padding) + '=='.slice(0, padding);
				}

				base64Data = encodeBase64(result)
			}

			// 构建响应头对象
			const responseHeaders = {
				"content-type": "text/plain; charset=utf-8",
				"Profile-Update-Interval": `${SUBUpdateTime}`,
				"Profile-web-page-url": request.url.includes('?') ? request.url.split('?')[0] : request.url,
				//"Subscription-Userinfo": `upload=${UD}; download=${UD}; total=${total}; expire=${expire}`,
			};

			if (订阅格式 == 'base64' || token == fakeToken) {
				return new Response(base64Data, { headers: responseHeaders });
			}

			// 未设置 SUBAPI：使用内置本地订阅转换器（支持 clash / singbox / surge / quanx / loon）
			if (useLocalConverter) {
				const 本地支持格式 = ['clash', 'singbox', 'surge', 'quanx', 'loon'];
				if (!本地支持格式.includes(订阅格式)) {
					return new Response(`本地订阅转换器暂不支持 ${订阅格式} 格式。\n如需该格式，请在 Cloudflare Pages 环境变量中设置 SUBAPI 指向远程订阅转换后端。`, { status: 400, headers: { "Content-Type": "text/plain;charset=utf-8" } });
				}
				try {
					// 订阅转换URL 形如 "<自身token链接>|<直链1>|<直链2>..."，去掉首个自身链接后即为需要额外抓取的订阅/节点直链
					const passthroughLinks = 订阅转换URL.split('|').slice(1).filter(item => item && item.trim());
					let localContent = await localSubconvert(订阅格式, result, passthroughLinks, subConfig, userAgentHeader, 订阅前缀映射, 所有前缀);
					if (订阅格式 == 'clash') localContent = await clashFix(localContent);
					if (!userAgent.includes('mozilla')) responseHeaders["Content-Disposition"] = `attachment; filename*=utf-8''${encodeURIComponent(FileName)}`;
					return new Response(localContent, { headers: responseHeaders });
				} catch (error) {
					console.error('本地订阅转换失败:', error);
					return new Response(`本地订阅转换失败: ${error && error.message ? error.message : error}`, { status: 502, headers: { "Content-Type": "text/plain;charset=utf-8" } });
				}
			}

			if (订阅格式 == 'clash') {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=clash&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
			} else if (订阅格式 == 'singbox') {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=singbox&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
			} else if (订阅格式 == 'surge') {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=surge&ver=4&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
			} else if (订阅格式 == 'quanx') {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=quanx&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&udp=true`;
			} else if (订阅格式 == 'loon') {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=loon&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false`;
			}
			//console.log(订阅转换URL);
			try {
				const subConverterResponse = await fetch(subConverterUrl, { headers: { 'User-Agent': userAgentHeader } });//订阅转换
				if (!subConverterResponse.ok) return new Response(base64Data, { headers: responseHeaders });
				let subConverterContent = await subConverterResponse.text();
				if (订阅格式 == 'clash') subConverterContent = await clashFix(subConverterContent);
				// 只有非浏览器订阅才会返回SUBNAME
				if (!userAgent.includes('mozilla')) responseHeaders["Content-Disposition"] = `attachment; filename*=utf-8''${encodeURIComponent(FileName)}`;
				return new Response(subConverterContent, { headers: responseHeaders });
			} catch (error) {
				return new Response(base64Data, { headers: responseHeaders });
			}
	}
};

function normalizePath(pathname) {
	const normalizedPathname = pathname.replace(/\/+$/g, '');
	return normalizedPathname || "/";
}

function authorizeAdmin(request, env) {
	const adminPassword = env.ADMIN_PWD || "";
	if (!adminPassword) {
		return new Response("ADMIN_PWD is not configured", {
			status: 500,
			headers: { "Content-Type": "text/plain; charset=UTF-8" },
		});
	}

	const authorization = request.headers.get("Authorization") || "";
	if (authorization.startsWith("Basic ")) {
		try {
			const credentials = atob(authorization.slice(6));
			const password = credentials.includes(":") ? credentials.slice(credentials.indexOf(":") + 1) : credentials;
			if (password === adminPassword) return null;
		} catch (error) {
			console.log("Invalid admin authorization header");
		}
	}

	return new Response("Unauthorized", {
		status: 401,
		headers: {
			"Content-Type": "text/plain; charset=UTF-8",
			"WWW-Authenticate": 'Basic realm="Admin", charset="UTF-8"',
		},
	});
}

async function ADD(envadd) {
	var addtext = envadd.replace(/[	"'|\r\n]+/g, '\n').replace(/\n+/g, '\n');	// 替换为换行
	//console.log(addtext);
	if (addtext.charAt(0) == '\n') addtext = addtext.slice(1);
	if (addtext.charAt(addtext.length - 1) == '\n') addtext = addtext.slice(0, addtext.length - 1);
	const add = addtext.split('\n');
	//console.log(add);
	return add;
}

// 解析行首的 #前缀# 标记，返回去除标记后的链接与前缀
// 例如: "#ppp#vless://xxx#香港" -> { prefix: "ppp", link: "vless://xxx#香港" }
//      "#ppp#https://sub.example.com" -> { prefix: "ppp", link: "https://sub.example.com" }
// 所有节点/订阅链接均以 scheme 开头（vless:// 、http:// 等），不会以 # 开头，
// 因此行首的 #...# 可以无歧义地作为前缀标记（只消费第一对 #，节点自身的 #名称 片段保留）
function 解析前缀标记(line) {
	const trimmed = (line || '').trim();
	if (trimmed.startsWith('#')) {
		const end = trimmed.indexOf('#', 1);
		if (end !== -1) {
			return {
				prefix: trimmed.slice(1, end),
				link: trimmed.slice(end + 1).trim()
			};
		}
	}
	return { link: trimmed, prefix: '' };
}

// 给单个节点链接的名称添加前缀，例如名称 abc 加前缀 ppp 后为 pppabc
function 添加节点名称前缀(nodeLink, prefix) {
	if (!prefix) return nodeLink;
	const link = (nodeLink || '').trim();
	if (!link) return link;
	// vmess 节点名称保存在 base64 编码的 JSON 的 ps 字段中
	if (link.toLowerCase().startsWith('vmess://')) {
		try {
			const config = JSON.parse(base64Decode(link.slice('vmess://'.length)));
			config.ps = prefix + (config.ps || '');
			return 'vmess://' + btoa(unescape(encodeURIComponent(JSON.stringify(config))));
		} catch (e) {
			return link;
		}
	}
	// 其余节点（vless/trojan/ss 等）名称位于 # 片段
	const hashIndex = link.indexOf('#');
	if (hashIndex === -1) {
		// 该节点没有名称，直接以前缀作为名称
		return link + '#' + prefix;
	}
	return link.slice(0, hashIndex + 1) + prefix + link.slice(hashIndex + 1);
}

// 给订阅内容中的每个节点名称添加前缀
function 应用订阅前缀(content, prefix) {
	if (!prefix || !content) return content;
	return content.split('\n').map(line => {
		if (line.includes('://')) return 添加节点名称前缀(line.trim(), prefix);
		return line;
	}).join('\n');
}

async function homePage() {
	const text = `
	<!DOCTYPE html>
	<html lang="zh-CN">
	<head>
	<title>请遵守网络法律法规</title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<style>
		:root {
			color-scheme: light;
			--bg: #f6f7fb;
			--panel: #ffffff;
			--ink: #18202f;
			--muted: #5c667a;
			--danger: #d82929;
			--line: #dfe4ef;
		}
		* {
			box-sizing: border-box;
		}
		body {
			margin: 0;
			min-height: 100vh;
			background:
				radial-gradient(circle at top left, rgba(216, 41, 41, 0.14), transparent 32rem),
				linear-gradient(135deg, #f8fafc 0%, var(--bg) 48%, #edf1f7 100%);
			color: var(--ink);
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
			line-height: 1.6;
		}
		main {
			width: min(1080px, calc(100% - 32px));
			margin: 0 auto;
			padding: 48px 0;
		}
		.hero {
			display: grid;
			grid-template-columns: 160px 1fr;
			gap: 32px;
			align-items: center;
			padding: 40px;
			background: rgba(255, 255, 255, 0.88);
			border: 1px solid var(--line);
			border-radius: 8px;
			box-shadow: 0 24px 70px rgba(24, 32, 47, 0.10);
		}
		.mark {
			width: 148px;
			height: 148px;
			border-radius: 50%;
			display: grid;
			place-items: center;
			background: var(--danger);
			color: #fff;
			font-size: 112px;
			font-weight: 900;
			line-height: 1;
			box-shadow: 0 14px 32px rgba(216, 41, 41, 0.28);
		}
		h1 {
			margin: 0;
			font-size: clamp(30px, 5vw, 64px);
			line-height: 1.08;
			letter-spacing: 0;
		}
		.subtitle {
			margin: 18px 0 0;
			font-size: 22px;
			color: var(--danger);
			font-weight: 700;
		}
		.theme {
			margin: 10px 0 0;
			color: var(--muted);
			font-size: 17px;
		}
		.grid {
			display: grid;
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 18px;
			margin-top: 24px;
		}
		.card {
			background: var(--panel);
			border: 1px solid var(--line);
			border-radius: 8px;
			padding: 22px;
			box-shadow: 0 12px 30px rgba(24, 32, 47, 0.06);
		}
		.card h2 {
			margin: 0 0 10px;
			font-size: 18px;
			line-height: 1.35;
		}
		.card p {
			margin: 0;
			color: var(--muted);
			font-size: 15px;
		}
		.card a {
			display: inline-block;
			margin-top: 14px;
			color: var(--danger);
			font-weight: 700;
			text-decoration: none;
		}
		.notice {
			margin-top: 24px;
			padding: 18px 22px;
			border-left: 5px solid var(--danger);
			background: #fff7f7;
			color: #5a1a1a;
			border-radius: 6px;
		}
		@media (max-width: 760px) {
			main {
				padding: 24px 0;
			}
			.hero {
				grid-template-columns: 1fr;
				padding: 28px;
			}
			.mark {
				width: 112px;
				height: 112px;
				font-size: 84px;
			}
			.grid {
				grid-template-columns: 1fr;
			}
		}
	</style>
	</head>
	<body>
	<main>
		<section class="hero">
			<div class="mark">!</div>
			<div>
				<h1>翻墙违法，危害健康，请自觉遵守法律！</h1>
				<p class="subtitle">Don't try to bypass the firewall!</p>
				<p class="theme">请使用合法合规的网络服务，避免擅自建立或使用非法定信道进行国际联网。</p>
			</div>
		</section>
		<section class="grid" aria-label="相关处罚新闻">
			<article class="card">
				<h2>检察机关提示违法风险</h2>
				<p>中山检察在线文章称，利用 VPN 翻墙属于典型违法上网行为，可能受到行政处罚，情节严重还可能构成犯罪。</p>
				<a href="https://www.zhongshan.jcy.gov.cn/jcjs/dysqjcy/content/23/18887.html" rel="noopener noreferrer">查看来源</a>
			</article>
			<article class="card">
				<h2>个人使用被警告罚款</h2>
				<p>公开报道曾提到，广东有个人因擅自建立、使用非法定信道进行国际联网，被处以警告并罚款人民币 1000 元。</p>
				<a href="https://www.rfa.org/mandarin/yataibaodao/meiti/ql2-01072019090753.html" rel="noopener noreferrer">查看来源</a>
			</article>
			<article class="card">
				<h2>多地行政处罚案例</h2>
				<p>网络法实务圈曾整理 50 个“翻墙”行政处罚案例，涉及使用 VPN、代理软件以及后续违法行为等不同情形。</p>
				<a href="https://chinadigitaltimes.net/chinese/700670.html" rel="noopener noreferrer">查看来源</a>
			</article>
		</section>
		<div class="notice">本页面仅用于合规提醒。不同地区、不同情节对应的法律后果可能不同，请以现行法律法规和主管机关解释为准。</div>
	</main>
	</body>
	</html>
	`
	return text;
}

async function sendMessage(type, ip, add_data = "") {
	if (BotToken !== '' && ChatID !== '') {
		let msg = "";
		const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);
		if (response.status == 200) {
			const ipInfo = await response.json();
			msg = `${type}\nIP: ${ip}\n国家: ${ipInfo.country}\n<tg-spoiler>城市: ${ipInfo.city}\n组织: ${ipInfo.org}\nASN: ${ipInfo.as}\n${add_data}`;
		} else {
			msg = `${type}\nIP: ${ip}\n<tg-spoiler>${add_data}`;
		}

		let url = "https://api.telegram.org/bot" + BotToken + "/sendMessage?chat_id=" + ChatID + "&parse_mode=HTML&text=" + encodeURIComponent(msg);
		return fetch(url, {
			method: 'get',
			headers: {
				'Accept': 'text/html,application/xhtml+xml,application/xml;',
				'Accept-Encoding': 'gzip, deflate, br',
				'User-Agent': 'Mozilla/5.0 Chrome/90.0.4430.72'
			}
		});
	}
}

function base64Decode(str) {
	const bytes = new Uint8Array(atob(str).split('').map(c => c.charCodeAt(0)));
	const decoder = new TextDecoder('utf-8');
	return decoder.decode(bytes);
}

async function MD5MD5(text) {
	const encoder = new TextEncoder();

	const firstPass = await crypto.subtle.digest('MD5', encoder.encode(text));
	const firstPassArray = Array.from(new Uint8Array(firstPass));
	const firstHex = firstPassArray.map(b => b.toString(16).padStart(2, '0')).join('');

	const secondPass = await crypto.subtle.digest('MD5', encoder.encode(firstHex.slice(7, 27)));
	const secondPassArray = Array.from(new Uint8Array(secondPass));
	const secondHex = secondPassArray.map(b => b.toString(16).padStart(2, '0')).join('');

	return secondHex.toLowerCase();
}

function clashFix(content) {
	if (content.includes('wireguard') && !content.includes('remote-dns-resolve')) {
		let lines;
		if (content.includes('\r\n')) {
			lines = content.split('\r\n');
		} else {
			lines = content.split('\n');
		}

		let result = "";
		for (let line of lines) {
			if (line.includes('type: wireguard')) {
				const 备改内容 = `, mtu: 1280, udp: true`;
				const 正确内容 = `, mtu: 1280, remote-dns-resolve: true, udp: true`;
				result += line.replace(new RegExp(备改内容, 'g'), 正确内容) + '\n';
			} else {
				result += line + '\n';
			}
		}

		content = result;
	}
	return content;
}

async function proxyURL(proxyURL, url) {
	const URLs = await ADD(proxyURL);
	const fullURL = URLs[Math.floor(Math.random() * URLs.length)];

	// 解析目标 URL
	let parsedURL = new URL(fullURL);
	console.log(parsedURL);
	// 提取并可能修改 URL 组件
	let URLProtocol = parsedURL.protocol.slice(0, -1) || 'https';
	let URLHostname = parsedURL.hostname;
	let URLPathname = parsedURL.pathname;
	let URLSearch = parsedURL.search;

	// 处理 pathname
	if (URLPathname.charAt(URLPathname.length - 1) == '/') {
		URLPathname = URLPathname.slice(0, -1);
	}
	URLPathname += url.pathname;

	// 构建新的 URL
	let newURL = `${URLProtocol}://${URLHostname}${URLPathname}${URLSearch}`;

	// 反向代理请求
	let response = await fetch(newURL);

	// 创建新的响应
	let newResponse = new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	});

	// 添加自定义头部，包含 URL 信息
	//newResponse.headers.set('X-Proxied-By', 'Cloudflare Worker');
	//newResponse.headers.set('X-Original-URL', fullURL);
	newResponse.headers.set('X-New-URL', newURL);

	return newResponse;
}

async function getSUB(api, request, 追加UA, userAgentHeader, 前缀映射 = {}) {
	if (!api || api.length === 0) {
		return [];
	} else api = [...new Set(api)]; // 去重
	let newapi = "";
	let 订阅转换URLs = "";
	let 异常订阅 = "";
	const controller = new AbortController(); // 创建一个AbortController实例，用于取消请求
	const timeout = setTimeout(() => {
		controller.abort(); // 2秒后取消所有请求
	}, 2000);

	try {
		// 使用Promise.allSettled等待所有API请求完成，无论成功或失败
		const responses = await Promise.allSettled(api.map(apiUrl => getUrl(request, apiUrl, 追加UA, userAgentHeader).then(response => response.ok ? response.text() : Promise.reject(response))));

		// 遍历所有响应
		const modifiedResponses = responses.map((response, index) => {
			// 检查是否请求成功
			if (response.status === 'rejected') {
				const reason = response.reason;
				if (reason && reason.name === 'AbortError') {
					return {
						status: '超时',
						value: null,
						apiUrl: api[index] // 将原始的apiUrl添加到返回对象中
					};
				}
				console.error(`请求失败: ${api[index]}, 错误信息: ${reason.status} ${reason.statusText}`);
				return {
					status: '请求失败',
					value: null,
					apiUrl: api[index] // 将原始的apiUrl添加到返回对象中
				};
			}
			return {
				status: response.status,
				value: response.value,
				apiUrl: api[index] // 将原始的apiUrl添加到返回对象中
			};
		});

		console.log(modifiedResponses); // 输出修改后的响应数组

		for (const response of modifiedResponses) {
			// 检查响应状态是否为'fulfilled'
			if (response.status === 'fulfilled') {
				const content = await response.value || 'null'; // 获取响应的内容
				if (content.includes('proxies:')) {
					//console.log('Clash订阅: ' + response.apiUrl);
					const 前缀 = 前缀映射[response.apiUrl];
					const 明文节点 = (前缀 && !useLocalConverter) ? await 订阅转明文节点(response.apiUrl, userAgentHeader) : null;
					if (明文节点) {
						newapi += 应用订阅前缀(明文节点, 前缀) + '\n'; // Clash 配置转明文后加前缀
					} else {
						订阅转换URLs += "|" + response.apiUrl; // Clash 配置
					}
				} else if (content.includes('outbounds"') && content.includes('inbounds"')) {
					//console.log('Singbox订阅: ' + response.apiUrl);
					const 前缀 = 前缀映射[response.apiUrl];
					const 明文节点 = (前缀 && !useLocalConverter) ? await 订阅转明文节点(response.apiUrl, userAgentHeader) : null;
					if (明文节点) {
						newapi += 应用订阅前缀(明文节点, 前缀) + '\n'; // Singbox 配置转明文后加前缀
					} else {
						订阅转换URLs += "|" + response.apiUrl; // Singbox 配置
					}
				} else if (content.includes('://')) {
					//console.log('明文订阅: ' + response.apiUrl);
					newapi += 应用订阅前缀(content, 前缀映射[response.apiUrl]) + '\n'; // 追加内容
				} else if (isValidBase64(content)) {
					//console.log('Base64订阅: ' + response.apiUrl);
					newapi += 应用订阅前缀(base64Decode(content), 前缀映射[response.apiUrl]) + '\n'; // 解码并追加内容
				} else {
					const 异常订阅LINK = `trojan://CMLiussss@127.0.0.1:8888?security=tls&allowInsecure=1&type=tcp&headerType=none#%E5%BC%82%E5%B8%B8%E8%AE%A2%E9%98%85%20${response.apiUrl.split('://')[1].split('/')[0]}`;
					console.log('异常订阅: ' + 异常订阅LINK);
					异常订阅 += `${异常订阅LINK}\n`;
				}
			}
		}
	} catch (error) {
		console.error(error); // 捕获并输出错误信息
	} finally {
		clearTimeout(timeout); // 清除定时器
	}

	const 订阅内容 = await ADD(newapi + 异常订阅); // 将处理后的内容转换为数组
	// 返回处理后的结果
	return [订阅内容, 订阅转换URLs];
}

// 通过订阅转换后端将 Clash/Sing-box 订阅转为明文节点，以便统一添加名称前缀
// 转换失败时返回 null，调用方会回退到直接交由转换后端抓取（不加前缀）
async function 订阅转明文节点(subUrl, userAgentHeader) {
	try {
		const convertUrl = `${subProtocol}://${subConverter}/sub?target=mixed&url=${encodeURIComponent(subUrl)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
		const resp = await fetch(convertUrl, { headers: { 'User-Agent': `${atob('djJyYXlOLzYuNDU=')} cmliu/CF-Workers-SUB (${userAgentHeader})` } });
		if (!resp.ok) return null;
		const text = await resp.text();
		if (!text) return null;
		if (text.includes('://')) return text;	// 已是明文节点
		if (isValidBase64(text)) return base64Decode(text);	// base64 节点
		return null;
	} catch (e) {
		console.log('Clash/Singbox 订阅转明文节点失败: ' + subUrl);
		return null;
	}
}

async function getUrl(request, targetUrl, 追加UA, userAgentHeader) {
	// 设置自定义 User-Agent
	const newHeaders = new Headers(request.headers);
	newHeaders.set("User-Agent", `${atob('djJyYXlOLzYuNDU=')} cmliu/CF-Workers-SUB ${追加UA}(${userAgentHeader})`);

	// 构建新的请求对象
	const modifiedRequest = new Request(targetUrl, {
		method: request.method,
		headers: newHeaders,
		body: request.method === "GET" ? null : request.body,
		redirect: "follow",
		cf: {
			// 忽略SSL证书验证
			insecureSkipVerify: true,
			// 允许自签名证书
			allowUntrusted: true,
			// 禁用证书验证
			validateCertificate: false,
			// 禁用 Cloudflare CDN 缓存，每次实时拉取最新订阅内容
			cacheTtl: 0
		}
	});

	// 输出请求的详细信息
	console.log(`请求URL: ${targetUrl}`);
	console.log(`请求头: ${JSON.stringify([...newHeaders])}`);
	console.log(`请求方法: ${request.method}`);
	console.log(`请求体: ${request.method === "GET" ? null : request.body}`);

	// 发送请求并返回响应
	return fetch(modifiedRequest);
}

function isValidBase64(str) {
	// 先移除所有空白字符(空格、换行、回车等)
	const cleanStr = str.replace(/\s/g, '');
	const base64Regex = /^[A-Za-z0-9+/=]+$/;
	return base64Regex.test(cleanStr);
}

async function 迁移地址列表(env, txt = 'ADD.txt') {
	const 旧数据 = await env.KV.get(`/${txt}`);
	const 新数据 = await env.KV.get(txt);

	if (旧数据 && !新数据) {
		// 写入新位置
		await env.KV.put(txt, 旧数据);
		// 删除旧数据
		await env.KV.delete(`/${txt}`);
		return true;
	}
	return false;
}

async function KV(request, env, txt = 'ADD.txt', guest) {
	const url = new URL(request.url);
	try {
		// POST请求处理
		if (request.method === "POST") {
			if (!env.KV) return new Response("未绑定KV空间", { status: 400 });
			try {
				const content = await request.text();
				await env.KV.put(txt, content);
				return new Response("保存成功");
			} catch (error) {
				console.error('保存KV时发生错误:', error);
				return new Response("保存失败: " + error.message, { status: 500 });
			}
		}

		// GET请求部分
		let content = '';
		let hasKV = !!env.KV;

		if (hasKV) {
			try {
				content = await env.KV.get(txt) || '';
			} catch (error) {
				console.error('读取KV时发生错误:', error);
				content = '读取数据时发生错误: ' + error.message;
			}
		}

		const html = `
			<!DOCTYPE html>
			<html>
				<head>
					<title>${FileName} 订阅编辑</title>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1">
					<style>
						body {
							margin: 0;
							padding: 15px; /* 调整padding */
							box-sizing: border-box;
							font-size: 13px; /* 设置全局字体大小 */
						}
						.editor-container {
							width: 100%;
							max-width: 100%;
							margin: 0 auto;
						}
						.editor {
							width: 100%;
							height: 300px; /* 调整高度 */
							margin: 15px 0; /* 调整margin */
							padding: 10px; /* 调整padding */
							box-sizing: border-box;
							border: 1px solid #ccc;
							border-radius: 4px;
							font-size: 13px;
							line-height: 1.5;
							overflow-y: auto;
							resize: none;
						}
						.save-container {
							margin-top: 8px; /* 调整margin */
							display: flex;
							align-items: center;
							gap: 10px; /* 调整gap */
						}
						.save-btn, .back-btn {
							padding: 6px 15px; /* 调整padding */
							color: white;
							border: none;
							border-radius: 4px;
							cursor: pointer;
						}
						.save-btn {
							background: #4CAF50;
						}
						.save-btn:hover {
							background: #45a049;
						}
						.back-btn {
							background: #666;
						}
						.back-btn:hover {
							background: #555;
						}
						.save-status {
							color: #666;
						}
					</style>
					<script src="https://cdn.jsdelivr.net/npm/@keeex/qrcodejs-kx@1.0.2/qrcode.min.js"></script>
				</head>
				<body>
					################################################################<br>
					Subscribe / sub 订阅地址, 点击链接自动 <strong>复制订阅链接</strong> 并 <strong>生成订阅二维码</strong> <br>
					---------------------------------------------------------------<br>
					自适应订阅地址:<br>
					<a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/sub','qrcode_0')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/sub</a><br>
					<div id="qrcode_0" style="margin: 10px 10px 10px 10px;"></div>
					Base64订阅地址:<br>
					<a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/sub?b64','qrcode_1')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/sub?b64</a><br>
					<div id="qrcode_1" style="margin: 10px 10px 10px 10px;"></div>
					clash订阅地址:<br>
					<a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/sub?clash','qrcode_2')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/sub?clash</a><br>
					<div id="qrcode_2" style="margin: 10px 10px 10px 10px;"></div>
					singbox订阅地址:<br>
					<a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/sub?sb','qrcode_3')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/sub?sb</a><br>
					<div id="qrcode_3" style="margin: 10px 10px 10px 10px;"></div>
					surge订阅地址:<br>
					<a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/sub?surge','qrcode_4')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/sub?surge</a><br>
					<div id="qrcode_4" style="margin: 10px 10px 10px 10px;"></div>
					loon订阅地址:<br>
					<a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/sub?loon','qrcode_5')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/sub?loon</a><br>
					<div id="qrcode_5" style="margin: 10px 10px 10px 10px;"></div>
					---------------------------------------------------------------<br>
					################################################################<br>
					订阅转换配置<br>
					---------------------------------------------------------------<br>
					SUBAPI（订阅转换后端）: <strong>${useLocalConverter ? '本地内置 JS 转换器（Local，支持 Clash / Sing-box / Surge / Quantumult X / Loon）' : `${subProtocol}://${subConverter}`}</strong>${useLocalConverter ? '<br><span style="color:#888;font-size:12px;">当前未设置 SUBAPI，转换在本项目内完成。推荐（可选）远程后端：https://SUBAPI.cmliussss.net</span>' : ''}<br>
					SUBCONFIG（订阅转换配置文件）: <strong>${subConfig}</strong><br>
					---------------------------------------------------------------<br>
					################################################################<br>
					${FileName} 汇聚订阅编辑: 
					<div style="color:#666;font-size:12px;margin:6px 0;">提示: 在任意行行首添加 <code>#前缀#</code> 可为该行节点名称批量添加前缀。单节点如 <code>#ppp#vless://xxx#香港</code> 会变为 <code>ppp香港</code>；订阅如 <code>#ppp#https://xxx</code> 则会为该订阅的每个节点名称都加上 <code>ppp</code> 前缀。</div>
					<div class="editor-container">
						${hasKV ? `
						<textarea class="editor" 
							placeholder="${decodeURIComponent(atob('TElOSyVFNyVBNCVCQSVFNCVCRSU4QiVFRiVCQyU4OCVFNCVCOCU4MCVFOCVBMSU4QyVFNCVCOCU4MCVFNCVCOCVBQSVFOCU4QSU4MiVFNyU4MiVCOSVFOSU5MyVCRSVFNiU4RSVBNSVFNSU4RCVCMyVFNSU4RiVBRiVFRiVCQyU4OSVFRiVCQyU5QQp2bGVzcyUzQSUyRiUyRjI0NmFhNzk1LTA2MzctNGY0Yy04ZjY0LTJjOGZiMjRjMWJhZCU0MDEyNy4wLjAuMSUzQTEyMzQlM0ZlbmNyeXB0aW9uJTNEbm9uZSUyNnNlY3VyaXR5JTNEdGxzJTI2c25pJTNEVEcuQ01MaXVzc3NzLmxvc2V5b3VyaXAuY29tJTI2YWxsb3dJbnNlY3VyZSUzRDElMjZ0eXBlJTNEd3MlMjZob3N0JTNEVEcuQ01MaXVzc3NzLmxvc2V5b3VyaXAuY29tJTI2cGF0aCUzRCUyNTJGJTI1M0ZlZCUyNTNEMjU2MCUyM0NGbmF0CnRyb2phbiUzQSUyRiUyRmFhNmRkZDJmLWQxY2YtNGE1Mi1iYTFiLTI2NDBjNDFhNzg1NiU0MDIxOC4xOTAuMjMwLjIwNyUzQTQxMjg4JTNGc2VjdXJpdHklM0R0bHMlMjZzbmklM0RoazEyLmJpbGliaWxpLmNvbSUyNmFsbG93SW5zZWN1cmUlM0QxJTI2dHlwZSUzRHRjcCUyNmhlYWRlclR5cGUlM0Rub25lJTIzSEsKc3MlM0ElMkYlMkZZMmhoWTJoaE1qQXRhV1YwWmkxd2IyeDVNVE13TlRveVJYUlFjVzQyU0ZscVZVNWpTRzlvVEdaVmNFWlJkMjVtYWtORFVUVnRhREZ0U21SRlRVTkNkV04xVjFvNVVERjFaR3RTUzBodVZuaDFielUxYXpGTFdIb3lSbTgyYW5KbmRERTRWelkyYjNCMGVURmxOR0p0TVdwNlprTm1RbUklMjUzRCU0MDg0LjE5LjMxLjYzJTNBNTA4NDElMjNERQoKCiVFOCVBRSVBMiVFOSU5OCU4NSVFOSU5MyVCRSVFNiU4RSVBNSVFNyVBNCVCQSVFNCVCRSU4QiVFRiVCQyU4OCVFNCVCOCU4MCVFOCVBMSU4QyVFNCVCOCU4MCVFNiU5RCVBMSVFOCVBRSVBMiVFOSU5OCU4NSVFOSU5MyVCRSVFNiU4RSVBNSVFNSU4RCVCMyVFNSU4RiVBRiVFRiVCQyU4OSVFRiVCQyU5QQpodHRwcyUzQSUyRiUyRnN1Yi54Zi5mcmVlLmhyJTJGYXV0bw=='))}"
							id="content">${content}</textarea>
						<div class="save-container">
							<button class="save-btn" onclick="saveContent(this)">保存</button>
							<span class="save-status" id="saveStatus"></span>
						</div>
						` : '<p>请绑定 <strong>变量名称</strong> 为 <strong>KV</strong> 的KV命名空间</p>'}
					</div>
					<br>
					################################################################<br>
					${decodeURIComponent(atob('dGVsZWdyYW0lMjAlRTQlQkElQTQlRTYlQjUlODElRTclQkUlQTQlMjAlRTYlOEElODAlRTYlOUMlQUYlRTUlQTQlQTclRTQlQkQlQUMlN0UlRTUlOUMlQTglRTclQkElQkYlRTUlOEYlOTElRTclODklOEMhJTNDYnIlM0UKJTNDYSUyMGhyZWYlM0QlMjdodHRwcyUzQSUyRiUyRnQubWUlMkZDTUxpdXNzc3MlMjclM0VodHRwcyUzQSUyRiUyRnQubWUlMkZDTUxpdXNzc3MlM0MlMkZhJTNFJTNDYnIlM0UKLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJTNDYnIlM0UKZ2l0aHViJTIwJUU5JUExJUI5JUU3JTlCJUFFJUU1JTlDJUIwJUU1JTlEJTgwJTIwU3RhciFTdGFyIVN0YXIhISElM0NiciUzRQolM0NhJTIwaHJlZiUzRCUyN2h0dHBzJTNBJTJGJTJGZ2l0aHViLmNvbSUyRmNtbGl1JTJGQ0YtV29ya2Vycy1TVUIlMjclM0VodHRwcyUzQSUyRiUyRmdpdGh1Yi5jb20lMkZjbWxpdSUyRkNGLVdvcmtlcnMtU1VCJTNDJTJGYSUzRSUzQ2JyJTNFCi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSUzQ2JyJTNFCiUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMw=='))}
					<br><br>UA: <strong>${request.headers.get('User-Agent')}</strong>
					<script>
					function copyToClipboard(text, qrcode) {
						navigator.clipboard.writeText(text).then(() => {
							alert('已复制到剪贴板');
						}).catch(err => {
							console.error('复制失败:', err);
						});
						const qrcodeDiv = document.getElementById(qrcode);
						qrcodeDiv.innerHTML = '';
						new QRCode(qrcodeDiv, {
							text: text,
							width: 220, // 调整宽度
							height: 220, // 调整高度
							colorDark: "#000000", // 二维码颜色
							colorLight: "#ffffff", // 背景颜色
							correctLevel: QRCode.CorrectLevel.Q, // 设置纠错级别
							scale: 1 // 调整像素颗粒度
						});
					}
						
					if (document.querySelector('.editor')) {
						let timer;
						const textarea = document.getElementById('content');
						const originalContent = textarea.value;
		
						function goBack() {
							const currentUrl = window.location.href;
							const parentUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/'));
							window.location.href = parentUrl;
						}
		
						function replaceFullwidthColon() {
							const text = textarea.value;
							textarea.value = text.replace(/：/g, ':');
						}
						
						function saveContent(button) {
							try {
								const updateButtonText = (step) => {
									button.textContent = \`保存中: \${step}\`;
								};
								// 检测是否为iOS设备
								const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
								
								// 仅在非iOS设备上执行replaceFullwidthColon
								if (!isIOS) {
									replaceFullwidthColon();
								}
								updateButtonText('开始保存');
								button.disabled = true;

								// 获取textarea内容和原始内容
								const textarea = document.getElementById('content');
								if (!textarea) {
									throw new Error('找不到文本编辑区域');
								}

								updateButtonText('获取内容');
								let newContent;
								let originalContent;
								try {
									newContent = textarea.value || '';
									originalContent = textarea.defaultValue || '';
								} catch (e) {
									console.error('获取内容错误:', e);
									throw new Error('无法获取编辑内容');
								}

								updateButtonText('准备状态更新函数');
								const updateStatus = (message, isError = false) => {
									const statusElem = document.getElementById('saveStatus');
									if (statusElem) {
										statusElem.textContent = message;
										statusElem.style.color = isError ? 'red' : '#666';
									}
								};

								updateButtonText('准备按钮重置函数');
								const resetButton = () => {
									button.textContent = '保存';
									button.disabled = false;
								};

								if (newContent !== originalContent) {
									updateButtonText('发送保存请求');
									fetch(window.location.href, {
										method: 'POST',
										body: newContent,
										headers: {
											'Content-Type': 'text/plain;charset=UTF-8'
										},
										cache: 'no-cache'
									})
									.then(response => {
										updateButtonText('检查响应状态');
										if (!response.ok) {
											throw new Error(\`HTTP error! status: \${response.status}\`);
										}
										updateButtonText('更新保存状态');
										const now = new Date().toLocaleString();
										document.title = \`编辑已保存 \${now}\`;
										updateStatus(\`已保存 \${now}\`);
									})
									.catch(error => {
										updateButtonText('处理错误');
										console.error('Save error:', error);
										updateStatus(\`保存失败: \${error.message}\`, true);
									})
									.finally(() => {
										resetButton();
									});
								} else {
									updateButtonText('检查内容变化');
									updateStatus('内容未变化');
									resetButton();
								}
							} catch (error) {
								console.error('保存过程出错:', error);
								button.textContent = '保存';
								button.disabled = false;
								const statusElem = document.getElementById('saveStatus');
								if (statusElem) {
									statusElem.textContent = \`错误: \${error.message}\`;
									statusElem.style.color = 'red';
								}
							}
						}
		
						textarea.addEventListener('blur', saveContent);
						textarea.addEventListener('input', () => {
							clearTimeout(timer);
							timer = setTimeout(saveContent, 5000);
						});
					}

					</script>
				</body>
			</html>
		`;

		return new Response(html, {
			headers: { "Content-Type": "text/html;charset=utf-8" }
		});
	} catch (error) {
		console.error('处理请求时发生错误:', error);
		return new Response("服务器错误: " + error.message, {
			status: 500,
			headers: { "Content-Type": "text/plain;charset=utf-8" }
		});
	}
}

/* ==================== 本地订阅转换器（纯 JS 实现，仅支持 Clash / Clash.Meta） ====================
 * 未设置环境变量 SUBAPI 时启用。输入与远程订阅转换后端保持一致：
 *   - nodeText：已解码去重的明文节点列表
 *   - passthroughLinks：需额外抓取的订阅 / 节点直链（Clash / Sing-box / base64 / 明文）
 *   - configUrl：与 SUBCONFIG 相同的 .ini 规则配置
 *   - prefixMap：订阅链接 -> 名称前缀（为 Clash / Sing-box 直链订阅的节点补上前缀）
 *   - allPrefixes：所有前缀列表（插入国旗 emoji 时，确保前缀仍在名称最前）
 */
async function localSubconvert(target, nodeText, passthroughLinks, configUrl, userAgentHeader, prefixMap = {}, allPrefixes = []) {
	const SUPPORTED_TARGETS = ['clash', 'singbox', 'surge', 'loon', 'quanx'];
	if (!SUPPORTED_TARGETS.includes(target)) throw new Error(`本地转换器不支持的目标格式: ${target}`);

	// 1. 收集节点
	const proxies = [];
	const usedNames = new Set();
	const addProxy = (p) => {
		if (!p || !p.name || !p.server || !p.port) return;
		let name = String(p.name).trim() || `${p.type}-${p.server}`;
		name = insertFlagEmoji(name, allPrefixes); // 补上国旗 emoji（前缀之后）
		let unique = name;
		let i = 1;
		while (usedNames.has(unique)) unique = `${name} ${++i}`;
		usedNames.add(unique);
		p.name = unique;
		proxies.push(p);
	};

	// 1a. 明文节点
	for (const line of String(nodeText || '').split('\n')) {
		const proxy = parseNodeURI(line.trim());
		if (proxy) addProxy(proxy);
	}

	// 1b. 直链（订阅或节点）
	for (const link of (passthroughLinks || [])) {
		const u = (link || '').trim();
		if (!u) continue;
		if (/^https?:\/\//i.test(u)) {
			try {
				const list = await fetchSubNodes(u, userAgentHeader);
				const pfx = prefixMap[u];
				for (const p of list) {
					if (pfx && p && p.name) p.name = pfx + p.name; // 为 Clash / Sing-box 订阅节点补上前缀
					addProxy(p);
				}
			} catch (e) {
				console.log('本地转换：抓取订阅失败 ' + u);
			}
		} else {
			const proxy = parseNodeURI(u);
			if (proxy) addProxy(proxy);
		}
	}

	if (proxies.length === 0) throw new Error('未解析到任何可用节点');

	// 2. 解析 .ini 配置
	const config = await fetchIniConfig(configUrl);
	// 3. 生成代理组
	const proxyGroups = buildProxyGroups(config.customProxyGroups, proxies);
	// 4. 生成结构化规则
	const rules = await buildRules(config.rulesets);
	// 5. 按目标格式输出
	switch (target) {
		case 'clash': return emitClashYaml(proxies, proxyGroups, rules);
		case 'singbox': return emitSingbox(proxies, proxyGroups, rules);
		case 'surge': return emitSurge(proxies, proxyGroups, rules);
		case 'loon': return emitLoon(proxies, proxyGroups, rules);
		case 'quanx': return emitQuanx(proxies, proxyGroups, rules);
		default: throw new Error(`本地转换器不支持的目标格式: ${target}`);
	}
}

// 明文节点分发解析
function parseNodeURI(line) {
	if (!line || line.startsWith('#') || line.startsWith(';')) return null;
	if (!line.includes('://')) return null;
	const scheme = line.split('://')[0].toLowerCase();
	try {
		switch (scheme) {
			case 'vmess': return parseVmess(line);
			case 'vless': return parseVless(line);
			case 'ss': return parseSS(line);
			case 'ssr': return parseSSR(line);
			case 'trojan': return parseTrojan(line);
			case 'hysteria2':
			case 'hy2': return parseHysteria2(line);
			case 'tuic': return parseTuic(line);
			default: return null; // 未支持的协议直接跳过
		}
	} catch (e) {
		return null;
	}
}

// 宽松 base64 解码（兼容 url-safe 与缺省填充）
function b64d(str) {
	str = String(str || '').replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
	while (str.length % 4) str += '=';
	try {
		const bytes = new Uint8Array(atob(str).split('').map(c => c.charCodeAt(0)));
		return new TextDecoder('utf-8').decode(bytes);
	} catch (e) {
		return '';
	}
}

function decodeHashName(hash) {
	if (!hash) return '';
	const raw = hash.replace(/^#/, '');
	try { return decodeURIComponent(raw); } catch (e) { return raw; }
}

function splitHostPort(hp) {
	hp = (hp || '').trim();
	if (hp.startsWith('[')) {
		const idx = hp.indexOf(']');
		return { host: hp.slice(1, idx), port: Number(hp.slice(idx + 2)) };
	}
	const idx = hp.lastIndexOf(':');
	return { host: hp.slice(0, idx), port: Number(hp.slice(idx + 1)) };
}

function parseVmess(line) {
	const v = JSON.parse(b64d(line.slice('vmess://'.length)));
	const net = (v.net || 'tcp').toLowerCase();
	const tls = (v.tls === 'tls' || v.tls === true);
	const proxy = {
		name: v.ps || v.add,
		type: 'vmess',
		server: v.add,
		port: Number(v.port),
		uuid: v.id,
		alterId: Number(v.aid || 0),
		cipher: v.scy || 'auto',
		udp: true,
		network: net,
	};
	if (tls) {
		proxy.tls = true;
		if (v.sni || v.host) proxy.servername = v.sni || v.host;
		if (v.alpn) proxy.alpn = String(v.alpn).split(',').map(s => s.trim()).filter(Boolean);
		if (v.fp) proxy['client-fingerprint'] = v.fp;
	}
	if (net === 'ws') {
		const opts = { path: v.path || '/' };
		if (v.host) opts.headers = { Host: v.host };
		proxy['ws-opts'] = opts;
	} else if (net === 'grpc') {
		proxy['grpc-opts'] = { 'grpc-service-name': v.path || '' };
	} else if (net === 'h2') {
		proxy['h2-opts'] = { path: v.path || '/', host: v.host ? [v.host] : undefined };
	}
	return proxy;
}

function parseVless(line) {
	const u = new URL(line);
	const q = u.searchParams;
	const security = (q.get('security') || 'none').toLowerCase();
	const type = (q.get('type') || 'tcp').toLowerCase();
	const proxy = {
		name: decodeHashName(u.hash) || u.hostname,
		type: 'vless',
		server: u.hostname,
		port: Number(u.port) || 443,
		uuid: decodeURIComponent(u.username),
		udp: true,
		network: type,
	};
	if (q.get('flow')) proxy.flow = q.get('flow');
	if (security === 'tls' || security === 'reality') {
		proxy.tls = true;
		if (q.get('sni') || q.get('peer')) proxy.servername = q.get('sni') || q.get('peer');
		if (q.get('fp')) proxy['client-fingerprint'] = q.get('fp');
		if (q.get('alpn')) proxy.alpn = q.get('alpn').split(',').map(s => s.trim()).filter(Boolean);
	}
	if (security === 'reality') {
		const ro = {};
		if (q.get('pbk')) ro['public-key'] = q.get('pbk');
		if (q.get('sid')) ro['short-id'] = q.get('sid');
		proxy['reality-opts'] = ro;
	}
	if (type === 'ws') {
		const opts = { path: q.get('path') || '/' };
		if (q.get('host')) opts.headers = { Host: q.get('host') };
		proxy['ws-opts'] = opts;
	} else if (type === 'grpc') {
		proxy['grpc-opts'] = { 'grpc-service-name': q.get('serviceName') || q.get('path') || '' };
	} else if (type === 'h2') {
		proxy['h2-opts'] = { path: q.get('path') || '/', host: q.get('host') ? [q.get('host')] : undefined };
	}
	return proxy;
}

function parseTrojan(line) {
	const u = new URL(line);
	const q = u.searchParams;
	const type = (q.get('type') || 'tcp').toLowerCase();
	const proxy = {
		name: decodeHashName(u.hash) || u.hostname,
		type: 'trojan',
		server: u.hostname,
		port: Number(u.port) || 443,
		password: decodeURIComponent(u.username),
		udp: true,
		network: type,
	};
	if (q.get('sni') || q.get('peer')) proxy.sni = q.get('sni') || q.get('peer');
	if (q.get('allowInsecure') === '1' || q.get('insecure') === '1') proxy['skip-cert-verify'] = true;
	if (q.get('alpn')) proxy.alpn = q.get('alpn').split(',').map(s => s.trim()).filter(Boolean);
	if (q.get('fp')) proxy['client-fingerprint'] = q.get('fp');
	if (type === 'ws') {
		const opts = { path: q.get('path') || '/' };
		if (q.get('host')) opts.headers = { Host: q.get('host') };
		proxy['ws-opts'] = opts;
	} else if (type === 'grpc') {
		proxy['grpc-opts'] = { 'grpc-service-name': q.get('serviceName') || '' };
	}
	return proxy;
}

function parseSS(line) {
	let rest = line.slice('ss://'.length);
	let name = '';
	const hashIdx = rest.indexOf('#');
	if (hashIdx >= 0) { name = decodeHashName(rest.slice(hashIdx)); rest = rest.slice(0, hashIdx); }
	let pluginQuery = '';
	const qIdx = rest.indexOf('?');
	if (qIdx >= 0) { pluginQuery = rest.slice(qIdx + 1); rest = rest.slice(0, qIdx); }
	let method, password, server, port;
	if (rest.includes('@')) {
		const atIdx = rest.lastIndexOf('@');
		let userinfo = rest.slice(0, atIdx);
		if (!userinfo.includes(':')) userinfo = b64d(userinfo);
		const ci = userinfo.indexOf(':');
		method = userinfo.slice(0, ci);
		password = userinfo.slice(ci + 1);
		const hp = splitHostPort(rest.slice(atIdx + 1));
		server = hp.host; port = hp.port;
	} else {
		const decoded = b64d(rest);
		const atIdx = decoded.lastIndexOf('@');
		const userinfo = decoded.slice(0, atIdx);
		const ci = userinfo.indexOf(':');
		method = userinfo.slice(0, ci);
		password = userinfo.slice(ci + 1);
		const hp = splitHostPort(decoded.slice(atIdx + 1));
		server = hp.host; port = hp.port;
	}
	const proxy = { name: name || server, type: 'ss', server, port: Number(port), cipher: method, password, udp: true };
	if (pluginQuery) {
		const pq = new URLSearchParams(pluginQuery);
		const pluginStr = pq.get('plugin');
		if (pluginStr) {
			const parts = pluginStr.split(';');
			const popts = {};
			for (const seg of parts.slice(1)) {
				const eq = seg.indexOf('=');
				if (eq >= 0) popts[seg.slice(0, eq)] = seg.slice(eq + 1);
			}
			if (parts[0].includes('obfs')) {
				proxy.plugin = 'obfs';
				proxy['plugin-opts'] = { mode: popts.obfs, host: popts['obfs-host'] };
			} else if (parts[0].includes('v2ray')) {
				proxy.plugin = 'v2ray-plugin';
				proxy['plugin-opts'] = { mode: popts.mode || 'websocket', host: popts.host, path: popts.path, tls: 'tls' in popts };
			}
		}
	}
	return proxy;
}

function parseSSR(line) {
	const decoded = b64d(line.slice('ssr://'.length));
	const [main, query] = decoded.split('/?');
	const parts = main.split(':');
	if (parts.length < 6) return null;
	const proxy = {
		name: '',
		type: 'ssr',
		server: parts[0],
		port: Number(parts[1]),
		protocol: parts[2],
		cipher: parts[3],
		obfs: parts[4],
		password: b64d(parts.slice(5).join(':')),
		udp: true,
	};
	const q = new URLSearchParams(query || '');
	proxy.name = q.get('remarks') ? b64d(q.get('remarks')) : proxy.server;
	if (q.get('protoparam')) proxy['protocol-param'] = b64d(q.get('protoparam'));
	if (q.get('obfsparam')) proxy['obfs-param'] = b64d(q.get('obfsparam'));
	return proxy;
}

function parseHysteria2(line) {
	const u = new URL(line.replace(/^hy2:\/\//i, 'hysteria2://'));
	const q = u.searchParams;
	const proxy = {
		name: decodeHashName(u.hash) || u.hostname,
		type: 'hysteria2',
		server: u.hostname,
		port: Number(u.port) || 443,
		password: decodeURIComponent(u.username || u.password || ''),
		udp: true,
	};
	if (q.get('sni') || q.get('peer')) proxy.sni = q.get('sni') || q.get('peer');
	if (q.get('insecure') === '1') proxy['skip-cert-verify'] = true;
	if (q.get('obfs')) { proxy.obfs = q.get('obfs'); if (q.get('obfs-password')) proxy['obfs-password'] = q.get('obfs-password'); }
	if (q.get('alpn')) proxy.alpn = q.get('alpn').split(',').map(s => s.trim()).filter(Boolean);
	return proxy;
}

function parseTuic(line) {
	const u = new URL(line);
	const q = u.searchParams;
	const proxy = {
		name: decodeHashName(u.hash) || u.hostname,
		type: 'tuic',
		server: u.hostname,
		port: Number(u.port) || 443,
		uuid: decodeURIComponent(u.username),
		password: decodeURIComponent(u.password || ''),
		udp: true,
	};
	if (q.get('sni')) proxy.sni = q.get('sni');
	if (q.get('congestion_control')) proxy['congestion-controller'] = q.get('congestion_control');
	if (q.get('udp_relay_mode')) proxy['udp-relay-mode'] = q.get('udp_relay_mode');
	if (q.get('allow_insecure') === '1' || q.get('insecure') === '1') proxy['skip-cert-verify'] = true;
	if (q.get('alpn')) proxy.alpn = q.get('alpn').split(',').map(s => s.trim()).filter(Boolean);
	return proxy;
}

// 抓取并解析直链订阅为节点数组
async function fetchSubNodes(url, userAgentHeader) {
	const resp = await fetch(url, {
		headers: { 'User-Agent': `${atob('djJyYXlOLzYuNDU=')} cmliu/CF-Workers-SUB (${userAgentHeader || 'CF-Workers-SUB'})` },
		cf: { insecureSkipVerify: true, allowUntrusted: true, validateCertificate: false, cacheTtl: 0 }
	});
	if (!resp.ok) return [];
	const text = await resp.text();
	if (!text) return [];
	if (text.includes('proxies:')) return parseClashProxies(text);
	if (text.includes('outbounds') && text.includes('inbounds')) return parseSingboxOutbounds(text);
	if (text.includes('://')) return text.split('\n').map(l => parseNodeURI(l.trim())).filter(Boolean);
	if (isValidBase64(text)) return base64Decode(text).split('\n').map(l => parseNodeURI(l.trim())).filter(Boolean);
	return [];
}

// 从 Clash 配置中提取流式（flow-style）代理项。块式（多行）代理不在 MVP 支持范围。
function parseClashProxies(text) {
	const proxies = [];
	const lines = text.split(/\r?\n/);
	let inProxies = false;
	for (const raw of lines) {
		if (/^proxies:\s*(\[\s*\])?\s*$/.test(raw)) { inProxies = true; continue; }
		if (!inProxies) continue;
		if (/^[^\s#-]/.test(raw) && raw.includes(':')) break; // 下一个顶层键，结束
		const m = raw.match(/^\s*-\s*(\{.*\})\s*$/);
		if (m) {
			const obj = parseFlowMap(m[1]);
			if (obj && obj.name && obj.server) { obj.port = Number(obj.port); proxies.push(obj); }
		}
	}
	return proxies;
}

// 宽松的 YAML/JSON flow 映射解析器：{k: v, k2: {..}, k3: [a, b]}
function parseFlowMap(str) {
	let i = 0;
	const skipWs = () => { while (i < str.length && /\s/.test(str[i])) i++; };
	function parseQuoted(quote) {
		let s = ''; i++;
		while (i < str.length && str[i] !== quote) {
			if (str[i] === '\\' && quote === '"') { s += str[i + 1]; i += 2; } else s += str[i++];
		}
		i++;
		return s;
	}
	function parseScalar() {
		let s = '';
		while (i < str.length && ',}]'.indexOf(str[i]) === -1) s += str[i++];
		s = s.trim();
		if (s === 'true') return true;
		if (s === 'false') return false;
		if (s !== '' && /^-?\d+(\.\d+)?$/.test(s)) return Number(s);
		return s;
	}
	function parseValue() {
		skipWs();
		const ch = str[i];
		if (ch === '{') return parseMap();
		if (ch === '[') return parseList();
		if (ch === '"' || ch === "'") return parseQuoted(ch);
		return parseScalar();
	}
	function parseMap() {
		const obj = {}; i++; skipWs();
		while (i < str.length && str[i] !== '}') {
			skipWs();
			let key = '';
			if (str[i] === '"' || str[i] === "'") key = parseQuoted(str[i]);
			else { while (i < str.length && str[i] !== ':' && str[i] !== '}') key += str[i++]; key = key.trim(); }
			skipWs();
			if (str[i] === ':') i++;
			obj[key] = parseValue();
			skipWs();
			if (str[i] === ',') { i++; skipWs(); }
		}
		i++;
		return obj;
	}
	function parseList() {
		const arr = []; i++; skipWs();
		while (i < str.length && str[i] !== ']') {
			arr.push(parseValue());
			skipWs();
			if (str[i] === ',') { i++; skipWs(); }
		}
		i++;
		return arr;
	}
	try { skipWs(); return str[i] === '{' ? parseMap() : null; } catch (e) { return null; }
}

// Sing-box outbounds -> Clash 代理（常见类型，尽力而为）
function parseSingboxOutbounds(text) {
	let json;
	try { json = JSON.parse(text); } catch (e) { return []; }
	const outs = json.outbounds || [];
	const result = [];
	for (const o of outs) {
		const p = singboxToClash(o);
		if (p) result.push(p);
	}
	return result;
}

function singboxToClash(o) {
	if (!o || !o.type || !o.server) return null;
	const base = { name: o.tag || o.server, server: o.server, port: Number(o.server_port || o.port), udp: true };
	const tls = o.tls || {};
	const applyTls = (p) => {
		if (tls.enabled) {
			p.tls = true;
			if (tls.server_name) p.servername = tls.server_name;
			if (tls.insecure) p['skip-cert-verify'] = true;
			if (tls.alpn) p.alpn = Array.isArray(tls.alpn) ? tls.alpn : [tls.alpn];
		}
	};
	switch (o.type) {
		case 'vmess': return applyTls(Object.assign(base, { type: 'vmess', uuid: o.uuid, alterId: Number(o.alter_id || 0), cipher: o.security || 'auto' })) || base;
		case 'vless': { const p = Object.assign(base, { type: 'vless', uuid: o.uuid }); if (o.flow) p.flow = o.flow; applyTls(p); return p; }
		case 'trojan': { const p = Object.assign(base, { type: 'trojan', password: o.password }); applyTls(p); if (tls.server_name) p.sni = tls.server_name; return p; }
		case 'shadowsocks': return Object.assign(base, { type: 'ss', cipher: o.method, password: o.password });
		case 'hysteria2': { const p = Object.assign(base, { type: 'hysteria2', password: o.password }); if (tls.server_name) p.sni = tls.server_name; if (tls.insecure) p['skip-cert-verify'] = true; return p; }
		case 'tuic': { const p = Object.assign(base, { type: 'tuic', uuid: o.uuid, password: o.password }); if (tls.server_name) p.sni = tls.server_name; if (o.congestion_control) p['congestion-controller'] = o.congestion_control; return p; }
		default: return null;
	}
}

// 带缓存的远程文本抓取（Cache API），降低子请求次数与延迟
async function cachedFetchText(url) {
	const cache = caches.default;
	const cacheKey = new Request(url, { method: 'GET' });
	let resp = await cache.match(cacheKey);
	if (!resp) {
		resp = await fetch(url, { headers: { 'User-Agent': 'clash-verge/CF-Workers-SUB' } });
		if (!resp.ok) throw new Error(`获取资源失败: ${url} (${resp.status})`);
		const toCache = new Response(resp.body, resp);
		toCache.headers.set('Cache-Control', 'max-age=3600');
		try { await cache.put(cacheKey, toCache.clone()); } catch (e) { /* 部分环境不可缓存，忽略 */ }
		return await toCache.text();
	}
	return await resp.text();
}

// 解析 .ini 配置，提取 ruleset= 与 custom_proxy_group=
async function fetchIniConfig(configUrl) {
	const text = await cachedFetchText(configUrl);
	const rulesets = [];
	const customProxyGroups = [];
	for (let line of text.split(/\r?\n/)) {
		line = line.trim();
		if (!line || line.startsWith(';') || line.startsWith('#')) continue;
		if (line.startsWith('ruleset=')) rulesets.push(line.slice('ruleset='.length));
		else if (line.startsWith('custom_proxy_group=')) customProxyGroups.push(line.slice('custom_proxy_group='.length));
	}
	return { rulesets, customProxyGroups };
}

// 根据 custom_proxy_group 定义生成代理组
function buildProxyGroups(defs, proxies) {
	const allNames = proxies.map(p => p.name);
	const groups = [];
	for (const def of defs) {
		const parts = def.split('`');
		if (parts.length < 3) continue;
		const name = parts[0].trim();
		const type = parts[1].trim();
		const members = [];
		let url = null, interval = null, tolerance = null;
		for (let k = 2; k < parts.length; k++) {
			const seg = parts[k];
			if (/^https?:\/\//i.test(seg)) { url = seg.trim(); continue; }
			if (url && /^\d/.test(seg.trim())) {
				const nums = seg.split(',');
				if (nums[0]) interval = Number(nums[0]);
				if (nums[2]) tolerance = Number(nums[2]);
				continue;
			}
			if (seg.startsWith('[]')) members.push({ ref: seg.slice(2) });
			else members.push({ filter: seg });
		}
		const resolved = [];
		for (const m of members) {
			if (m.ref !== undefined) {
				resolved.push(m.ref);
			} else {
				let re = null;
				try { re = new RegExp(m.filter); } catch (e) { re = null; }
				if (re) for (const n of allNames) if (re.test(n)) resolved.push(n);
			}
		}
		const seen = new Set();
		let finalMembers = resolved.filter(n => { if (seen.has(n)) return false; seen.add(n); return true; });
		if (finalMembers.length === 0) finalMembers = ['DIRECT']; // 避免空组导致配置无效
		const group = { name, type, proxies: finalMembers };
		// 与订阅源保持一致：不使用延迟测试 URL，所有代理组均为手动选择模式
		// 原代码会为 url-test/load-balance/fallback 添加 url/interval/tolerance
		// if (type === 'url-test' || type === 'load-balance' || type === 'fallback') {
		// 	group.url = url || 'http://www.gstatic.com/generate_204';
		// 	group.interval = interval || 300;
		// 	if (tolerance != null) group.tolerance = tolerance;
		// }
		groups.push(group);
	}
	return groups;
}

// 根据 ruleset= 定义生成结构化规则（并发抓取远程规则集，保留文件顺序，MATCH 置尾）
// 返回：[{ t, v, group, noResolve }...]，最后一条为 { t: 'MATCH', group }
async function buildRules(rulesets) {
	const rules = [];
	let finalGroup = 'DIRECT';
	const remoteUrls = [...new Set(rulesets.map(r => r.split(',')[1]).filter(src => src && /^https?:\/\//i.test(src)))];
	const fetched = {};
	await Promise.allSettled(remoteUrls.map(async (u) => {
		try { fetched[u] = await cachedFetchText(u); } catch (e) { fetched[u] = ''; }
	}));
	for (const entry of rulesets) {
		const comma = entry.indexOf(',');
		if (comma < 0) continue;
		const group = entry.slice(0, comma).trim();
		const src = entry.slice(comma + 1).trim();
		if (src.startsWith('[]')) {
			const inline = src.slice(2);
			if (/^FINAL$/i.test(inline) || /^MATCH$/i.test(inline)) { finalGroup = group; continue; }
			const r = parseRuleLine(inline);
			if (r) rules.push({ ...r, group });
			continue;
		}
		const content = fetched[src];
		if (!content) continue;
		for (const line of content.split(/\r?\n/)) {
			const r = parseRuleLine(line);
			if (r) rules.push({ ...r, group });
		}
	}
	rules.push({ t: 'MATCH', group: finalGroup });
	return rules;
}

const SUPPORTED_RULE_TYPES = new Set(['DOMAIN', 'DOMAIN-SUFFIX', 'DOMAIN-KEYWORD', 'DOMAIN-WILDCARD', 'IP-CIDR', 'IP-CIDR6', 'IP6-CIDR', 'GEOIP', 'GEOSITE', 'SRC-IP-CIDR', 'SRC-PORT', 'DST-PORT', 'PROCESS-NAME', 'PROCESS-PATH', 'IP-ASN']);

// 解析单行规则为 { t, v, noResolve }，不支持的类型返回 null
function parseRuleLine(line) {
	line = line.trim();
	if (!line || line.startsWith('#') || line.startsWith(';')) return null;
	if (line.startsWith('payload:')) return null;
	if (line.startsWith('- ')) line = line.slice(2).trim().replace(/^['"]|['"]$/g, '');
	const parts = line.split(',');
	const t = parts[0].trim().toUpperCase();
	if (!SUPPORTED_RULE_TYPES.has(t)) return null;
	const v = parts[1] ? parts[1].trim() : '';
	if (!v) return null;
	const noResolve = parts.slice(2).map(s => s.trim().toLowerCase()).includes('no-resolve');
	return { t, v, noResolve };
}

// 将结构化规则转为 Clash 规则字符串
function clashRuleString(r) {
	if (r.t === 'MATCH') return `MATCH,${r.group}`;
	return `${r.t},${r.v},${r.group}` + (r.noResolve ? ',no-resolve' : '');
}

// 输出 Clash YAML
function emitClashYaml(proxies, proxyGroups, rules) {
	const header = [
		'mixed-port: 7890',
		'allow-lan: true',
		'mode: rule',
		'log-level: info',
		'ipv6: true',
		'external-controller: 127.0.0.1:9090',
		'dns:',
		'  enable: true',
		'  ipv6: true',
		'  enhanced-mode: fake-ip',
		'  fake-ip-range: 198.18.0.1/16',
		'  default-nameserver:',
		'    - 223.5.5.5',
		'    - 119.29.29.29',
		'  nameserver:',
		'    - https://doh.pub/dns-query',
		'    - https://dns.alidns.com/dns-query',
		'  fallback:',
		'    - https://1.1.1.1/dns-query',
		'    - https://dns.google/dns-query',
		'  fallback-filter:',
		'    geoip: true',
		'    geoip-code: CN',
	].join('\n');
	const proxiesYaml = 'proxies:\n' + proxies.map(p => '  - ' + toFlow(cleanUndefined(p))).join('\n');
	const groupsYaml = 'proxy-groups:\n' + proxyGroups.map(g => '  - ' + toFlow(cleanUndefined(g))).join('\n');
	const rulesYaml = 'rules:\n' + rules.map(r => '  - ' + quoteYaml(clashRuleString(r))).join('\n');
	return [header, proxiesYaml, groupsYaml, rulesYaml].join('\n') + '\n';
}

function cleanUndefined(v) {
	if (Array.isArray(v)) return v.map(cleanUndefined);
	if (v && typeof v === 'object') {
		const o = {};
		for (const k of Object.keys(v)) {
			if (v[k] === undefined || v[k] === null) continue;
			o[k] = cleanUndefined(v[k]);
		}
		return o;
	}
	return v;
}

function toFlow(value) {
	if (Array.isArray(value)) return '[' + value.map(toFlow).join(', ') + ']';
	if (value && typeof value === 'object') {
		return '{' + Object.keys(value).map(k => `${flowKey(k)}: ${toFlow(value[k])}`).join(', ') + '}';
	}
	if (typeof value === 'boolean' || typeof value === 'number') return String(value);
	return quoteYaml(String(value));
}

function flowKey(k) { return /^[A-Za-z0-9_.-]+$/.test(k) ? k : quoteYaml(k); }
function quoteYaml(s) { return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'; }

// 国旗 emoji 插入（对齐远程后端 emoji=true 行为，仅用于本地 Clash 输出）：
// - 若名称已含国旗 emoji，不重复添加；
// - 若名称以某个前缀开头，则将 emoji 插入到前缀之后，保证前缀仍在最前。
function insertFlagEmoji(name, allPrefixes) {
	if (!name) return name;
	if (/[\u{1F1E6}-\u{1F1FF}]{2}/u.test(name)) return name; // 已有国旗
	let matched = '';
	for (const pfx of (allPrefixes || [])) {
		if (pfx && name.startsWith(pfx) && pfx.length > matched.length) matched = pfx;
	}
	const base = matched ? name.slice(matched.length) : name;
	const flag = detectRegionFlag(base);
	if (!flag) return name;
	return matched + flag + ' ' + base;
}

// 将 ISO 3166-1 alpha-2 国家代码转为国旗 emoji
function codeToFlag(cc) {
	cc = String(cc || '').toUpperCase();
	if (!/^[A-Z]{2}$/.test(cc)) return '';
	return String.fromCodePoint(0x1F1E6 + cc.charCodeAt(0) - 65, 0x1F1E6 + cc.charCodeAt(1) - 65);
}

// 根据节点名称推断国旗 emoji：
// 1) 先按国家/地区名称关键词匹配（中文子串 + 英文词边界，忽略大小写）；
// 2) 若名称不含中文，再尝试匹配名称中独立出现的大写 ISO 国家代码（如 JP、DE、US）。
function detectRegionFlag(name) {
	if (!name) return '';
	for (const [cc, re] of COUNTRY_NAME_PATTERNS) {
		if (re.test(name)) return codeToFlag(cc);
	}
	if (!/[\u4e00-\u9fff]/.test(name)) {
		const re = /(?:^|[\s\-_/|,.·()\[\]])([A-Z]{2})(?=$|[\s\-_/|,.·()\[\]0-9])/g;
		let mm;
		while ((mm = re.exec(name))) {
			if (ISO_ALPHA2.has(mm[1])) return codeToFlag(mm[1]);
		}
	}
	return '';
}

function escapeRegExp(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// 国家/地区名称关键词 -> ISO 代码。顺序敏感：中文名存在子串包含关系时，具体者在前（如 印尼 在 印度 前，朝鲜 在 韩国 前）。
// 英文名自动加词边界，中文名按子串匹配。
const COUNTRY_DATA = [
	['KP', ['朝鲜', 'North Korea']],
	['KR', ['韩国', '大韩民国', '首尔', 'South Korea', 'Korea']],
	['ID', ['印尼', '印度尼西亚', 'Indonesia']],
	['IN', ['印度', 'India']],
	['CN', ['中国', '回国', 'China']],
	['HK', ['香港', 'Hong Kong', 'HongKong']],
	['TW', ['台湾', '臺灣', 'Taiwan']],
	['MO', ['澳门', 'Macao', 'Macau']],
	['JP', ['日本', 'Japan', '东京', '大阪']],
	['SG', ['新加坡', '狮城', 'Singapore']],
	['MY', ['马来西亚', 'Malaysia']],
	['TH', ['泰国', 'Thailand']],
	['VN', ['越南', 'Vietnam']],
	['PH', ['菲律宾', 'Philippines']],
	['PK', ['巴基斯坦', 'Pakistan']],
	['BD', ['孟加拉', 'Bangladesh']],
	['LK', ['斯里兰卡', 'Sri Lanka']],
	['NP', ['尼泊尔', 'Nepal']],
	['KH', ['柬埔寨', 'Cambodia']],
	['LA', ['老挝', 'Laos']],
	['MM', ['缅甸', 'Myanmar', 'Burma']],
	['MN', ['蒙古', 'Mongolia']],
	['KZ', ['哈萨克斯坦', 'Kazakhstan']],
	['UZ', ['乌兹别克斯坦', 'Uzbekistan']],
	['KG', ['吉尔吉斯斯坦', 'Kyrgyzstan']],
	['TJ', ['塔吉克斯坦', 'Tajikistan']],
	['TM', ['土库曼斯坦', 'Turkmenistan']],
	['AZ', ['阿塞拜疆', 'Azerbaijan']],
	['GE', ['格鲁吉亚', 'Georgia']],
	['AM', ['亚美尼亚', 'Armenia']],
	['TR', ['土耳其', 'Turkey', 'Turkiye']],
	['AE', ['阿联酋', '迪拜', 'United Arab Emirates', 'Dubai']],
	['SA', ['沙特', '沙特阿拉伯', 'Saudi Arabia']],
	['QA', ['卡塔尔', 'Qatar']],
	['KW', ['科威特', 'Kuwait']],
	['BH', ['巴林', 'Bahrain']],
	['OM', ['阿曼', 'Oman']],
	['IL', ['以色列', 'Israel']],
	['JO', ['约旦', 'Jordan']],
	['LB', ['黎巴嫩', 'Lebanon']],
	['IQ', ['伊拉克', 'Iraq']],
	['IR', ['伊朗', 'Iran']],
	['SY', ['叙利亚', 'Syria']],
	['YE', ['也门', 'Yemen']],
	['GB', ['英国', 'United Kingdom', '伦敦', 'Britain', 'England']],
	['IE', ['爱尔兰', 'Ireland']],
	['FR', ['法国', 'France', '巴黎']],
	['DE', ['德国', 'Germany', '法兰克福']],
	['NL', ['荷兰', 'Netherlands', 'Holland']],
	['BE', ['比利时', 'Belgium']],
	['LU', ['卢森堡', 'Luxembourg']],
	['CH', ['瑞士', 'Switzerland']],
	['AT', ['奧地利', '奥地利', 'Austria']],
	['IT', ['意大利', 'Italy']],
	['ES', ['西班牙', 'Spain']],
	['PT', ['葡萄牙', 'Portugal']],
	['GR', ['希腊', 'Greece']],
	['SE', ['瑞典', 'Sweden']],
	['NO', ['挪威', 'Norway']],
	['DK', ['丹麦', 'Denmark']],
	['FI', ['芬兰', 'Finland']],
	['IS', ['冰岛', 'Iceland']],
	['PL', ['波兰', 'Poland']],
	['CZ', ['捷克', 'Czech', 'Czechia', 'Czech Republic']],
	['SK', ['斯洛伐克', 'Slovakia']],
	['HU', ['匈牙利', 'Hungary']],
	['RO', ['罗马尼亚', 'Romania']],
	['BG', ['保加利亚', 'Bulgaria']],
	['HR', ['克罗地亚', 'Croatia']],
	['SI', ['斯洛文尼亚', 'Slovenia']],
	['RS', ['塞尔维亚', 'Serbia']],
	['UA', ['乌克兰', 'Ukraine']],
	['BY', ['白俄罗斯', 'Belarus']],
	['RU', ['俄罗斯', 'Russia', '莫斯科']],
	['EE', ['爱沙尼亚', 'Estonia']],
	['LV', ['拉脱维亚', 'Latvia']],
	['LT', ['立陶宛', 'Lithuania']],
	['MD', ['摩尔多瓦', 'Moldova']],
	['AL', ['阿尔巴尼亚', 'Albania']],
	['MK', ['北马其顿', 'Macedonia']],
	['BA', ['波黑', 'Bosnia']],
	['ME', ['黑山', 'Montenegro']],
	['MT', ['马耳他', 'Malta']],
	['CY', ['塞浦路斯', 'Cyprus']],
	['US', ['美国', 'United States', '洛杉矶', '硅谷', '圣何塞', '纽约']],
	['CA', ['加拿大', 'Canada']],
	['MX', ['墨西哥', 'Mexico']],
	['BR', ['巴西', 'Brazil']],
	['AR', ['阿根廷', 'Argentina']],
	['CL', ['智利', 'Chile']],
	['CO', ['哥伦比亚', 'Colombia']],
	['PE', ['秘鲁', 'Peru']],
	['VE', ['委内瑞拉', 'Venezuela']],
	['EC', ['厄瓜多尔', 'Ecuador']],
	['UY', ['乌拉圭', 'Uruguay']],
	['PY', ['巴拉圭', 'Paraguay']],
	['BO', ['玻利维亚', 'Bolivia']],
	['PA', ['巴拿马', 'Panama']],
	['CR', ['哥斯达黎加', 'Costa Rica']],
	['GT', ['危地马拉', 'Guatemala']],
	['CU', ['古巴', 'Cuba']],
	['DO', ['多米尼加', 'Dominican Republic']],
	['PR', ['波多黎各', 'Puerto Rico']],
	['ZA', ['南非', 'South Africa']],
	['EG', ['埃及', 'Egypt']],
	['MA', ['摩洛哥', 'Morocco']],
	['DZ', ['阿尔及利亚', 'Algeria']],
	['TN', ['突尼斯', 'Tunisia']],
	['NG', ['尼日利亚', 'Nigeria']],
	['KE', ['肯尼亚', 'Kenya']],
	['GH', ['加纳', 'Ghana']],
	['ET', ['埃塞俄比亚', 'Ethiopia']],
	['TZ', ['坦桑尼亚', 'Tanzania']],
	['UG', ['乌干达', 'Uganda']],
	['AO', ['安哥拉', 'Angola']],
	['AU', ['澳大利亚', 'Australia', '悉尼']],
	['NZ', ['新西兰', 'New Zealand']],
];

const COUNTRY_NAME_PATTERNS = COUNTRY_DATA.map(([cc, kws]) => [cc, new RegExp(kws.map(k => (/[A-Za-z]/.test(k) && !/[\u4e00-\u9fff]/.test(k)) ? ('(?<![A-Za-z])' + escapeRegExp(k) + '(?![A-Za-z])') : escapeRegExp(k)).join('|'), 'i')]);

// 全部合法 ISO 3166-1 alpha-2 代码（用于名称中大写代码的兼底匹配，覆盖一切 emoji 支持的国家）
const ISO_ALPHA2 = new Set('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' '));

/* ==================== Sing-box 输出 ==================== */
function emitSingbox(proxies, proxyGroups, rules) {
	const mapOut = (n) => n === 'REJECT' ? 'block' : (n === 'DIRECT' ? 'direct' : n);
	const outbounds = [];
	const nodeTags = new Set();
	for (const p of proxies) {
		const o = clashToSingbox(p);
		if (o) { outbounds.push(o); nodeTags.add(p.name); }
	}
	for (const g of proxyGroups) {
		const members = (g.proxies || []).map(mapOut).filter(n => n === 'direct' || n === 'block' || nodeTags.has(n) || proxyGroups.some(x => x.name === n));
		const list = members.length ? members : ['direct'];
		if (g.type === 'url-test' || g.type === 'fallback' || g.type === 'load-balance') {
			outbounds.push({ type: 'urltest', tag: g.name, outbounds: list, url: g.url || 'https://www.gstatic.com/generate_204', interval: `${g.interval || 300}s` });
		} else {
			outbounds.push({ type: 'selector', tag: g.name, outbounds: list });
		}
	}
	outbounds.push({ type: 'direct', tag: 'direct' });
	outbounds.push({ type: 'block', tag: 'block' });
	outbounds.push({ type: 'dns', tag: 'dns-out' });

	const fieldMap = { 'DOMAIN': 'domain', 'DOMAIN-SUFFIX': 'domain_suffix', 'DOMAIN-KEYWORD': 'domain_keyword', 'IP-CIDR': 'ip_cidr', 'IP-CIDR6': 'ip_cidr', 'IP6-CIDR': 'ip_cidr', 'GEOIP': 'geoip', 'GEOSITE': 'geosite' };
	const routeRules = [{ port: 53, outbound: 'dns-out' }];
	let finalOut = 'direct';
	for (const r of rules) {
		if (r.t === 'MATCH') { finalOut = mapOut(r.group); continue; }
		const field = fieldMap[r.t];
		if (!field) continue;
		const outbound = mapOut(r.group);
		const last = routeRules[routeRules.length - 1];
		if (last && last.outbound === outbound && last._field === field) last[field].push(r.v);
		else routeRules.push({ _field: field, [field]: [r.v], outbound });
	}
	const cleanRules = routeRules.map(rr => { const { _field, ...rest } = rr; return rest; });

	const config = {
		log: { level: 'info', timestamp: true },
		dns: { servers: [{ tag: 'google', address: 'https://8.8.8.8/dns-query', detour: 'direct' }, { tag: 'local', address: '223.5.5.5', detour: 'direct' }], strategy: 'prefer_ipv4' },
		inbounds: [{ type: 'mixed', tag: 'mixed-in', listen: '127.0.0.1', listen_port: 2080 }],
		outbounds,
		route: { rules: cleanRules, final: finalOut, auto_detect_interface: true },
	};
	return JSON.stringify(config, null, 2);
}

// Clash 代理对象 -> Sing-box outbound
function clashToSingbox(p) {
	const base = { tag: p.name, server: p.server, server_port: Number(p.port) };
	const buildTls = () => {
		const t = { enabled: true };
		if (p.servername || p.sni) t.server_name = p.servername || p.sni;
		if (p['skip-cert-verify']) t.insecure = true;
		if (p.alpn) t.alpn = p.alpn;
		if (p['client-fingerprint']) t.utls = { enabled: true, fingerprint: p['client-fingerprint'] };
		if (p['reality-opts']) t.reality = { enabled: true, public_key: p['reality-opts']['public-key'], short_id: p['reality-opts']['short-id'] };
		return t;
	};
	const buildTransport = () => {
		if (p.network === 'ws') { const tr = { type: 'ws', path: (p['ws-opts'] && p['ws-opts'].path) || '/' }; const h = p['ws-opts'] && p['ws-opts'].headers; if (h && h.Host) tr.headers = { Host: h.Host }; return tr; }
		if (p.network === 'grpc') return { type: 'grpc', service_name: (p['grpc-opts'] && p['grpc-opts']['grpc-service-name']) || '' };
		return undefined;
	};
	switch (p.type) {
		case 'ss': return { type: 'shadowsocks', ...base, method: p.cipher, password: p.password };
		case 'vmess': { const o = { type: 'vmess', ...base, uuid: p.uuid, security: p.cipher || 'auto', alter_id: Number(p.alterId || 0) }; if (p.tls) o.tls = buildTls(); const tr = buildTransport(); if (tr) o.transport = tr; return o; }
		case 'vless': { const o = { type: 'vless', ...base, uuid: p.uuid }; if (p.flow) o.flow = p.flow; if (p.tls) o.tls = buildTls(); const tr = buildTransport(); if (tr) o.transport = tr; return o; }
		case 'trojan': { const o = { type: 'trojan', ...base, password: p.password, tls: buildTls() }; if (!o.tls.server_name) o.tls.server_name = p.server; const tr = buildTransport(); if (tr) o.transport = tr; return o; }
		case 'hysteria2': { const o = { type: 'hysteria2', ...base, password: p.password, tls: buildTls() }; if (!o.tls.server_name) o.tls.server_name = p.server; if (p.obfs) o.obfs = { type: p.obfs, password: p['obfs-password'] }; return o; }
		case 'tuic': { const o = { type: 'tuic', ...base, uuid: p.uuid, password: p.password, tls: buildTls() }; if (!o.tls.server_name) o.tls.server_name = p.server; if (p['congestion-controller']) o.congestion_control = p['congestion-controller']; return o; }
		default: return null; // ssr 等 sing-box 不支持
	}
}

/* ==================== Surge 输出 ==================== */
function emitSurge(proxies, proxyGroups, rules) {
	const proxyLines = [];
	const emitted = new Set(['DIRECT', 'REJECT']);
	for (const p of proxies) {
		const line = surgeProxyLine(p);
		if (line) { proxyLines.push(line); emitted.add(p.name); }
	}
	const groupNames = new Set(proxyGroups.map(g => g.name));
	const groupLines = proxyGroups.map(g => surgeGroupLine(g, emitted, groupNames));
	const ruleLines = [];
	for (const r of rules) { const s = surgeRuleString(r); if (s) ruleLines.push(s); }
	const general = ['[General]', 'loglevel = notify', 'dns-server = 223.5.5.5, 119.29.29.29, system', 'skip-proxy = 127.0.0.1, 192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12, localhost, *.local', 'ipv6 = true'].join('\n');
	return [general, '', '[Proxy]', 'DIRECT = direct', ...proxyLines, '', '[Proxy Group]', ...groupLines, '', '[Rule]', ...ruleLines].join('\n') + '\n';
}

function surgeWsParams(p) {
	if (p.network !== 'ws') return '';
	let s = `, ws=true, ws-path=${(p['ws-opts'] && p['ws-opts'].path) || '/'}`;
	const h = p['ws-opts'] && p['ws-opts'].headers;
	if (h && h.Host) s += `, ws-headers=Host:"${h.Host}"`;
	return s;
}

function surgeProxyLine(p) {
	switch (p.type) {
		case 'ss': return `${p.name} = ss, ${p.server}, ${p.port}, encrypt-method=${p.cipher}, password=${p.password}, udp-relay=true`;
		case 'vmess': {
			let s = `${p.name} = vmess, ${p.server}, ${p.port}, username=${p.uuid}`;
			if (p.tls) s += `, tls=true` + ((p.servername || p.sni) ? `, sni=${p.servername || p.sni}` : '') + (p['skip-cert-verify'] ? `, skip-cert-verify=true` : '');
			return s + surgeWsParams(p);
		}
		case 'trojan': {
			let s = `${p.name} = trojan, ${p.server}, ${p.port}, password=${p.password}`;
			if (p.sni || p.servername) s += `, sni=${p.sni || p.servername}`;
			if (p['skip-cert-verify']) s += `, skip-cert-verify=true`;
			return s + surgeWsParams(p);
		}
		case 'hysteria2': {
			let s = `${p.name} = hysteria2, ${p.server}, ${p.port}, password=${p.password}`;
			if (p.sni || p.servername) s += `, sni=${p.sni || p.servername}`;
			if (p['skip-cert-verify']) s += `, skip-cert-verify=true`;
			return s;
		}
		case 'tuic': {
			let s = `${p.name} = tuic-v5, ${p.server}, ${p.port}, uuid=${p.uuid}, password=${p.password}`;
			if (p.sni || p.servername) s += `, sni=${p.sni || p.servername}`;
			if (p['skip-cert-verify']) s += `, skip-cert-verify=true`;
			return s;
		}
		default: return null; // vless / ssr Surge 不支持
	}
}

function surgeGroupLine(g, emitted, groupNames) {
	const members = (g.proxies || []).filter(n => n === 'DIRECT' || n === 'REJECT' || groupNames.has(n) || emitted.has(n));
	const list = members.length ? members : ['DIRECT'];
	let type = g.type === 'load-balance' ? 'url-test' : g.type;
	if (type === 'url-test' || type === 'fallback') {
		return `${g.name} = ${type}, ${list.join(', ')}, url=${g.url || 'http://www.gstatic.com/generate_204'}, interval=${g.interval || 300}`;
	}
	return `${g.name} = select, ${list.join(', ')}`;
}

const SURGE_RULE_MAP = { 'DOMAIN': 'DOMAIN', 'DOMAIN-SUFFIX': 'DOMAIN-SUFFIX', 'DOMAIN-KEYWORD': 'DOMAIN-KEYWORD', 'IP-CIDR': 'IP-CIDR', 'IP-CIDR6': 'IP-CIDR6', 'IP6-CIDR': 'IP-CIDR6', 'GEOIP': 'GEOIP', 'DST-PORT': 'DEST-PORT', 'SRC-IP-CIDR': 'SRC-IP', 'PROCESS-NAME': 'PROCESS-NAME' };
function surgeRuleString(r) {
	if (r.t === 'MATCH') return `FINAL,${r.group}`;
	const t = SURGE_RULE_MAP[r.t];
	if (!t) return null;
	return `${t},${r.v},${r.group}` + (r.noResolve ? ',no-resolve' : '');
}

/* ==================== Loon 输出 ==================== */
function emitLoon(proxies, proxyGroups, rules) {
	const proxyLines = [];
	const emitted = new Set(['DIRECT', 'REJECT']);
	for (const p of proxies) {
		const line = loonProxyLine(p);
		if (line) { proxyLines.push(line); emitted.add(p.name); }
	}
	const groupNames = new Set(proxyGroups.map(g => g.name));
	const groupLines = proxyGroups.map(g => surgeGroupLine(g, emitted, groupNames)); // Loon 与 Surge 代理组语法一致
	const ruleLines = [];
	for (const r of rules) { const s = surgeRuleString(r); if (s) ruleLines.push(s); } // Loon 规则语法与 Surge 一致
	const general = ['[General]', 'ipv6 = true', 'dns-server = 223.5.5.5, 119.29.29.29'].join('\n');
	return [general, '', '[Proxy]', ...proxyLines, '', '[Proxy Group]', ...groupLines, '', '[Rule]', ...ruleLines].join('\n') + '\n';
}

function loonProxyLine(p) {
	switch (p.type) {
		case 'ss': return `${p.name} = Shadowsocks,${p.server},${p.port},${p.cipher},"${p.password}",fast-open=false,udp=true`;
		case 'vmess': {
			let s = `${p.name} = vmess,${p.server},${p.port},${p.cipher || 'auto'},"${p.uuid}"`;
			if (p.network === 'ws') { s += `,transport:ws,path:${(p['ws-opts'] && p['ws-opts'].path) || '/'}`; const h = p['ws-opts'] && p['ws-opts'].headers; if (h && h.Host) s += `,host:${h.Host}`; } else { s += `,transport:tcp`; }
			if (p.tls) s += `,over-tls:true,tls-name:${p.servername || p.sni || p.server}` + (p['skip-cert-verify'] ? `,skip-cert-verify:true` : '');
			return s;
		}
		case 'trojan': {
			let s = `${p.name} = trojan,${p.server},${p.port},"${p.password}"`;
			s += `,tls-name:${p.sni || p.servername || p.server}` + (p['skip-cert-verify'] ? `,skip-cert-verify:true` : '');
			if (p.network === 'ws') { s += `,transport:ws,path:${(p['ws-opts'] && p['ws-opts'].path) || '/'}`; const h = p['ws-opts'] && p['ws-opts'].headers; if (h && h.Host) s += `,host:${h.Host}`; }
			return s;
		}
		case 'hysteria2': return `${p.name} = Hysteria2,${p.server},${p.port},"${p.password}",sni=${p.sni || p.servername || p.server}` + (p['skip-cert-verify'] ? `,skip-cert-verify=true` : '');
		case 'vless': {
			let s = `${p.name} = VLESS,${p.server},${p.port},"${p.uuid}"`;
			if (p.network === 'ws') { s += `,transport:ws,path:${(p['ws-opts'] && p['ws-opts'].path) || '/'}`; const h = p['ws-opts'] && p['ws-opts'].headers; if (h && h.Host) s += `,host:${h.Host}`; }
			if (p.tls) s += `,over-tls:true,tls-name:${p.servername || p.sni || p.server}` + (p['skip-cert-verify'] ? `,skip-cert-verify:true` : '');
			return s;
		}
		default: return null;
	}
}

/* ==================== Quantumult X 输出 ==================== */
function emitQuanx(proxies, proxyGroups, rules) {
	const serverLines = [];
	const emitted = new Set(['direct', 'reject']);
	for (const p of proxies) {
		const line = quanxServerLine(p);
		if (line) { serverLines.push(line); emitted.add(p.name); }
	}
	const groupNames = new Set(proxyGroups.map(g => g.name));
	const mapM = (n) => n === 'DIRECT' ? 'direct' : (n === 'REJECT' ? 'reject' : n);
	const policyLines = proxyGroups.map(g => {
		const members = (g.proxies || []).map(mapM).filter(n => n === 'direct' || n === 'reject' || groupNames.has(n) || emitted.has(n));
		const list = members.length ? members : ['direct'];
		if (g.type === 'url-test' || g.type === 'fallback') return `url-latency-benchmark=${g.name}, ${list.join(', ')}, check-interval=${g.interval || 300}, tolerance=${g.tolerance || 100}`;
		if (g.type === 'load-balance') return `round-robin=${g.name}, ${list.join(', ')}`;
		return `static=${g.name}, ${list.join(', ')}`;
	});
	const filterLines = [];
	for (const r of rules) { const s = quanxFilterString(r); if (s) filterLines.push(s); }
	return ['[general]', '', '[dns_server]', 'server=223.5.5.5', 'server=119.29.29.29', '', '[policy]', ...policyLines, '', '[server_local]', ...serverLines, '', '[filter_local]', ...filterLines, '', '[rewrite_local]', '', '[mitm]'].join('\n') + '\n';
}

function quanxServerLine(p) {
	switch (p.type) {
		case 'ss': return `shadowsocks=${p.server}:${p.port}, method=${p.cipher}, password=${p.password}, udp-relay=true, tag=${p.name}`;
		case 'vmess': {
			let s = `vmess=${p.server}:${p.port}, method=chacha20-ietf-poly1305, password=${p.uuid}`;
			if (p.network === 'ws') { s += `, obfs=${p.tls ? 'wss' : 'ws'}, obfs-uri=${(p['ws-opts'] && p['ws-opts'].path) || '/'}`; const h = p['ws-opts'] && p['ws-opts'].headers; if (h && h.Host) s += `, obfs-host=${h.Host}`; }
			else if (p.tls) s += `, obfs=over-tls`;
			if (p.tls && (p.servername || p.sni)) s += `, tls-host=${p.servername || p.sni}`;
			if (p['skip-cert-verify']) s += `, tls-verification=false`;
			return s + `, tag=${p.name}`;
		}
		case 'trojan': {
			let s = `trojan=${p.server}:${p.port}, password=${p.password}, over-tls=true`;
			if (p.sni || p.servername) s += `, tls-host=${p.sni || p.servername}`;
			if (p['skip-cert-verify']) s += `, tls-verification=false`;
			return s + `, tag=${p.name}`;
		}
		case 'http': return null;
		default: return null; // vless / ssr / hysteria2 / tuic QuanX 不（或不稳定）支持
	}
}

const QUANX_RULE_MAP = { 'DOMAIN': 'host', 'DOMAIN-SUFFIX': 'host-suffix', 'DOMAIN-KEYWORD': 'host-keyword', 'IP-CIDR': 'ip-cidr', 'IP-CIDR6': 'ip6-cidr', 'IP6-CIDR': 'ip6-cidr', 'GEOIP': 'geoip' };
function quanxFilterString(r) {
	if (r.t === 'MATCH') return `final, ${r.group}`;
	const t = QUANX_RULE_MAP[r.t];
	if (!t) return null;
	return `${t}, ${r.v}, ${r.group}` + (r.noResolve ? ', no-resolve' : '');
}





