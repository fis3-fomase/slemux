# How to maintain this site

## Run it locally

```sh
hugo server          # http://localhost:1313, live reload
```

Push to `main` and the site is rebuilt and published in a minute or two.

## Common updates

| I want to… | Edit |
| --- | --- |
| Change a deadline | `data/dates.yaml` — change `date` (what is shown) **and** `iso` (YYYY-MM-DD, used to strike past dates and highlight the next one) |
| Open submissions | `content/submission.md` → set `systemUrl` |
| Publish the reviewing policy | `content/submission.md` → fill `review` (the block is hidden while empty) |
| Add PC members | `content/committee.md` → fill `pc` (shows "To be announced" while empty) |
| Publish the program | `content/program.md` → set `showSchedule: true` and check `sessions` |
| List accepted papers | `content/program.md` → fill `accepted` |
| Edit the CfP text, topics, perspectives | `content/cfp.md` |
| Edit the "About" text or "At a glance" | `content/_index.md` |
| Change name, claim, city, contact email, footer | `config/_default/params.yaml` |
| Add a page | create `content/<page>.md` with `title` and `layout: <page>`, add `layouts/<page>.html`, and a menu entry in `config/_default/menus.yaml` |

## Conventions

- **Markdown is allowed** in list items and short texts (e.g. `[link](https://…)`,
  `*italics*`), except in `claim` and `arrow`, which are plain text.
- In `claim` (params) and the perspectives' `arrow` (CfP), the words *micro*,
  *macro*, *meso* and *scales* are tinted automatically; in `arrow`, `→` and `⇄`
  are drawn as arrows.
- A program session whose label contains "break" is set in italics.
- Quote YAML strings that contain `: ` (colon-space), e.g.
  `- "Emergence: modelling, …"`, or YAML will read them as a key.

## Gotchas

- `published`, `date`, `expiryDate` are reserved by Hugo in front matter — that is
  why the program switch is called `showSchedule`.
- The site is served from a sub-path (`/2027/`). Link to pages with
  `(site.GetPage "/cfp").RelPermalink` (or a menu `pageRef`), never with
  `"/cfp/" | relURL`: a leading slash makes `relURL` drop the `/2027` prefix.
