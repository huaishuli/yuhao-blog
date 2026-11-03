---
title: "Huaishuli Blog"
slug: huaishuli-blog
published: 2026-11-03
order: 10
description: "我自己的个人博客：Astro 静态站点，托管在 Cloudflare Pages，用 Pages CMS 在浏览器里写文章。"
status: "published"
tags:
  - Astro
  - Cloudflare
  - 博客
link:
  - label: "站点"
    icon: "material-symbols:language"
    value: "https://yuhaohuaishuli.cn"
  - label: "GitHub"
    icon: "fa7-brands:github"
    value: "https://github.com/huaishuli/yuhao-blog"
---

## 这是什么

Huaishuli 是我自己的个人博客，用来放技术笔记、折腾记录和一些日常。

## 技术构成

- **Astro** 做静态生成，页面输出干净、加载快
- **Svelte** 岛负责搜索、目录、设置面板这些交互
- **Pagefind** 提供纯前端全文搜索
- **Cloudflare Pages** 托管，推送仓库即自动构建发布
- **Pages CMS** 作为后台，在浏览器里直接写文章、传图片

## 维护方式

内容与代码都在同一个仓库里，文章是 Markdown 文件，配置是 TypeScript 文件。想改样式或加功能，本地改完推送即可，不需要碰服务器。
