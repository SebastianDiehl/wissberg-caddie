# Changelog

## 2026-11-14

- Viewing direction: a cone at the position marker shows where the phone points (compass), in the hole view and on the satellite map; falls back to the GPS walking direction. iOS asks for motion access on the first tap.
- Hole view from the tee signs now covers all 18 holes (added 1, 3, 7, 8 incl. green depths)

## Unreleased

- Tournament mode in the player tab: hides the club recommendation (not allowed in competition under Rule 4.3); a "Turnier" badge shows in the header
- "Unofficial, distances without warranty" notice in the guide and the course tab
- App icon (flag on a green) as favicon, bookmark and home-screen icon; web app manifest
- Hole view drawn from the tee signs for holes 2, 4–6 and 9–18: outline, trees, bunkers, water and doglegs; shown even before tee and green are set (distances from the tee). Once tee and green are set, the layout is placed on the real hole and its bunkers and water count for distances, unless own markings or OpenStreetMap data exist.
- Multiple courses: course picker in the course tab, Mainzer Golfclub (Budenheim, 18 holes) added with par, stroke index and ratings for white, yellow, blue, red and green tees. Hole data, running round and tee are kept per course; history is tagged by course; backups include all courses.
- Optional Esri API key in `config.js` for the satellite view (keyed basemap endpoint)

## 2026-11-10 — Repository setup

- Split the single-file app into `index.html`, `style.css`, `app.js`, `data/rheinhessen.js` and `vendor/`.
- No functional changes.

## 2026-11-03

- Player tab: handicap index, men's/women's ratings, tees A–F with course rating and slope, club bag
- Stableford points (WHS course handicap, 18 and 9 holes)
- New provisional ball flow: button on the main screen, penalty counted immediately, provisional ball tracked until resolved
- Edit scores afterwards, including saved rounds; delete saved rounds
- Removed incorrect per-hole lengths for tees B–F
- Self-hosted fonts and Leaflet; no satellite tiles in the hole view
- Backup to file, restore from file, backup reminder after each round
- Replay of past rounds on the map

## Earlier (Oct 2026)

- GPS distances, stylised hole view with pan and zoom, shot tracking, putts, club statistics, 9/18 holes, course data import from OpenStreetMap, in-app guide
