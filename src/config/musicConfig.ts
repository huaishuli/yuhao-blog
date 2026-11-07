import type { MusicPlayerConfig } from "../types/musicConfig";

// 音乐播放器配置
export const musicPlayerConfig: MusicPlayerConfig = {
	// 是否在导航栏显示音乐播放器入口
	showInNavbar: true,

	// 是否在侧边栏显示音乐播放器组件
	showInSidebar: true,

	// 使用方式："meting" 使用 Meting API，"local" 使用本地音乐列表
	mode: "local",

	// 默认音量 (0-1)
	volume: 0.7,

	// 播放模式：'list'=列表循环, 'one'=单曲循环, 'random'=随机播放
	playMode: "list",

	// 是否启用歌词（本地曲目没有 .lrc 文件，故关闭）
	showLyrics: false,

	// Meting API 配置（mode 为 "meting" 时使用，当前已在本地模式下停用）
	meting: {
		// Meting API 地址
		// 主 API 必须同时支持 playlist 列表与 url 取流，api.i-meto.com 取流已失效（404），故不再作为主 API
		api: "https://api.injahow.cn/meting/?server=:server&type=:type&id=:id",
		// 音乐平台：netease=网易云音乐, tencent=QQ音乐, kugou=酷狗音乐, xiami=虾米音乐, baidu=百度音乐
		server: "netease",
		// 类型：song=单曲, playlist=歌单, album=专辑, search=搜索, artist=艺术家
		type: "playlist",
		// 歌单/专辑/单曲 ID 或搜索关键词
		// 换成自己的歌单：https://music.163.com/#/playlist?id=歌单ID
		id: "18569150326",
		// 认证 token（可选）
		auth: "",
		// 备用 API 配置（当主 API 失败时使用）
		fallbackApis: [
			"https://api.i-meto.com/meting/api?server=:server&type=:type&id=:id&r=:r",
			"https://api.moeyao.cn/meting/?server=:server&type=:type&id=:id",
		],
	},

	// 本地音乐配置（当 mode 为 'local' 时使用）
	// 音频放在 public/assets/music/，封面放在 public/assets/music/cover/
	// 1. 支持传入歌词文件的路径
	// lrc: "/assets/music/lrc/xxx.lrc",
	// 2. 或者直接填入歌词字符串内容
	// lrc: "[00:00.00]歌词内容...",
	local: {
		playlist: [
			{
				// 3:40 · 8.6MB
				name: "Alive",
				artist: "Blue",
				url: "/assets/music/blue-alive.mp3",
				cover: "/assets/music/cover/blue-alive.jpg",
				lrc: "",
			},
			{
				// 3:38 · 8.3MB
				name: "Talking to the Moon",
				artist: "Bruno Mars",
				url: "/assets/music/bruno-mars-talking-to-the-moon.mp3",
				cover: "/assets/music/cover/bruno-mars-talking-to-the-moon.jpg",
				lrc: "",
			},
			{
				// 4:14 · 9.7MB
				name: "We Don't Talk Anymore (Mr. Collipark Remix)",
				artist: "Charlie Puth / Selena Gomez / Mr. Collipark",
				url: "/assets/music/charlie-puth-we-don-t-talk-anymore-mr-collipark-remix.mp3",
				cover: "/assets/music/cover/charlie-puth-we-don-t-talk-anymore-mr-collipark-remix.jpg",
				lrc: "",
			},
			{
				// 4:54 · 11.5MB
				name: "Who Loves You",
				artist: "Emmelie de Forest",
				url: "/assets/music/emmelie-de-forest-who-loves-you.mp3",
				cover: "/assets/music/cover/emmelie-de-forest-who-loves-you.jpg",
				lrc: "",
			},
			{
				// 2:43 · 6.5MB
				name: "Remember Our Summer",
				artist: "FrogMonster 蛙蛙",
				url: "/assets/music/frogmonster-remember-our-summer.mp3",
				cover: "/assets/music/cover/frogmonster-remember-our-summer.jpg",
				lrc: "",
			},
			{
				// 3:12 · 7.4MB
				name: "Shots (Broiler Remix)",
				artist: "Imagine Dragons / Broiler",
				url: "/assets/music/imagine-dragons-shots-broiler-remix.mp3",
				cover: "/assets/music/cover/imagine-dragons-shots-broiler-remix.jpg",
				lrc: "",
			},
			{
				// 3:31 · 8.2MB
				name: "Please Don't Go",
				artist: "Joel Adams",
				url: "/assets/music/joel-adams-please-don-t-go.mp3",
				cover: "/assets/music/cover/joel-adams-please-don-t-go.jpg",
				lrc: "",
			},
			{
				// 3:11 · 7.4MB
				name: "Fatal Love",
				artist: "Jori King",
				url: "/assets/music/jori-king-fatal-love.mp3",
				cover: "/assets/music/cover/jori-king-fatal-love.jpg",
				lrc: "",
			},
			{
				// 3:02 · 7.3MB
				name: "Sky High (Radio Edit)",
				artist: "Lasgo",
				url: "/assets/music/lasgo-sky-high-radio-edit.mp3",
				cover: "/assets/music/cover/lasgo-sky-high-radio-edit.jpg",
				lrc: "",
			},
			{
				// 3:57 · 9.1MB
				name: "7 Years",
				artist: "Lukas Graham",
				url: "/assets/music/lukas-graham-7-years.mp3",
				cover: "/assets/music/cover/lukas-graham-7-years.jpg",
				lrc: "",
			},
			{
				// 4:04 · 9.4MB
				name: "Midnight City",
				artist: "M83",
				url: "/assets/music/m83-midnight-city.mp3",
				cover: "/assets/music/cover/m83-midnight-city.jpg",
				lrc: "",
			},
			{
				// 3:33 · 8.3MB
				name: "Edge Of My Life",
				artist: "Manafest",
				url: "/assets/music/manafest-edge-of-my-life.mp3",
				cover: "/assets/music/cover/manafest-edge-of-my-life.jpg",
				lrc: "",
			},
			{
				// 3:51 · 8.9MB
				name: "Animals",
				artist: "Maroon 5",
				url: "/assets/music/maroon-5-animals.mp3",
				cover: "/assets/music/cover/maroon-5-animals.jpg",
				lrc: "",
			},
			{
				// 3:52 · 9.0MB
				name: "Payphone",
				artist: "Maroon 5 / Wiz Khalifa",
				url: "/assets/music/maroon-5-payphone.mp3",
				cover: "/assets/music/cover/maroon-5-payphone.jpg",
				lrc: "",
			},
			{
				// 3:48 · 8.8MB
				name: "The Way I Still Love You",
				artist: "Reynard Silva",
				url: "/assets/music/reynard-silva-the-way-i-still-love-you.mp3",
				cover: "/assets/music/cover/reynard-silva-the-way-i-still-love-you.jpg",
				lrc: "",
			},
			{
				// 3:12 · 7.6MB
				name: "Way Back Home (Sam Feldt Edit)",
				artist: "SHAUN / Conor Maynard / Sam Feldt",
				url: "/assets/music/shaun-way-back-home-sam-feldt-edit.mp3",
				cover: "/assets/music/cover/shaun-way-back-home-sam-feldt-edit.jpg",
				lrc: "",
			},
			{
				// 2:57 · 6.8MB
				name: "Love Is Gone (Acoustic)",
				artist: "SLANDER / Dylan Matthew",
				url: "/assets/music/slander-love-is-gone-acoustic.mp3",
				cover: "/assets/music/cover/slander-love-is-gone-acoustic.jpg",
				lrc: "",
			},
			{
				// 3:30 · 8.3MB
				name: "Reminding Me",
				artist: "Shawn Hook / Vanessa Hudgens",
				url: "/assets/music/shawn-hook-reminding-me.mp3",
				cover: "/assets/music/cover/shawn-hook-reminding-me.jpg",
				lrc: "",
			},
			{
				// 3:21 · 7.8MB
				name: "Everything I Need",
				artist: "Skylar Grey",
				url: "/assets/music/skylar-grey-everything-i-need.mp3",
				cover: "/assets/music/cover/skylar-grey-everything-i-need.jpg",
				lrc: "",
			},
			{
				// 3:22 · 7.9MB
				name: "Hall of Fame",
				artist: "The Script / will.i.am",
				url: "/assets/music/the-script-hall-of-fame.mp3",
				cover: "/assets/music/cover/the-script-hall-of-fame.jpg",
				lrc: "",
			},
			{
				// 4:29 · 10.6MB
				name: "Watch Me Work",
				artist: "Tinashe",
				url: "/assets/music/tinashe-watch-me-work.mp3",
				cover: "/assets/music/cover/tinashe-watch-me-work.jpg",
				lrc: "",
			},
			{
				// 3:14 · 7.7MB
				name: "Walk Thru Fire",
				artist: "Vicetone / Meron Ryan",
				url: "/assets/music/vicetone-walk-thru-fire.mp3",
				cover: "/assets/music/cover/vicetone-walk-thru-fire.jpg",
				lrc: "",
			},
			{
				// 3:50 · 8.8MB
				name: "See You Again",
				artist: "Wiz Khalifa / Charlie Puth",
				url: "/assets/music/wiz-khalifa-see-you-again.mp3",
				cover: "/assets/music/cover/wiz-khalifa-see-you-again.jpg",
				lrc: "",
			},
		],
	},
};
