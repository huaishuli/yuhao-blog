---
title: 这个博客是怎么搭起来的
published: 2026-11-03
updated: 2026-11-07
description: Astro + Cloudflare Pages + Pages CMS：从本地构建到线上发布，以及我怎么在浏览器里写文章。
category: 技术
tags:
  - Astro
  - Cloudflare
  - 博客搭建
image: /assets/images/uploads/202611041522342763-1.jpg
draft: false
pinned: true
slug: how-this-blog-works
comment: true
---
## 技术栈

这个站点是一套纯静态的 Astro 博客：


| 部分 | 选择 | 说明 |
| --- | ------------------------------------------------ | ------------------------ |
| 框架 | [Astro](https://astro.build) | 静态输出，交互组件用 Svelte 岛 |
| 样式 | Tailwind CSS | 主题色、明暗模式都走 CSS 变量 |
| 搜索 | Pagefind | 构建时生成索引，纯前端检索 |
| 托管 | [Cloudflare Pages](https://pages.cloudflare.com) | 连 GitHub 仓库，push 即自动构建部署 |
| 写作 | [Pages CMS](https://app.pagescms.org) | 浏览器里的后台，提交即 commit |


## 发布流程

1. 在 Pages CMS 里新建文章，填标题、发布时间、分类、标签，正文用富文本或 Markdown 写；
2. 保存后它会把文件 commit 到 GitHub 仓库的 `main` 分支；
3. Cloudflare Pages 检测到新提交，自动跑 `pnpm build`；
4. 构建完成后一两分钟，线上就是新内容了。

如果直接改代码，本地跑一次 `pnpm build && pnpm deploy` 也能发布，两者互不冲突。

## 一些配置上的取舍

- **图片**：文章配图放在 `src/content/posts/images/`（构建时优化成 avif/webp），后台传的图进 `public/assets/images/uploads/`，走原始文件不压缩。
- **评论**：用 giscus，评论存在 GitHub Discussions 里，不额外维护数据库。
- **搜索与归档**：都由构建时生成的静态数据驱动，没有服务端。

## 源码

整站源码在 [GitHub](https://github.com/huaishuli/yuhao-blog)，欢迎参考，也欢迎提 issue 指出问题。