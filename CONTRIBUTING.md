# Contributing

Thanks for helping. A few rules keep the app stable for everyone who uses it on the course.

## Workflow

1. **Never push to `main`.** `main` is what is live on Netlify.
2. Create a branch from the latest `main`: `feature/<short-name>` or `fix/<short-name>`.
3. Open a pull request. Netlify posts a deploy preview link; test it on your phone.
4. Sebastian reviews and merges.

Before starting something bigger, open an issue or say who is working on what, so two people don't change the same part of `app.js` at the same time.

## Language

- **Repository: English.** Code, comments, commit messages, PRs, issues, docs.
- **App UI: German.** All user-facing text stays German.

## Code

- Plain HTML, CSS and JavaScript. No framework, no build step, no new runtime dependencies without discussion.
- Colours only via the CSS tokens in `style.css`, so light and dark mode keep working.
- Units are metric only (metres).
- Keep user data local. Do not add analytics, trackers or requests to new third-party hosts.
- Changing a stored data shape? Make it backward compatible with existing `localStorage` data and backup files.

## Course data

- Course facts live in `data/rheinhessen.js`.
- Only facts (par, stroke index, distances, positions). Do not commit photos of tee signs, the club logo or copied graphics.
- Note the source of new data in the PR description.

## Testing a change

- Run locally with `python3 -m http.server 8000`.
- Check on a phone-sized screen in light and dark mode.
- Walk through: start a hole, track two shots, provisional ball, *Auf dem Grün* with putts, finish the round, open it in the history.

## Commit messages

Short imperative subject in English, e.g. `Add tournament mode toggle`, with details in the body if needed.
