// Logistic-map bifurcation diagram with a live Lyapunov exponent readout.
// Points are coloured by the sign of the exponent at each r: periodic
// windows in the accent colour, chaotic bands in the chaos colour.

(function () {
  const canvas = document.querySelector("[data-orbit]");
  if (!canvas) return;

  const R_MIN = 2.9;
  const R_MAX = 4.0;
  const PAD = { top: 14, right: 18, bottom: 44, left: 40 };
  const TRANSIENT = 400;
  const SAMPLES = 260;
  const X0 = 0.3183; // avoids the 0.5 -> 1 -> 0 trap at r = 4
  const CHAOS_THRESHOLD = 1e-3;

  const readout = {
    r: document.querySelector("[data-orbit-r]"),
    lambda: document.querySelector("[data-orbit-lambda]"),
    regime: document.querySelector("[data-orbit-regime]"),
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const darkScheme = window.matchMedia("(prefers-color-scheme: dark)");

  let r = 3.83;
  let layer = null; // offscreen canvas holding the rendered diagram
  let revealed = 0; // fraction of the diagram drawn so far (0..1)
  let geometry = null;
  let animId = 0;

  function hexToRgb(value) {
    const hex = value.trim().replace("#", "");
    const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    const n = parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function tokens() {
    const css = getComputedStyle(document.documentElement);
    return {
      ink: css.getPropertyValue("--ink").trim(),
      muted: css.getPropertyValue("--muted").trim(),
      accent: hexToRgb(css.getPropertyValue("--accent")),
      chaos: hexToRgb(css.getPropertyValue("--chaos")),
      sans: css.getPropertyValue("--sans").trim(),
    };
  }

  function lyapunov(rv, n) {
    let x = X0;
    for (let i = 0; i < TRANSIENT; i++) x = rv * x * (1 - x);
    let sum = 0;
    for (let i = 0; i < n; i++) {
      x = rv * x * (1 - x);
      sum += Math.log(Math.abs(rv * (1 - 2 * x)) + 1e-12);
    }
    return sum / n;
  }

  function measure() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const plot = {
      x: Math.round(PAD.left * dpr),
      y: Math.round(PAD.top * dpr),
      w: Math.round((cssW - PAD.left - PAD.right) * dpr),
      h: Math.round((cssH - PAD.top - PAD.bottom) * dpr),
    };
    geometry = { dpr, cssW, cssH, plot };
  }

  // Render every column into an offscreen layer; density sets the alpha.
  function renderLayer(t) {
    const { w, h } = geometry.plot;
    if (w <= 0 || h <= 0) return;
    const counts = new Uint16Array(w * h);
    const chaotic = new Uint8Array(w);
    // Keep the same density per CSS pixel on high-DPI screens.
    const samples = Math.round(SAMPLES * geometry.dpr);
    for (let i = 0; i < w; i++) {
      const rv = R_MIN + ((i + 0.5) / w) * (R_MAX - R_MIN);
      let x = X0;
      for (let k = 0; k < TRANSIENT; k++) x = rv * x * (1 - x);
      let sum = 0;
      for (let k = 0; k < samples; k++) {
        x = rv * x * (1 - x);
        sum += Math.log(Math.abs(rv * (1 - 2 * x)) + 1e-12);
        const j = Math.min(h - 1, Math.max(0, Math.round((1 - x) * (h - 1))));
        const idx = j * w + i;
        if (counts[idx] < 65535) counts[idx]++;
      }
      chaotic[i] = sum / samples > CHAOS_THRESHOLD ? 1 : 0;
    }
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const octx = off.getContext("2d");
    const img = octx.createImageData(w, h);
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const c = counts[j * w + i];
        if (!c) continue;
        const rgb = chaotic[i] ? t.chaos : t.accent;
        const p = (j * w + i) * 4;
        img.data[p] = rgb[0];
        img.data[p + 1] = rgb[1];
        img.data[p + 2] = rgb[2];
        img.data[p + 3] = Math.min(255, 70 + c * 45);
      }
    }
    octx.putImageData(img, 0, 0);
    layer = off;
  }

  function draw() {
    if (!geometry || !layer) return;
    const t = tokens();
    const { dpr, plot } = geometry;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Diagram, revealed left to right on first load.
    const visibleW = Math.round(plot.w * revealed);
    if (visibleW > 0) {
      ctx.drawImage(layer, 0, 0, visibleW, plot.h, plot.x, plot.y, visibleW, plot.h);
    }

    // Axes.
    ctx.strokeStyle = t.muted;
    ctx.lineWidth = dpr;
    ctx.beginPath();
    ctx.moveTo(plot.x, plot.y + plot.h + 0.5 * dpr);
    ctx.lineTo(plot.x + plot.w, plot.y + plot.h + 0.5 * dpr);
    ctx.moveTo(plot.x - 0.5 * dpr, plot.y);
    ctx.lineTo(plot.x - 0.5 * dpr, plot.y + plot.h);
    ctx.stroke();

    ctx.fillStyle = t.muted;
    ctx.font = `${12 * dpr}px ${t.sans}`;
    ctx.textBaseline = "top";
    ctx.textAlign = "center";
    [3.0, 3.25, 3.5, 3.75, 4.0].forEach((tick) => {
      const px = plot.x + ((tick - R_MIN) / (R_MAX - R_MIN)) * plot.w;
      ctx.fillText(tick.toFixed(tick % 0.5 === 0 ? 1 : 2), px, plot.y + plot.h + 8 * dpr);
    });
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("1", plot.x - 8 * dpr, plot.y + 4 * dpr);
    ctx.fillText("0", plot.x - 8 * dpr, plot.y + plot.h - 4 * dpr);
    ctx.save();
    ctx.translate(plot.x - 22 * dpr, plot.y + plot.h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("x", 0, 0);
    ctx.restore();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("r", plot.x + plot.w / 2, plot.y + plot.h + 26 * dpr);

    // Cursor at the selected r, once the diagram is fully drawn.
    if (revealed >= 1) {
      const cx = Math.round(plot.x + ((r - R_MIN) / (R_MAX - R_MIN)) * plot.w) + 0.5;
      ctx.strokeStyle = t.ink;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = dpr;
      ctx.beginPath();
      ctx.moveTo(cx, plot.y);
      ctx.lineTo(cx, plot.y + plot.h);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function updateReadout() {
    const lam = lyapunov(r, 3000);
    const regime = lam > CHAOS_THRESHOLD ? "chaotic" : "periodic";
    const lamText = (lam < 0 ? "−" : "") + Math.abs(lam).toFixed(3);
    if (readout.r) readout.r.textContent = r.toFixed(3);
    if (readout.lambda) readout.lambda.textContent = lamText;
    if (readout.regime) {
      readout.regime.textContent = regime;
      readout.regime.dataset.regime = regime;
    }
    canvas.setAttribute("aria-valuenow", r.toFixed(3));
    canvas.setAttribute("aria-valuetext", `r ${r.toFixed(3)}, Lyapunov exponent ${lamText}, ${regime}`);
  }

  function setR(value) {
    r = Math.min(R_MAX, Math.max(R_MIN, value));
    updateReadout();
    draw();
  }

  function finishReveal() {
    cancelAnimationFrame(animId);
    revealed = 1;
  }

  function rebuild(animate) {
    cancelAnimationFrame(animId);
    measure();
    renderLayer(tokens());
    if (!animate || reduceMotion.matches || document.hidden) {
      revealed = 1;
      draw();
      return;
    }
    revealed = 0;
    const start = performance.now();
    const duration = 1400;
    function step(now) {
      const p = Math.min(1, (now - start) / duration);
      revealed = 1 - Math.pow(1 - p, 3);
      draw();
      if (p < 1) animId = requestAnimationFrame(step);
    }
    animId = requestAnimationFrame(step);
    // If frames are throttled (background tab), show the finished diagram anyway.
    setTimeout(() => {
      if (revealed < 1) {
        finishReveal();
        draw();
      }
    }, duration + 600);
  }

  function rFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - PAD.left;
    const w = rect.width - PAD.left - PAD.right;
    return R_MIN + (x / w) * (R_MAX - R_MIN);
  }

  canvas.addEventListener("pointermove", (event) => {
    if (revealed < 1) return;
    setR(rFromEvent(event));
  });

  canvas.addEventListener("pointerdown", (event) => {
    finishReveal();
    setR(rFromEvent(event));
  });

  canvas.addEventListener("keydown", (event) => {
    const steps = {
      ArrowLeft: -0.005,
      ArrowDown: -0.005,
      ArrowRight: 0.005,
      ArrowUp: 0.005,
      PageDown: -0.05,
      PageUp: 0.05,
    };
    if (!(event.key in steps) && event.key !== "Home" && event.key !== "End") return;
    finishReveal();
    if (event.key in steps) {
      setR(r + steps[event.key]);
    } else if (event.key === "Home") {
      setR(R_MIN);
    } else if (event.key === "End") {
      setR(R_MAX);
    }
    event.preventDefault();
  });

  let resizeTimer = null;
  function onResize() {
    if (!geometry) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (geometry.cssW === canvas.clientWidth && geometry.cssH === canvas.clientHeight && geometry.dpr === dpr) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => rebuild(false), 120);
  }

  new ResizeObserver(onResize).observe(canvas);
  // Moving the window to a screen with another pixel ratio fires resize only.
  window.addEventListener("resize", onResize);

  darkScheme.addEventListener("change", () => rebuild(false));

  updateReadout();
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  // Play the reveal the first time the figure scrolls into view.
  fontsReady.then(() => {
    const box = canvas.getBoundingClientRect();
    const inView = box.top < window.innerHeight && box.bottom > 0;
    if (inView || !("IntersectionObserver" in window)) {
      rebuild(true);
      return;
    }
    const io = new IntersectionObserver((records) => {
      if (!records.some((rec) => rec.isIntersecting)) return;
      io.disconnect();
      rebuild(true);
    }, { threshold: 0.35 });
    io.observe(canvas);
  });
})();
