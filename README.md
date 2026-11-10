# Wißberg Caddie

Unofficial GPS caddie for **Golfclub Rheinhessen** (Hofgut Wißberg). A small web app that runs in the phone browser: distances to the green and hazards from your GPS position, shot tracking per club, score and Stableford points.

> **Unofficial.** This project is not affiliated with or endorsed by Golfclub Rheinhessen. Distances are provided without warranty.

The app UI is German. Everything in this repository (code, comments, docs, commits) is English.

## Features

- Stylised hole view (tee at the bottom, green at the top) with pan and pinch zoom, plus a satellite view
- Live distances to front, centre and back of the green and to bunkers and water
- Shot tracking: tap *Schlag von hier* and pick a club; the previous shot's distance is measured automatically
- Putts entered in one tap on the green; provisional ball with immediate penalty stroke
- Player settings: handicap index, men's/women's ratings, tees A–F, club bag
- Stableford points (WHS course handicap, 18 and 9 holes)
- Round history with scorecard editing and a replay of past rounds on the map
- Club distance statistics (average, max, typical range)
- Backup to and restore from a JSON file

## How it works

Plain static files, no build step and no backend.

| Path | Purpose |
|---|---|
| `index.html` | Markup |
| `style.css` | App styles (theme tokens for light and dark) |
| `app.js` | App logic |
| `data/rheinhessen.js` | Course data: par, stroke index, green depth, course rating / slope per tee |
| `vendor/` | Leaflet 1.9.4 and the fonts, self-hosted (no requests to Google or CDNs) |

### Data and privacy

- All personal data (rounds, shots with GPS positions, settings) is stored **only in the browser's `localStorage`** on the device. Nothing is sent to a server, and nothing personal belongs in this repository.
- External requests: Esri satellite tiles (satellite view only) and OpenStreetMap (only when the user taps *Platzdaten laden*).
- iOS: use the app from the home screen. Safari deletes storage of regular websites after 7 days without a visit; home-screen web apps are exempt. The home-screen app and the Safari tab have **separate** storage.

## Running locally

Any static file server works, for example:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. GPS in the browser requires HTTPS or `localhost`.

## Deployment

Netlify serves the repository root (see `netlify.toml`). Every merge to `main` deploys to production at the same URL, so users keep their local data. Pull requests get a deploy preview; previews have their own, empty storage.

## Third-party notices

- [Leaflet](https://leafletjs.com) 1.9.4 — BSD 2-Clause, see `vendor/leaflet/LICENSE`
- Saira Condensed and Figtree — SIL Open Font License 1.1, see `vendor/fonts/OFL-*.txt`
- Map data © OpenStreetMap contributors (ODbL); satellite imagery © Esri, Maxar
- Course rating / slope from TheGrint; par, stroke index and green depths from the club's public scorecard and tee signs (facts only, no graphics are copied)

## License

No license has been chosen yet. Until then, all rights are reserved by the contributors.
