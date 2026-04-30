// Dotted-earth canvas renderer.
// Reads window.EP_EARTH_DOTS (loaded from earth-dots.js) and draws a dotted
// world map projected on a sphere, with a glowing pin at a target lat/lng.
// Fall back to a uniform sphere if the dot data isn't loaded.

(function () {
  const TAU = Math.PI * 2;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeInOut(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeOutSlow(t) { return 1 - Math.pow(1 - t, 4); }

  function fibSphere(n) {
    const pts = [];
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y*y);
      const t = phi * i;
      pts.push([Math.cos(t)*r, y, Math.sin(t)*r]);
    }
    return pts;
  }

  // Lat/Lng in degrees → unit sphere in graphics coords (matches earth-dots.js)
  function llToVec(lat, lng) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lng + 180) * Math.PI / 180;
    return [
      -Math.sin(phi) * Math.cos(theta),
       Math.cos(phi),
       Math.sin(phi) * Math.sin(theta),
    ];
  }

  function rotY(v, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return [c*v[0] + s*v[2], v[1], -s*v[0] + c*v[2]];
  }
  function rotX(v, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return [v[0], c*v[1] - s*v[2], s*v[1] + c*v[2]];
  }

  function getEarthPoints() {
    if (window.EP_EARTH_DOTS && window.EP_EARTH_DOTS.land) {
      return {
        land:  window.EP_EARTH_DOTS.land,
        ocean: window.EP_EARTH_DOTS.ocean || [],
      };
    }
    // Fallback: uniform sphere (no land/ocean distinction)
    return { land: [], ocean: fibSphere(1500) };
  }

  function create(canvas, opts = {}) {
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const dotColor   = opts.color       || "#F2EDE6";
    const oceanColor = opts.oceanColor  || dotColor;
    const pinColor   = opts.pinColor    || "#FFFFFF";
    const accentColor= opts.accentColor || "#FFFFFF";
    const bg         = opts.bg          || "transparent";

    const target = (opts.lat != null && opts.lng != null)
      ? llToVec(opts.lat, opts.lng)
      : llToVec(33.5604, -81.7196);

    const { land, ocean } = getEarthPoints();

    let w = 0, h = 0;
    function resize() {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width  = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    let yaw = 0;
    let pitch = 0;
    let scale = 0.95;
    let cx = 0, cy = 0;
    let pinPulse = 0;
    let raf = null;
    let mode = "idle"; // "intro" | "idle" | "paused"

    function project(p, r) {
      let v = rotY(p, yaw);
      v = rotX(v, pitch);
      return [w/2 + cx + v[0]*r, h/2 + cy + v[1]*r, v[2]];
    }

    function hexA(hex, a) {
      const h = hex.replace("#", "");
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return `rgba(${r},${g},${b},${a})`;
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      if (bg && bg !== "transparent") {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);
      }
      const r = Math.min(w, h) * 0.42 * scale;

      // Draw a faint sphere fill so we can see edges
      // (subtle shadow on the unlit half)
      const cxp = w/2 + cx, cyp = h/2 + cy;
      const grad = ctx.createRadialGradient(cxp - r*0.3, cyp - r*0.3, r*0.1, cxp, cyp, r*1.05);
      grad.addColorStop(0, hexA(dotColor, 0.025));
      grad.addColorStop(1, hexA(dotColor, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cxp, cyp, r * 1.02, 0, TAU);
      ctx.fill();

      // Ocean dots (very faint)
      for (const p of ocean) {
        const proj = project(p, r);
        const z = proj[2];
        if (z < -0.1) continue;
        const a = 0.06 + Math.max(0, z) * 0.05;
        ctx.fillStyle = hexA(oceanColor, a);
        ctx.beginPath();
        ctx.arc(proj[0], proj[1], 0.7 * Math.max(0.6, scale), 0, TAU);
        ctx.fill();
      }

      // Land dots — z-sorted for clean overlap
      const landProj = land.map(p => project(p, r));
      const order = landProj.map((p, i) => i).sort((a, b) => landProj[a][2] - landProj[b][2]);
      for (const i of order) {
        const p = landProj[i];
        const z = p[2];
        const front = z > 0;
        const alpha = front ? 0.55 + z * 0.4 : 0.05 + (z + 1) * 0.08;
        const size = (front ? 1.2 : 0.85) * Math.max(0.6, scale);
        ctx.fillStyle = hexA(dotColor, alpha);
        ctx.beginPath();
        ctx.arc(p[0], p[1], size, 0, TAU);
        ctx.fill();
      }

      // Pin
      const pin = project(target, r);
      if (pin[2] > -0.2) {
        const pulse = 0.5 + 0.5 * Math.sin(pinPulse);
        const baseR = 4 + scale * 0.6;
        ctx.strokeStyle = hexA(accentColor, 0.55 * (pin[2] > 0 ? 1 : 0.4));
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pin[0], pin[1], baseR + 6 + pulse * 8, 0, TAU);
        ctx.stroke();
        ctx.fillStyle = hexA(pinColor, 0.95);
        ctx.beginPath();
        ctx.arc(pin[0], pin[1], baseR, 0, TAU);
        ctx.fill();
        const pinGrad = ctx.createRadialGradient(pin[0], pin[1], 0, pin[0], pin[1], baseR * 5);
        pinGrad.addColorStop(0, hexA(accentColor, 0.3));
        pinGrad.addColorStop(1, hexA(accentColor, 0));
        ctx.fillStyle = pinGrad;
        ctx.beginPath();
        ctx.arc(pin[0], pin[1], baseR * 5, 0, TAU);
        ctx.fill();
      }
    }

    function loop() {
      if (mode === "idle") {
        yaw += 0.0009;
        pinPulse += 0.04;
      }
      draw();
      raf = requestAnimationFrame(loop);
    }
    function start() { if (!raf) raf = requestAnimationFrame(loop); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    function idle() {
      mode = "idle";
      const sFrom = scale, sTo = 1;
      const cxFrom = cx, cxTo = 0;
      const cyFrom = cy, cyTo = 0;
      const dur = 1400;
      const t0 = performance.now();
      function tick() {
        const t = Math.min(1, (performance.now() - t0) / dur);
        const e = easeInOut(t);
        scale = lerp(sFrom, sTo, e);
        cx = lerp(cxFrom, cxTo, e);
        cy = lerp(cyFrom, cyTo, e);
        if (t < 1) requestAnimationFrame(tick);
      }
      tick();
      start();
    }

    function intro({ duration = 5500 } = {}) {
      mode = "intro";
      start();
      const [tx, ty, tz] = target;
      const targetYaw = -Math.atan2(tx, tz);
      const targetPitch = Math.atan2(ty, Math.sqrt(tx*tx + tz*tz));
      // Start: full earth view, slow rotation in
      const startYaw = targetYaw - TAU * 0.85;
      const startPitch = -0.1;
      const startScale = 0.78;
      const peakScale = 1.6;
      const finalScale = 1.1;

      yaw = startYaw; pitch = startPitch; scale = startScale;
      const t0 = performance.now();
      return new Promise(resolve => {
        function tick() {
          const t = Math.min(1, (performance.now() - t0) / duration);
          // First 60% is the rotation; last 40% is the zoom + settle
          const rotT = Math.min(1, t / 0.6);
          const zoomT = Math.max(0, (t - 0.55) / 0.45);
          const eRot  = easeOutSlow(rotT);
          yaw   = lerp(startYaw,   targetYaw,   eRot);
          pitch = lerp(startPitch, targetPitch, eRot);
          if (zoomT < 0.7) {
            scale = lerp(startScale, peakScale, easeInOut(zoomT / 0.7));
          } else {
            scale = lerp(peakScale, finalScale, easeInOut((zoomT - 0.7) / 0.3));
          }
          pinPulse += 0.05;
          if (t < 1) {
            requestAnimationFrame(tick);
          } else {
            mode = "idle";
            resolve();
          }
        }
        tick();
      });
    }

    return {
      intro, idle, start, stop, resize,
      setTarget(lat, lng) {
        const v = llToVec(lat, lng);
        target[0] = v[0]; target[1] = v[1]; target[2] = v[2];
      },
    };
  }

  window.EPGlobe = { create };
})();
