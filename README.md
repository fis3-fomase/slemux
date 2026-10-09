# SLEMuX’27 website

Source for the website of **SLEMuX’27**, the 1st International Workshop on Software
Language-based Engineering of Multi-X Systems, co-located with ECOOP 2027 (Turin, Italy).

**Updating the site (dates, CfP, program, committee) is documented in
[`HOWTO.md`](HOWTO.md).** This file covers how the site is put together.

## Stack

Plain [Hugo](https://gohugo.io) — no theme, no Hugo modules, no npm, no bundler.
Deployed to GitHub Pages by `.github/workflows/publish.yaml`. CSS and JavaScript are
plain files minified and fingerprinted by Hugo Pipes; the standard (non-extended)
Hugo binary is enough.

## Layout of the repository

| What | Where |
| --- | --- |
| Workshop identity (name, claim, city, dates line, contact) | `config/_default/params.yaml` |
| Header navigation | `config/_default/menus.yaml` |
| Important dates (shared by home, CfP, submission) | `data/dates.yaml` |
| Kinds of contribution (shared by CfP, submission) | `data/contributions.yaml` |
| Page content, one file per page | `content/*.md` |
| Page templates, one per page | `layouts/{home,cfp,submission,program,committee,venue}.html` |
| Shared skeleton (head, header, footer) | `layouts/baseof.html`, `layouts/_partials/` |
| Styles (Broadsheet tokens + components) | `assets/css/main.css` |
| Script (date refresh, "To be announced" swarm) | `assets/js/main.js` |
| Favicon | `static/favicon.svg` |

Each content file names its template with `layout:` in the front matter. Prose goes
in the Markdown body; structured content (lists of topics, sessions, people) goes in
the front matter, so editing the site never means touching HTML.

## Design

The look follows the *Broadsheet* design system: Source Serif 4 on paper white,
cyan (micro) and magenta (macro) used as spot colours, sections separated by
whitespace rather than boxes. The tokens are at the top of `assets/css/main.css`.

The site works without JavaScript. The script only re-marks past/next dates with
the visitor's clock (the build marks them as of build time) and replaces the
"To be announced" text with a swarm of dots that settles into the letters.
Page changes cross-fade via CSS view transitions where the browser supports them.

## Local development

```sh
hugo server          # http://localhost:1313, live reload
hugo --gc --minify   # production build into public/
```

Use the Hugo version pinned in `.github/workflows/publish.yaml` (or newer).

## Deployment

The site lives at <https://slemux.github.io/2027/>: repository `2027` in the
`slemux` GitHub organisation, published as a project page. Each edition gets its own
repository (`2028`, …), and `slemux.github.io` can hold a landing page that points
to the current one.

1. Push to `github.com/slemux/2027` (branch `main`).
2. In *Settings → Pages*, set **Source** to **GitHub Actions**.

Every push to `main` rebuilds and deploys; the workflow also runs weekly so the
build-time date styling never drifts. The workflow takes the base URL from GitHub
Pages, so renaming the repository or adding a custom domain needs no code change.
