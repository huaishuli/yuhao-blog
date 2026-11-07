导入 类型 { MusicPlayerConfig } 自 "../types/musicConfig";

// 音乐播放器配置
导出 const musicPlayerConfig: MusicPlayerConfig = {
	// 是否在导航栏显示音乐播放器入口
	在导航栏中显示: false,

	// 是否在侧边栏显示音乐播放器组件
	在侧边栏显示: true,

	// 使用方式："meting" 使用 Meting API，"local" 使用本地音乐列表
	模式: "meting",

	// 默认音量 (0-1)
	音量: 0.7,

	// 播放模式：'list'=列表循环, 'one'=单曲循环, 'random'=随机播放
	播放模式: "列表",

	// 是否启用歌词
	显示歌词: true,

	// Meting API 配置
	会议: {
		// Meting API 地址
		// 主 API 必须同时支持 playlist 列表与 url 取流，api.i-meto.com 取流已失效（404），故不再作为主 API
		api: "https://api.injahow.cn/meting/?server=:server&type=:type&id=:id",
		// 音乐平台：netease=网易云音乐, tencent=QQ音乐, kugou=酷狗音乐, xiami=虾米音乐, baidu=百度音乐
		服务器: "网易,
		// 类型：song=单曲, playlist=歌单, album=专辑, search=搜索, artist=艺术家
		类型: "播放列表",
		// 歌单/专辑/单曲 ID 或搜索关键词
		// 换成自己的歌单：https://music.163.com/#/playlist?id=歌单ID
		id: "7561189673",
		// 认证 token（可选）
		认证: "",
		// 备用 API 配置（当主 API 失败时使用）
		fallbackApis: [
			"https://api.i-meto.com/meting/api?server=:server&type=:type&id=:id&r=:r",
			"https://api.moeyao.cn/meting/?server=:server&type=:type&id=:id",
		],
	},

	// 本地音乐配置（当 mode 为 'local' 时使用）
	// 1. 支持传入歌词文件的路径
	// lrc: "/assets/music/lrc/使一颗心免于哀伤-哼唱.lrc",
	// 2. 或者直接填入歌词字符串内容
	// lrc: "[00:00.00]歌词内容...",
	local: {
		playlist: [
			// 示例条目（已停用）：
			// {
			// 	name: "歌名",
			// 	artist: "歌手",
			// 	url: "/assets/music/song.mp3",
			// 	cover: "/assets/music/cover/song.webp",
			// 	lrc: "",
			// },
		],
	},
};
