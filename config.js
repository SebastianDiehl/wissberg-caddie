/*
 * App configuration (public; anything here is visible to every user of the site).
 *
 * esriKey: API key from an ArcGIS Location Platform account (free tier) for the satellite view.
 *   Create it with only the "Basemaps" privilege and restrict it to the Netlify domain(s)
 *   (referrer restriction), so it cannot be used elsewhere. Empty = public tile endpoint.
 */
window.APP_CONFIG = {
  esriKey: ""
};
