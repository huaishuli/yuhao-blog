# Huaishuli

Huaishuli is a personal blog built with Astro, hosted on Cloudflare Pages, and written through Pages CMS in the browser.

- Live: <https://huaishuli.pages.dev>
- Fallback (Cloudflare Worker, manual deploy): <https://huaishuli.yuhao-house.workers.dev>

## Stack

| Layer | Choice |
| --- | --- |
| Framework | [Astro 7](https://astro.build) (static output, Svelte islands for interactivity) |
| Styling | Tailwind CSS 4 with CSS-variable theming |
| Search | [Pagefind](https://pagefind.app), index built at build time |
| Comments | giscus (GitHub Discussions) or Twikoo |
| Hosting | [Cloudflare Pages](https://pages.cloudflare.com), auto-deploy on push |
| Writing | [Pages CMS](https://app.pagescms.org), commits straight to the repo |

## Features

- Posts, categories, tags, archive, series, full-text search
- Microblog entries, project showcase, photo albums (optional password), bookmarks, friend links, guestbook
- Light/dark mode, theme hue, switchable sidebar layouts and banner wallpapers
- Markdown extras: syntax highlighting, KaTeX math, Mermaid / PlantUML diagrams, GitHub cards, admonitions
- RSS / Atom feeds, sitemap, generated Open Graph images

## Layout

```
src/
  config/        site configuration (title, nav, sidebar, comments, fonts, …)
  content/       posts, dynamic entries, projects, special pages
  components/    Astro and Svelte components
  layouts/       page shells
  pages/         routes
  styles/        global styles
  utils/         helpers
  plugins/       custom remark / rehype plugins
public/          static assets (favicons, album images, mascot assets)
scripts/         build-time scripts (LQIP, font subsets, Pagefind, …)
deploy-tools/    deployment and ops helpers (Wrangler wrapper, GitHub API commit)
.pages.yml       Pages CMS configuration
wrangler.jsonc   Cloudflare Worker config (static assets mode)
```

## Development

Requires Node.js 22.23+ and pnpm.

```bash
pnpm install
pnpm dev        # dev server at http://localhost:4321
pnpm build      # production build into dist/
pnpm preview    # preview the build
pnpm check      # Astro diagnostics
pnpm type-check # TypeScript check
```

Build pipeline: LQIP → GitHub card data → `astro build` → prune unused mascot assets → font subsetting → inline script minification → Pagefind index.

## Deployment

### Cloudflare Pages (primary)

The repo is connected to the `huaishuli` Pages project; pushing to `main` rebuilds automatically:

- Build command: `pnpm build`
- Output directory: `dist`
- Environment: `NODE_VERSION=22` (optional when the build image already ships Node 22+)

### Cloudflare Worker (fallback, manual)

```bash
npx wrangler deploy
```

On Windows you can run `deploy.cmd`, which builds first. See [DEPLOY.md](./DEPLOY.md).

## Writing posts

1. **Pages CMS** — open <https://app.pagescms.org>, pick this repo, create a post. Title, date, category, tags, cover and body are form fields; the slug field decides the file name and URL. Images land in `public/assets/images/uploads/`.
2. **Edit files** — add a `.md` under `src/content/posts/` with at least `title`, `published`, `slug` and `category`.

Both paths end in a git commit that triggers a rebuild.

## License & credits

The interface derives from [Fuwari](https://github.com/saicaca/fuwari) (Copyright © 2024 saicaca, MIT) and [Firefly](https://github.com/CuteLeaf/Firefly) (Copyright © 2025 CuteLeaf, MIT). Original copyright notices are kept in [LICENSE](./LICENSE) as required by the MIT license.

All theme naming, site identity, navigation, copy and sample content have been replaced with this site's own branding; the upstream projects are credited only as the code's origin.
