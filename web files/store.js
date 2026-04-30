// Shared portal store — localStorage-backed.
// Production version of this site uses Supabase; this prototype uses
// localStorage so the click-thru works completely standalone.

(function () {
  const STORAGE_KEY = "epfilms.portals.v2";
  const SESSION_KEY = "epfilms.session.v1";

  function seed() {
    return [
      {
        id: "p_caroline",
        slug: "caroline-gabe",
        bride: "Caroline",
        partner: "Gabe",
        date: "2026-04-12",
        venue: "Aiken, South Carolina",
        lat: 33.5604,
        lng: -81.7196,
        cover: "assets/cover-default.jpg",
        sneak:    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        teaser:   "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        full:     "",
        videos: [
          { id: "v_c1", title: "Getting Ready",   date: "2026-04-12", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",   thumb: "assets/reel-01.jpg" },
          { id: "v_c2", title: "First Look",      date: "2026-04-12", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",  thumb: "assets/reel-02.jpg" },
          { id: "v_c3", title: "The Vows",        date: "2026-04-12", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",      thumb: "assets/reel-03.jpg" },
          { id: "v_c4", title: "Father's Speech", date: "2026-04-12", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", thumb: "assets/reel-04.jpg" },
          { id: "v_c5", title: "Dance Floor",     date: "2026-04-12", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",thumb: "assets/reel-05.jpg" },
        ],
        createdAt: "2026-04-22T10:00:00Z",
      },
    ];
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const s = seed();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
        return s;
      }
      return JSON.parse(raw);
    } catch (e) {
      const s = seed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      return s;
    }
  }
  function save(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function slugify(s) {
    return (s || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  function uid(p) { return p + "_" + Math.random().toString(36).slice(2, 9); }

  function fmtDate(iso) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
    } catch (e) { return iso; }
  }

  // ---- Tiny built-in geocoder so admin can paste a city and we plot it.
  // For production this is replaced with a real geocoder API.
  const CITY_INDEX = [
    { match: /aiken/i,         lat: 33.5604, lng: -81.7196, label: "Aiken, South Carolina" },
    { match: /charleston/i,    lat: 32.7765, lng: -79.9311, label: "Charleston, South Carolina" },
    { match: /savannah/i,      lat: 32.0809, lng: -81.0912, label: "Savannah, Georgia" },
    { match: /atlanta/i,       lat: 33.7490, lng: -84.3880, label: "Atlanta, Georgia" },
    { match: /athens/i,        lat: 33.9519, lng: -83.3576, label: "Athens, Georgia" },
    { match: /nashville/i,     lat: 36.1627, lng: -86.7816, label: "Nashville, Tennessee" },
    { match: /asheville/i,     lat: 35.5951, lng: -82.5515, label: "Asheville, North Carolina" },
    { match: /charlotte/i,     lat: 35.2271, lng: -80.8431, label: "Charlotte, North Carolina" },
    { match: /raleigh/i,       lat: 35.7796, lng: -78.6382, label: "Raleigh, North Carolina" },
    { match: /napa/i,          lat: 38.2975, lng: -122.2869, label: "Napa, California" },
    { match: /sonoma/i,        lat: 38.2919, lng: -122.4580, label: "Sonoma, California" },
    { match: /carmel/i,        lat: 36.5552, lng: -121.9233, label: "Carmel, California" },
    { match: /malibu/i,        lat: 34.0259, lng: -118.7798, label: "Malibu, California" },
    { match: /aspen/i,         lat: 39.1911, lng: -106.8175, label: "Aspen, Colorado" },
    { match: /telluride/i,     lat: 37.9375, lng: -107.8123, label: "Telluride, Colorado" },
    { match: /jackson/i,       lat: 43.4799, lng: -110.7624, label: "Jackson, Wyoming" },
    { match: /new york|nyc|manhattan/i, lat: 40.7128, lng: -74.0060, label: "New York, New York" },
    { match: /the hamptons|hamptons|montauk/i, lat: 41.0367, lng: -71.9540, label: "The Hamptons, New York" },
    { match: /newport/i,       lat: 41.4901, lng: -71.3128, label: "Newport, Rhode Island" },
    { match: /martha'?s vineyard|vineyard/i, lat: 41.3805, lng: -70.6456, label: "Martha's Vineyard" },
    { match: /nantucket/i,     lat: 41.2835, lng: -70.0995, label: "Nantucket, Massachusetts" },
    { match: /tuscany|florence/i, lat: 43.7711, lng: 11.2486, label: "Tuscany, Italy" },
    { match: /lake como|como/i, lat: 45.9876, lng: 9.2580, label: "Lake Como, Italy" },
    { match: /amalfi/i,        lat: 40.6340, lng: 14.6027, label: "Amalfi Coast, Italy" },
    { match: /provence/i,      lat: 43.9352, lng: 6.0679, label: "Provence, France" },
    { match: /paris/i,         lat: 48.8566, lng: 2.3522,   label: "Paris, France" },
    { match: /santorini/i,     lat: 36.3932, lng: 25.4615, label: "Santorini, Greece" },
    { match: /mykonos/i,       lat: 37.4467, lng: 25.3289, label: "Mykonos, Greece" },
    { match: /bali|ubud/i,     lat: -8.4095, lng: 115.1889, label: "Bali, Indonesia" },
    { match: /tulum/i,         lat: 20.2114, lng: -87.4654, label: "Tulum, Mexico" },
    { match: /cabo/i,          lat: 22.8905, lng: -109.9167, label: "Cabo San Lucas, Mexico" },
  ];

  function geocode(q) {
    if (!q) return null;
    // explicit "lat, lng" pair?
    const m = q.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (m) {
      const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng, label: q };
      }
    }
    for (const c of CITY_INDEX) if (c.match.test(q)) return { lat: c.lat, lng: c.lng, label: c.label };
    return null;
  }

  const PortalStore = {
    list() { return load(); },
    get(idOrSlug) {
      const all = load();
      return all.find(p => p.id === idOrSlug || p.slug === idOrSlug);
    },
    create(input) {
      const all = load();
      let slug = input.slug || slugify(input.bride + (input.partner ? "-" + input.partner : ""));
      let base = slug, i = 2;
      while (all.find(p => p.slug === slug)) { slug = base + "-" + i++; }
      // Try to geocode if no lat/lng provided
      let lat = input.lat ?? null, lng = input.lng ?? null;
      if ((lat == null || lng == null) && input.venue) {
        const g = geocode(input.venue);
        if (g) { lat = g.lat; lng = g.lng; }
      }
      const monogram = (input.monogram || "").trim() || autoMonogram(input.bride, input.partner);
      const portal = {
        id: uid("p"),
        slug,
        bride:   input.bride   || "",
        partner: input.partner || "",
        date:    input.date    || "",
        venue:   input.venue   || "",
        lat, lng,
        cover:   input.cover   || "",
        sneak:   input.sneak   || "",
        teaser:  input.teaser  || "",
        full:    input.full    || "",
        monogram,
        email:   input.email   || "",
        videos: [],
        createdAt: new Date().toISOString(),
      };
      all.unshift(portal);
      save(all);
      return portal;
    },
    update(id, patch) {
      const all = load();
      const i = all.findIndex(p => p.id === id);
      if (i < 0) return null;
      all[i] = { ...all[i], ...patch };
      save(all);
      return all[i];
    },
    remove(id) {
      const all = load().filter(p => p.id !== id);
      save(all);
    },
    addVideo(id, video) {
      const p = this.get(id);
      if (!p) return null;
      p.videos = p.videos || [];
      p.videos.push({ id: uid("v"), title: video.title || "Untitled", date: video.date || "", url: video.url || "", thumb: video.thumb || "" });
      this.update(id, { videos: p.videos });
      return p;
    },
    removeVideo(id, vid) {
      const p = this.get(id);
      if (!p) return null;
      p.videos = (p.videos || []).filter(v => v.id !== vid);
      this.update(id, { videos: p.videos });
      return p;
    },
  };

  const Session = {
    isAuthed() { return localStorage.getItem(SESSION_KEY) === "ok"; },
    login(pw) {
      if (pw === "2003") {
        localStorage.setItem(SESSION_KEY, "ok");
        return true;
      }
      return false;
    },
    logout() { localStorage.removeItem(SESSION_KEY); },
  };

  // First-visit gating per bride slug
  const VisitedKey = "epfilms.visited.v1";
  const Visits = {
    seen(slug) {
      try {
        const v = JSON.parse(localStorage.getItem(VisitedKey) || "{}");
        return !!v[slug];
      } catch (e) { return false; }
    },
    mark(slug) {
      try {
        const v = JSON.parse(localStorage.getItem(VisitedKey) || "{}");
        v[slug] = Date.now();
        localStorage.setItem(VisitedKey, JSON.stringify(v));
      } catch (e) {}
    },
    reset() { localStorage.removeItem(VisitedKey); },
  };

  const ProfileKey = "epfilms.profile.v1";
  const Profile = {
    get() {
      try { return JSON.parse(localStorage.getItem(ProfileKey) || "null") || defaultProfile(); }
      catch (e) { return defaultProfile(); }
    },
    save(p) { localStorage.setItem(ProfileKey, JSON.stringify(p)); return p; },
  };
  function defaultProfile() {
    return {
      name: "Eli Pixler",
      email: "hello@elipixlerfilms.com",
      phone: "",
      instagram: "elipixlerfilms",
    };
  }

  function autoMonogram(bride, partner) {
    const a = (bride || "").trim().charAt(0).toUpperCase();
    const b = (partner || "").trim().charAt(0).toUpperCase();
    if (a && b) return a + " & " + b;
    if (a) return a;
    return "ep";
  }

  window.autoMonogram = autoMonogram;
  window.Profile = Profile;
  window.PortalStore = PortalStore;
  window.Session = Session;
  window.Visits = Visits;
  window.geocodeCity = geocode;
  window.slugify = slugify;
  window.fmtDate = fmtDate;
})();
