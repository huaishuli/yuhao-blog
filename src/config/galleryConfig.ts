import type { GalleryConfig } from "@/types/galleryConfig";

// 相册配置
// 相册内容（名称/描述/标签/照片等）已迁移到 `src/content/gallery/*.md`，
// 可直接在 Pages CMS 的「相册」里增删改；这里只保留与版式相关的设置。
export const galleryConfig: GalleryConfig = {
	albums: [],

	// 瀑布流最小列宽(px)，浏览器根据容器宽度自动计算列数，默认 240
	// 值越小列数越多，值越大列数越少
	columnWidth: 240,
};
