# Huaishuli

Huaishuli 的个人博客 —— 一个用 Astro 构建的静态站点，托管在 Cloudflare Pages，用 Pages CMS 在浏览器里写文章。

- 线上地址：<https://huaishuli.pages.dev>
- 备用地址（Cloudflare Worker，手动部署）：<https://huaishuli.yuhao-house.workers.dev>

## 技术栈

| 部分 | 方案 |
| --- | --- |
| 框架 | [Astro 7](https://astro.build)（静态输出，交互组件用 Svelte 岛） |
| 样式 | Tailwind CSS 4 + 主题色 CSS 变量 |
| 搜索 | [Pagefind](https://pagefind.app)（构建时生成索引） |
| 评论 | giscus（GitHub Discussions）/ Twikoo，可切换 |
| 托管 | [Cloudflare Pages](https://pages.cloudflare.com)（连 GitHub，push 自动构建） |
| 写作 | [Pages CMS](https://app.pagescms.org)（浏览器后台，保存即提交） |

## 功能

- 文章、分类、标签、归档、系列文章、站内搜索
- 动态（说说）、项目展示、相册（支持密码保护）、书签导航、友情链接、留言板
- 明暗模式、主题色、可切换的侧栏布局与壁纸横幅
- Markdown 增强：代码高亮、KaTeX 公式、Mermaid / PlantUML 图表、GitHub 卡片、提醒块
- RSS / Atom、站点地图、Open Graph 分享图自动生成

## 目录结构

```
src/
  config/        站点配置（标题、导航、侧栏、评论、字体等）
  content/       文章（posts）、动态（dynamic）、项目（projects）、特殊页（spec）
  components/    Astro / Svelte 组件
  layouts/       页面骨架
  pages/         路由
  styles/        全局样式
  utils/         工具函数
  plugins/       自定义 remark / rehype 插件
public/          静态资源（favicon、相册、看板娘素材等）
scripts/         构建期脚本（LQIP、字体子集、Pagefind 等）
deploy-tools/    部署与运维脚本（Wrangler 封装、GitHub API 提交等）
.pages.yml       Pages CMS 后台配置
wrangler.jsonc   Cloudflare Worker 配置（静态资源模式）
```

## 本地开发

需要 Node.js 22.23+ 与 pnpm。

```bash
pnpm install
pnpm dev        # 本地开发，http://localhost:4321
pnpm build      # 生产构建，输出到 dist/
pnpm preview    # 预览构建产物
pnpm check      # Astro 类型与语法检查
pnpm type-check # TypeScript 检查
```

构建流水线：生成 LQIP → 生成 GitHub 卡片数据 → `astro build` → 裁剪未使用的看板娘资源 → 字体子集化 → 压缩内联脚本 → Pagefind 索引。

## 部署

### Cloudflare Pages（主）

仓库已连到 Cloudflare Pages 项目 `huaishuli`，`main` 分支推送后自动构建：

- 构建命令：`pnpm build`
- 输出目录：`dist`
- 环境变量：`NODE_VERSION=22`（可选，构建镜像自带 Node 22+ 时可不设）

### Cloudflare Worker（备用，手动）

```bash
npx wrangler deploy
```

或在 Windows 上直接运行 `deploy.cmd`（会自动构建再部署）。详见 [DEPLOY.md](./DEPLOY.md)。

## 写文章

两种方式：

1. **Pages CMS**：打开 <https://app.pagescms.org>，选择本仓库，新建文章。标题、发布时间、分类、标签、封面、正文都在表单里填；「链接别名」决定文件名和网址。图片上传到 `public/assets/images/uploads/`。
2. **直接改文件**：在 `src/content/posts/` 下新建 `.md`，frontmatter 至少写 `title`、`published`、`slug`、`category`。

两者都通过 git 提交触发重新构建。

## 许可与致谢

本站界面基于 [Fuwari](https://github.com/saicaca/fuwari)（Copyright © 2024 saicaca, MIT）与 [Firefly](https://github.com/CuteLeaf/Firefly)（Copyright © 2025 CuteLeaf, MIT）二次开发，按 MIT 许可证保留原始版权声明，见 [LICENSE](./LICENSE)。

主题名称、站点标识、导航、文案与示例内容已全部替换为本站自己的品牌；上游项目仅作为代码来源被致谢，与本站在内容上无隶属关系。
