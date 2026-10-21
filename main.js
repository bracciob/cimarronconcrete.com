/* Cimarron Concrete: site interactions, cinematic build sequence, page videos */
(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  /* Spanish pages (/es/) reuse this file; T() swaps the few strings built in JavaScript. */
  const LANG_ES = document.documentElement.lang === "es";
  const ES = {
    "Previous photo": "Foto anterior", "Next photo": "Foto siguiente", "Close": "Cerrar",
    "Cimarron Concrete project": "Proyecto de Cimarron Concrete", "Home base": "Base", "Front Range": "Front Range",
    "Please add your name, a valid email and a phone number.": "Agregue su nombre, un correo válido y un número de teléfono.",
    "Sending...": "Enviando...", "Send My Request": "Enviar mi Solicitud",
    "Thanks! Your request is in. We'll get back to you as soon as possible.": "¡Gracias! Recibimos su solicitud. Le responderemos lo antes posible.",
    "Google review": "Reseña de Google", "out of 5 stars": "de 5 estrellas",
    "Commercial concrete by Cimarron Concrete": "Concreto comercial de Cimarron Concrete",
    "Commercial sidewalk along a new building by Cimarron Concrete": "Banqueta comercial junto a un edificio nuevo de Cimarron Concrete",
    "Commercial sidewalk with ramp by Cimarron Concrete": "Banqueta comercial con rampa de Cimarron Concrete",
    "Commercial storefront sidewalk by Cimarron Concrete": "Banqueta comercial frente a un local de Cimarron Concrete",
    "Decorative stamped concrete by Cimarron Concrete": "Concreto decorativo estampado de Cimarron Concrete",
    "Foundation and slab work by Cimarron Concrete": "Cimientos y losas de Cimarron Concrete",
    "Residential concrete by Cimarron Concrete": "Concreto residencial de Cimarron Concrete",
    "Slab being power troweled by Cimarron Concrete": "Losa siendo allanada con llana mecánica por Cimarron Concrete",
    "Driveway installation": "Instalación de entrada de autos", "Sidewalk building": "Construcción de banquetas", "Demolition": "Demolición",
    "Concrete leveling": "Nivelación de concreto", "General paving": "Pavimentación general", "Driveway": "Entrada de autos", "Concrete pad": "Plataforma de concreto",
  };
  const T = (s) => (LANG_ES && ES[s]) || s;
  /* On cimarronconcrete.com (GitHub Pages) the form and reviews API lives on the Worker. */
  const API = /(^|\.)cimarronconcrete\.com$/.test(location.hostname) ? "https://cimarronconcrete.youragentbraden.workers.dev" : "";
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = matchMedia("(max-width: 768px)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const isHome = document.body.classList.contains("page-home");
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const getJSON = (url) => fetch(url, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduced && typeof window.Lenis !== "undefined") {
    lenis = new window.Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 0.9 });
    if (hasGsap) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  const scrollToEl = (el) => {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -80, duration: 1.3 });
    else el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  };

  /* ---------- Nav + drawer ---------- */
  const nav = $("#nav");
  const solidAt = () => (isHome ? innerHeight * 0.6 : 40);
  const bar = $("#progressBar");
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY;
    nav.classList.toggle("is-solid", y > solidAt());
    if (!reduced && !nav.contains(document.activeElement) && !document.body.classList.contains("is-loading")) {
      if (y > lastY + 6 && y > innerHeight * 0.9) nav.classList.add("is-hidden");
      else if (y < lastY - 6 || y < 120) nav.classList.remove("is-hidden");
    }
    lastY = y;
    if (bar) bar.style.transform = `scaleX(${clamp(y / Math.max(1, document.documentElement.scrollHeight - innerHeight))})`;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  const burger = $("#burger");
  const drawer = $("#drawer");
  const setDrawer = (open) => {
    drawer.classList.toggle("is-open", open);
    if (open) nav.classList.remove("is-hidden");
    drawer.setAttribute("aria-hidden", String(!open));
    burger.setAttribute("aria-expanded", String(open));
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  burger.addEventListener("click", () => setDrawer(!drawer.classList.contains("is-open")));
  addEventListener("keydown", (e) => e.key === "Escape" && setDrawer(false));

  /* ---------- Page transitions ---------- */
  const curtain = $("#curtain");
  const reveal = () => curtain && requestAnimationFrame(() => curtain.classList.add("is-out"));
  addEventListener("pageshow", () => { curtain && curtain.classList.remove("is-in"); reveal(); });
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank" || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) {
      const t = $(url.hash);
      if (t) { e.preventDefault(); setDrawer(false); scrollToEl(t); }
      return;
    }
    if (url.pathname === location.pathname && url.search === location.search) return;
    if (!curtain || reduced) return;
    e.preventDefault();
    setDrawer(false);
    curtain.classList.remove("is-out");
    curtain.classList.add("is-in");
    setTimeout(() => (location.href = url.href), 330);
  });

  /* ---------- Loader: progress ring around the logo ---------- */
  const Loader = (() => {
    const el = $("#loader");
    let seen = false;
    try { seen = sessionStorage.getItem("cc_loaded") === "1"; } catch (_) {}
    const active = !!el && (isHome || !seen);
    if (!active) { el && el.classList.add("is-skipped"); document.body.classList.remove("is-loading"); return { active: false, set() {}, done: () => Promise.resolve() }; }
    document.body.classList.add("is-loading");
    const arc = $("#loaderArc"), pct = $("#loaderPct"), ticks = $("#loaderTicks");
    const N = 60;
    ticks.innerHTML = Array.from({ length: N }, (_, i) => {
      const a = (i / N) * Math.PI * 2, r1 = 104, r2 = i % 5 === 0 ? 114 : 110;
      return `<line x1="${110 + r1 * Math.cos(a)}" y1="${110 + r1 * Math.sin(a)}" x2="${110 + r2 * Math.cos(a)}" y2="${110 + r2 * Math.sin(a)}"/>`;
    }).join("");
    const lines = $$("line", ticks);
    let target = 0, shown = 0, raf = 0, resolveDone = null;
    const paint = () => {
      shown += (target - shown) * 0.12 + (target > shown ? 0.15 : 0);
      if (shown > target) shown = target;
      const v = Math.min(100, shown);
      arc.style.strokeDashoffset = String(100 - v);
      pct.textContent = Math.floor(v);
      const on = Math.round((v / 100) * N);
      lines.forEach((l, i) => l.classList.toggle("is-on", i < on));
      if (v >= 100 && resolveDone) { const r = resolveDone; resolveDone = null; r(); }
      raf = v < 100 || target < 100 ? requestAnimationFrame(paint) : 0;
    };
    raf = requestAnimationFrame(paint);
    return {
      active: true,
      set(v) { target = Math.max(target, Math.min(100, v * 100)); if (!raf) raf = requestAnimationFrame(paint); },
      done() {
        target = 100;
        if (!raf) raf = requestAnimationFrame(paint);
        return new Promise((res) => { resolveDone = res; if (shown >= 100) { resolveDone = null; res(); } }).then(() => new Promise((res) => {
          try { sessionStorage.setItem("cc_loaded", "1"); } catch (_) {}
          const finish = () => { el.classList.add("is-skipped"); document.body.classList.remove("is-loading"); res(); };
          if (!hasGsap || reduced) return finish();
          gsap.timeline({ onComplete: finish })
            .to(".loader__ring svg", { scale: 1.08, duration: 0.25, ease: "power2.out" })
            .to([".loader__pct", ".loader__label"], { opacity: 0, y: 10, duration: 0.3 }, "<")
            .to(".loader__ring", { scale: 7, opacity: 0, duration: 1.0, ease: "expo.in" }, "+=0.05")
            .to(el, { opacity: 0, duration: 0.6, ease: "power2.out" }, "-=0.35");
        }));
      },
    };
  })();

  /* ---------- Videos (Higgsfield footage, listed in videos.json) ---------- */
  function makeVideo(v, { autoplay }) {
    const el = document.createElement("video");
    el.muted = true; el.loop = true; el.playsInline = true;
    el.setAttribute("muted", ""); el.setAttribute("playsinline", "");
    el.preload = autoplay ? "auto" : "metadata";
    if (v.poster) el.poster = v.poster;
    const src = (isMobile && v.mobile) || v.src;
    el.innerHTML = `<source src="${src}" type="video/mp4">`;
    el.addEventListener("loadeddata", () => el.classList.add("is-ready"), { once: true });
    return el;
  }
  async function videos() {
    const list = await getJSON("/assets/video/videos.json");
    if (!list) return;
    $$("[data-hero]").forEach((hero) => {
      const v = list[hero.dataset.hero];
      if (!v || reduced) return;
      const el = makeVideo(v, { autoplay: true });
      $(".phero__media", hero).appendChild(el);
      el.play().catch(() => {});
      if (hasGsap) gsap.to(el, { yPercent: 12, scale: 1.06, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
    });
    $$("[data-video-card]").forEach((card) => {
      const v = list[card.dataset.videoCard];
      if (!v || reduced) return;
      const media = card.classList.contains("card") ? $(".card__media", card) : card;
      const el = makeVideo(v, { autoplay: false });
      media.appendChild(el);
      if (finePointer && card.classList.contains("card")) {
        card.addEventListener("mouseenter", () => el.play().catch(() => {}));
        card.addEventListener("mouseleave", () => el.pause());
      } else {
        new IntersectionObserver(([en]) => (en.isIntersecting ? el.play().catch(() => {}) : el.pause()), { threshold: 0.4 }).observe(media);
      }
    });
  }

  /* ---------- Home: cinematic build sequence ---------- */
  function buildSequence() {
    const canvas = $("#buildCanvas");
    const ctx = canvas.getContext("2d", { alpha: false });
    const frames = [];
    let mode = "keyframes";
    let chapters = null;
    let target = 0, current = 0, lastKey = -1;

    async function sources() {
      const m = await getJSON("/assets/seq/manifest.json");
      // Portrait screens get the portrait-cut frames; they are drawn at about 1:1 instead of stretched.
      const portrait = innerHeight > innerWidth * 1.1;
      const set = m && (portrait ? m.mobile : m.desktop);
      if (set && set.count > 1) {
        mode = "frames";
        if (Array.isArray(m.chapters)) chapters = m.chapters;
        return Array.from({ length: set.count }, (_, i) => set.pattern.replace("{i}", String(i + 1).padStart(4, "0")));
      }
      // No footage yet: a single still with a slow push, never a crossfade.
      mode = "still";
      $("#build").classList.add("build--still");
      return [`/assets/seq/hero-${isMobile ? "m" : "d"}.webp`];
    }
    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      lastKey = -1;
    }
    function cover(img, scale, alpha) {
      if (!img || !img.complete || !img.naturalWidth) return false;
      const cw = canvas.width, ch = canvas.height;
      const ir = img.naturalWidth / img.naturalHeight;
      let w, h;
      if (ir > cw / ch) { h = ch; w = h * ir; } else { w = cw; h = w / ir; }
      w *= scale; h *= scale;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
      return true;
    }
    const nearest = (i) => { for (let d = 0; d < frames.length; d++) { if (frames[i - d]?.naturalWidth) return frames[i - d]; if (frames[i + d]?.naturalWidth) return frames[i + d]; } return null; };
    function draw(p) {
      if (!frames.length) return;
      const key = Math.round(p * 6000);
      if (mode === "still") { lastKey = key; ctx.globalAlpha = 1; ctx.fillStyle = "#050505"; ctx.fillRect(0, 0, canvas.width, canvas.height); cover(frames[0], 1.03 + 0.12 * p, 1); return; }
      const n = frames.length;
      const f = p * (n - 1);
      const i = Math.min(n - 2, Math.floor(f));
      const t = f - i;
      // Frames mode only repaints when the frame itself changes.
      const id = mode === "frames" ? `f${t < 0.5 ? i : i + 1}:${frames[t < 0.5 ? i : i + 1]?.naturalWidth ? 1 : 0}` : key;
      if (id === lastKey) return;
      lastKey = id;
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (mode === "frames") {
        // One exact frame per scroll position, drawn at its own size: no blending between
        // neighbours and no zoom, both of which soften the picture.
        const k = t < 0.5 ? i : i + 1;
        const a = frames[k]?.naturalWidth ? frames[k] : nearest(k);
        cover(a, 1, 1);
      } else {
        cover(frames[0], 1.03 + 0.12 * p, 1);
      }
      ctx.globalAlpha = 1;
    }
    function load(srcs, onProgress) {
      let done = 0;
      const need = mode === "frames" ? Math.ceil(srcs.length * 0.25) : srcs.length;
      // Every 4th frame first so the whole timeline is scrubbable early.
      const order = srcs.map((_, i) => i).sort((a, b) => (a % 4 === 0 ? 0 : 1) - (b % 4 === 0 ? 0 : 1) || a - b);
      return new Promise((resolve) => {
        let ok = false;
        order.forEach((idx, n) => {
          const img = new Image();
          img.decoding = "async";
          img.onload = img.onerror = () => {
            done++;
            onProgress(Math.min(1, done / need));
            lastKey = -1;
            if (!ok && done >= need) { ok = true; resolve(); }
          };
          img.src = srcs[idx];
          frames[idx] = img;
        });
      });
    }

    const progress = (v) => Loader.set(v * 0.96);

    (async () => {
      size();
      if (lenis) lenis.stop();
      const srcs = await sources();
      const timeout = new Promise((r) => setTimeout(r, 9000));
      await Promise.race([load(srcs, progress), timeout]);
      if (document.fonts?.ready) await Promise.race([document.fonts.ready, timeout]);
      draw(0);
      await Loader.done();
      start();
    })();

    addEventListener("resize", () => { size(); draw(current); });

    function start() {
      if (lenis) lenis.start();
      if (!hasGsap || reduced) { draw(reduced ? 1 : 0); return; }

      gsap.from(".hero__title .line > span", { yPercent: 110, duration: 1.3, ease: "expo.out", stagger: 0.1, delay: 0.1 });
      gsap.from([".build__intro .eyebrow", ".hero__sub", ".hero__actions", ".scrollcue"], { y: 20, opacity: 0, duration: 1.1, ease: "power3.out", stagger: 0.08, delay: 0.45 });
      gsap.from(canvas, { opacity: 0, duration: 1.2, ease: "power2.out" });

      if (mode === "still") {
        ScrollTrigger.create({ trigger: "#build", start: "top top", end: "bottom top", onUpdate: (self) => (target = self.progress) });
        gsap.ticker.add(() => { current += (target - current) * 0.1; draw(current); });
        gsap.to("#buildIntro", { yPercent: -18, opacity: 0, ease: "none", scrollTrigger: { trigger: "#build", start: "top top", end: "bottom 30%", scrub: true } });
        motion();
        ScrollTrigger.refresh();
        return;
      }
      const steps = $$("#buildSteps li"), ticks = $$(".build__ticks span");
      const fill = $("#buildFill"), intro = $("#buildIntro"), outro = $("#buildOutro"), meter = $(".build__meter");
      const S0 = 0.06, S1 = 0.88;
      let active = -1, p = 0;

      ScrollTrigger.create({ trigger: "#build", start: "top top", end: "bottom bottom", onUpdate: (self) => { p = self.progress; target = clamp((p - S0) / (S1 - S0)); } });

      // Ease the canvas toward the scroll target for buttery motion.
      gsap.ticker.add(() => {
        current += (target - current) * (mode === "frames" ? 0.14 : 0.1);
        if (Math.abs(target - current) < 0.0004) current = target;
        draw(current);

        const io = clamp(1 - p / 0.07);
        intro.style.opacity = io;
        intro.style.transform = `translate3d(0, ${(1 - io) * -36}px, 0)`;
        intro.style.visibility = io <= 0 ? "hidden" : "visible";
        const frame = clamp((p - 0.03) / 0.06) * (1 - clamp((p - 0.9) / 0.05));
        meter.style.opacity = frame;
        fill.style.transform = `scaleX(${current})`;

        const n = steps.length;
        let step = Math.min(n - 1, Math.floor(current * (n - 1) + 0.31));
        if (chapters) { step = 0; chapters.forEach((c, k) => { if (current >= c - 0.004) step = k; }); }
        if (p < S0 + 0.012 || p > 0.91) step = -1;
        if (step !== active) {
          steps.forEach((li, k) => {
            const on = k === step;
            gsap.to(li, { autoAlpha: on ? 1 : 0, y: on ? 0 : k < step ? -24 : 24, duration: on ? 0.9 : 0.28, delay: on && active >= 0 ? 0.22 : 0, ease: on ? "expo.out" : "power2.in", overwrite: true });
          });
          ticks.forEach((t, k) => t.classList.toggle("is-on", step >= 0 && k <= step));
          active = step;
        }
        const oo = clamp((p - 0.91) / 0.06);
        outro.style.opacity = oo;
        outro.style.visibility = oo > 0 ? "visible" : "hidden";
        outro.style.transform = `scale(${0.95 + oo * 0.05})`;
        canvas.style.filter = oo > 0 ? `brightness(${1 - oo * 0.6})` : "";
      });
      motion();
      ScrollTrigger.refresh();
    }
  }

  /* ---------- Section motion ---------- */
  function motion() {
    if (!hasGsap || reduced) return;
    $$(".split").forEach((st) => {
      if (st.dataset.split) return;
      st.dataset.split = "1";
      st.innerHTML = st.textContent.trim().split(/\s+/).map((w) => `<span class="w">${esc(w)}</span>`).join(" ");
      gsap.to($$(".w", st), { opacity: 1, stagger: 0.04, ease: "none", scrollTrigger: { trigger: st, start: "top 85%", end: "bottom 55%", scrub: true } });
    });
    $$(".count").forEach((c) => {
      const o = { v: 0 }, to = +c.dataset.to;
      c.textContent = "0";
      gsap.to(o, { v: to, duration: 1.8, ease: "power3.out", onUpdate: () => (c.textContent = Math.round(o.v)), scrollTrigger: { trigger: c, start: "top 90%", once: true } });
    });
    const cards = $$(".stack__card");
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next || matchMedia("(max-width: 600px)").matches) return;
      gsap.fromTo(card, { scale: 1, opacity: 1, filter: "brightness(1)" }, { scale: 0.92, opacity: 0.4, filter: "brightness(0.55)", ease: "none", immediateRender: false, scrollTrigger: { trigger: next, start: "top bottom", end: "top 130px", scrub: true } });
    });
    $$(".stack__card").forEach((card) => gsap.from($$(".stack__body > *", card), { y: 30, opacity: 0, stagger: 0.07, duration: 1, ease: "expo.out", scrollTrigger: { trigger: card, start: "top 70%", once: true } }));
    $$("[data-timeline]").forEach((tl) => {
      const fill = $(".tl__fill", tl), items = $$(".tl__steps li", tl);
      ScrollTrigger.create({ trigger: tl, start: "top 70%", end: "bottom 65%", scrub: true, onUpdate: (self) => {
        fill.style.transform = `scaleX(${self.progress})`;
        items.forEach((li, k) => li.classList.toggle("is-on", self.progress >= k / Math.max(1, items.length - 1) - 0.02));
      } });
    });
    $$(".phero__content > *:not(.phero__title)").forEach((el, i) => gsap.from(el, { y: 26, opacity: 0, duration: 1.2, delay: 0.25 + i * 0.1, ease: "expo.out" }));
    $$(".phero__poster").forEach((img) => gsap.fromTo(img, { scale: 1.08 }, { scale: 1, duration: 2.4, ease: "expo.out" }));
    $$(".phero__poster").forEach((img) => gsap.to(img, { yPercent: 12, ease: "none", scrollTrigger: { trigger: img.closest(".phero"), start: "top top", end: "bottom top", scrub: true } }));
    cinema();
    const groups = ".section-head .eyebrow, .section-head .link-arrow, .section-head .head-links, .section-head > p, .statement > .wrap > .eyebrow, .statement__grid, .stats, .panels, .svc-rail:not(.is-rail) .cards > *, .split-feature__inner > div > *:not(.h2), .about__body > *:not(.h2), .areas > div > *:not(.h2), .areas-teaser > div > *:not(.h2), .quote__info > *:not(.h2), .form, .process > li, .features > li, .career > li, .intro-split > *, .values-split > div > *:not(.h2), .more-services__list > *, .rating-bar, .cta-band .eyebrow, .cta-band__actions, .footer__inner > *, .owner-card, .faq__inner > div > *:not(.h2), .faq__item";
    $$(groups).forEach((el) => gsap.from(el, { y: 36, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 92%", once: true } }));
  }

  /* ---------- Cinematic layer: masked type, image wipes, services rail, CTA ---------- */
  // Wraps every word (inside nested accents too) in a mask so it can rise into view.
  function splitWords(el) {
    if (el.dataset.mw) return $$(".mw > span", el);
    el.dataset.mw = "1";
    const out = [];
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(part));
          const o = document.createElement("span"), i = document.createElement("span");
          o.className = "mw"; i.textContent = part; o.appendChild(i); frag.appendChild(o); out.push(i);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
    });
    walk(el);
    return out;
  }
  const wipe = (el, opts = {}) => {
    const img = el.tagName === "IMG" ? null : $("img", el);
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: opts.start || "top 86%", once: true } });
    tl.fromTo(el, { clipPath: opts.from || "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut", delay: opts.delay || 0, clearProps: "clipPath" });
    if (img) tl.fromTo(img, { scale: 1.28 }, { scale: 1, duration: 2, ease: "expo.out" }, "<0.15");
    return tl;
  };
  function cinema() {
    // Headlines: words rise out of a mask, phrase by phrase
    $$(".phero__title").forEach((h) => gsap.from(splitWords(h), { yPercent: 115, duration: 1.4, ease: "expo.out", stagger: 0.05, delay: 0.15 }));
    $$(".h2, .stack__title").forEach((h) => {
      if (h.closest(".build")) return;
      gsap.from(splitWords(h), { yPercent: 115, duration: 1.25, ease: "expo.out", stagger: 0.045, scrollTrigger: { trigger: h, start: "top 88%", once: true } });
    });
    // Photographs wipe open from the bottom edge, then settle from a slight zoom
    $$(".split-feature .portrait, .about__inner > .portrait, .onsite").forEach((el) => wipe(el));
    $$(".onjob figure").forEach((el, i) => wipe(el, { delay: i * 0.12, from: "inset(0% 0% 100% 0%)" }));
    // Portraits drift against the page
    $$(".split-feature .portrait img, .about__inner > .portrait img, .onsite img").forEach((img) =>
      gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } }));
    rail();
    ctaBand();
  }
  // Home services: pinned on desktop, the four services travel sideways with the scroll
  function rail() {
    const sec = $("#svcRail");
    if (!sec || sec.dataset.rail) return;
    sec.dataset.rail = "1";
    const track = $(".cards", sec), wrap = $(".wrap", sec), barEl = $("#railBar"), num = $("#railNum");
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1025px)", () => {
      sec.classList.add("is-rail");
      const dist = () => {
        const w = wrap.getBoundingClientRect().left + parseFloat(getComputedStyle(wrap).paddingLeft);
        return Math.max(0, track.scrollWidth + w - innerWidth);
      };
      const tween = gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: {
        trigger: sec, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (st) => { barEl.style.transform = `scaleX(${st.progress})`; num.textContent = String(Math.min(4, 1 + Math.floor(st.progress * 3.999))).padStart(2, "0"); },
      } });
      $$(".card__media img", sec).forEach((img) => gsap.fromTo(img, { xPercent: -5, scale: 1.14 }, { xPercent: 5, scale: 1.14, ease: "none",
        scrollTrigger: { trigger: img.closest(".card"), containerAnimation: tween, start: "left right", end: "right left", scrub: true } }));
      return () => { sec.classList.remove("is-rail"); gsap.set(track, { clearProps: "x" }); };
    });
  }
  // Closing call to action: opens from an inset frame to full bleed as it arrives
  function ctaBand() {
    const band = $(".cta-band");
    if (!band || getComputedStyle(band).display === "none") return;
    const media = $(".cta-band__media", band), img = $("img", media);
    gsap.fromTo(media, { clipPath: "inset(12% 7% 12% 7%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: band, start: "top bottom", end: "top 15%", scrub: true } });
    gsap.fromTo(img, { yPercent: -8, scale: 1.12 }, { yPercent: 6, scale: 1, ease: "none", scrollTrigger: { trigger: band, start: "top bottom", end: "bottom top", scrub: true } });
  }
  // Project grids fill after the manifest loads, so they reveal on their own
  function revealGrid(grid) {
    if (!hasGsap || reduced) return;
    $$("figure", grid).forEach((f, i) => {
      wipe(f, { delay: (i % 3) * 0.1, start: "top 92%" });
      const img = $("img", f);
      gsap.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: "none", scrollTrigger: { trigger: f, start: "top bottom", end: "bottom top", scrub: true } });
    });
  }

  /* ---------- Services tabs ---------- */
  function tabs() {
    const list = $$('[role="tab"]');
    if (!list.length) return;
    const ink = $(".tabs__ink");
    const moveInk = (tab) => { if (ink && tab) { ink.style.width = `${tab.offsetWidth - 16}px`; ink.style.transform = `translateX(${tab.offsetLeft}px)`; } };
    const select = (name, focus) => {
      const tab = list.find((t) => t.dataset.tab === name);
      if (!tab) return;
      list.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = $("#" + t.getAttribute("aria-controls"));
        panel.hidden = !on;
        panel.classList.remove("is-active");
        if (on) {
          requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add("is-active")));
          $$("video", panel).forEach((v) => v.play().catch(() => {}));
          if (hasGsap && !reduced) gsap.fromTo($$(".panel__body > *", panel), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.06, ease: "expo.out" });
        }
      });
      moveInk(tab);
      if (focus) tab.focus();
      history.replaceState(null, "", "#" + name);
      if (hasGsap) ScrollTrigger.refresh();
    };
    list.forEach((t, i) => {
      t.addEventListener("click", () => select(t.dataset.tab));
      t.addEventListener("keydown", (e) => {
        const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (d) { e.preventDefault(); select(list[(i + d + list.length) % list.length].dataset.tab, true); }
      });
    });
    addEventListener("resize", () => moveInk(list.find((t) => t.getAttribute("aria-selected") === "true")));
    requestAnimationFrame(() => moveInk(list[0]));
    const deep = location.hash.slice(1);
    if (list.some((t) => t.dataset.tab === deep)) select(deep);
  }

  /* ---------- Services: sticky photo story + section nav ---------- */
  function services() {
    $$("[data-story]").forEach((story) => {
      const steps = $$(".story__step", story), imgs = $$(".story__img", story), count = $("[data-story-count]", story);
      // Phones and small tablets: give every step its own photo and drop the pinned frame.
      if (matchMedia("(max-width: 1000px)").matches) {
        steps.forEach((s, i) => { const src = imgs[i]; if (!src) return; const t = src.cloneNode(); t.className = "story__thumb"; t.removeAttribute("data-step"); s.prepend(t); });
        story.classList.add("is-stacked");
        return;
      }
      const set = (k) => {
        steps.forEach((s, i) => s.classList.toggle("is-on", i === k));
        imgs.forEach((im, i) => im.classList.toggle("is-on", i === k));
        if (count) count.textContent = String(k + 1).padStart(2, "0");
      };
      set(0);
      const io = new IntersectionObserver((entries) => entries.forEach((en) => en.isIntersecting && set(+en.target.dataset.step)), { rootMargin: "-45% 0px -45% 0px" });
      steps.forEach((s) => io.observe(s));
    });
    const cur = $('.svc-nav a[aria-current="page"]');
    if (cur) { const bar = cur.parentElement; bar.scrollLeft = cur.offsetLeft - (bar.clientWidth - cur.offsetWidth) / 2; }
    const links = $$('.svc-nav a[href^="#"]');
    if (links.length) {
      const io = new IntersectionObserver((entries) => entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.classList.toggle("is-on", a.getAttribute("href") === "#" + en.target.id));
      }), { rootMargin: "-40% 0px -55% 0px" });
      links.forEach((a) => { const t = $(a.getAttribute("href")); if (t) io.observe(t); });
    }
  }

  /* ---------- Gallery ---------- */
  let lightboxItems = [], lbIndex = 0, lightbox = null;
  function openLightbox(items, i) {
    if (!lightbox) {
      lightbox = document.createElement("div");
      lightbox.className = "lightbox";
      lightbox.setAttribute("role", "dialog");
      lightbox.setAttribute("aria-modal", "true");
      lightbox.innerHTML = `<img alt=""><button class="lb-prev" aria-label="${T("Previous photo")}">&#8592;</button><button class="lb-next" aria-label="${T("Next photo")}">&#8594;</button><button class="lb-close" aria-label="${T("Close")}">&#10005;</button>`;
      document.body.appendChild(lightbox);
      const show = (d) => { lbIndex = (lbIndex + d + lightboxItems.length) % lightboxItems.length; paint(); };
      $(".lb-prev", lightbox).onclick = (e) => { e.stopPropagation(); show(-1); };
      $(".lb-next", lightbox).onclick = (e) => { e.stopPropagation(); show(1); };
      lightbox.addEventListener("click", (e) => { if (e.target === lightbox || e.target.classList.contains("lb-close")) close(); });
      addEventListener("keydown", (e) => {
        if (!lightbox.classList.contains("is-open")) return;
        if (e.key === "Escape") close();
        if (e.key === "ArrowRight") show(1);
        if (e.key === "ArrowLeft") show(-1);
      });
      function close() { lightbox.classList.remove("is-open"); if (lenis) lenis.start(); }
    }
    lightboxItems = items; lbIndex = i;
    paint();
    lightbox.classList.add("is-open");
    if (lenis) lenis.stop();
    function paint() { const it = lightboxItems[lbIndex]; const img = $("img", lightbox); img.src = it.full || it.src; img.alt = T(it.alt || "Cimarron Concrete project"); }
  }
  const figure = (it, i) => `<figure data-i="${i}" data-cat="${esc(it.cat || "")}"><img src="${esc(it.src)}" alt="${esc(T(it.alt || "Cimarron Concrete project"))}" width="${it.w || 1200}" height="${it.h || 900}" loading="lazy" decoding="async"></figure>`;
  function bindGrid(grid, items) {
    grid.addEventListener("click", (e) => {
      const f = e.target.closest("figure");
      if (!f) return;
      const visible = $$("figure:not([hidden])", grid);
      openLightbox(visible.map((v) => items[+v.dataset.i]), visible.indexOf(f));
    });
  }
  async function gallery() {
    const items = await getJSON("/assets/gallery/manifest.json");
    if (!Array.isArray(items) || !items.length) return;

    const teaser = $("#workTeaser");
    if (teaser) {
      const pick = items.filter((x) => x.featured).concat(items.filter((x) => !x.featured)).slice(0, 6);
      const grid = $("#workTeaserGrid");
      grid.innerHTML = pick.map(figure).join("");
      bindGrid(grid, pick);
      teaser.hidden = false;
      revealGrid(grid);
    }
    $$("[data-work-filter]").forEach((sec) => {
      const pick = items.filter((x) => x.cat === sec.dataset.workFilter).slice(0, 6);
      if (!pick.length) return;
      const grid = $(".work-teaser__grid", sec);
      grid.innerHTML = pick.map(figure).join("");
      bindGrid(grid, pick);
      sec.hidden = false;
    });
    const work = $("#workGrid");
    if (work) {
      work.innerHTML = items.map(figure).join("");
      bindGrid(work, items);
      $("#workEmpty").hidden = true;
      const filters = $("#workFilters");
      const cats = new Set(items.map((x) => x.cat).filter(Boolean));
      $$("button", filters).forEach((b) => { if (b.dataset.filter !== "all" && !cats.has(b.dataset.filter)) b.remove(); });
      if (cats.size > 1) filters.hidden = false;
      filters.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        $$("button", filters).forEach((x) => x.classList.toggle("is-on", x === b));
        $$("figure", work).forEach((f) => (f.hidden = b.dataset.filter !== "all" && f.dataset.cat !== b.dataset.filter));
        if (hasGsap) ScrollTrigger.refresh();
      });
      if (hasGsap && !reduced) $$("figure", work).forEach((f) => gsap.from(f, { y: 40, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: f, start: "top 95%", once: true } }));
    }
    if (hasGsap) ScrollTrigger.refresh();
  }

  /* ---------- Reviews ---------- */
  // The client's featured Google reviews. Newer ones from /api/reviews are added automatically.
  const FEATURED = [
    { text: "I researched concrete contractors for my mother-in-law in Fort Collins to replace her driveway and front walkway and gave her three names. She contacted Cimarron Concrete first and after talking with Marco about the project, she felt like she didn't need to contact the others. She thoroughly enjoyed working with Marco and is thrilled with her new driveway and walkway. Even though she doesn't have a computer and is not online, she was so satisfied with their work that she wanted me to write this review on her behalf.", date: "2023-06-19", tags: ["Driveway installation", "Sidewalk building"] },
    { text: "We were in need of a driveway, walkway and back patio replacement due to years of settling around the house. We reached out to several concrete contractors for estimates but what impressed me about Marco at Cimarron Concrete, other than the positive online reviews, was the fact that he went beyond the concrete when he came out for the estimate. He took the time to walk around the property to ensure we didn't have any other reason for our concrete issues (slope, downspouts, etc). Marco is friendly and very easy to work with, his crew was friendly while on site. He kept us informed and updated on the progress of the project as well as any issues with weather that would impact progress or pour dates. Most importantly, we are very happy with the final product. Our patio looks great! The driveway is level once again.", date: "2023-04-17", tags: ["Demolition", "Driveway installation", "Sidewalk building"] },
    { text: "Marco is your man for concrete. The quality in his work was awesome with great communication. Thank you guys!", date: "2023-06-21", tags: ["Concrete leveling", "Sidewalk building"] },
    { text: "They did an excellent job on my patio and stairs. I would definitely use again and I recommend them to all my family and friends!", date: "2023-04-18", tags: ["General paving"] },
    { text: "We used Cimarron Concrete in May 2020. We had a very large circular driveway and a large concrete pad in the back yard. Marco estimated the project very well. His large crew showed up on time and did a great job! Highly recommend this company!", date: "2023-04-17", tags: ["Driveway", "Concrete pad"] },
  ];
  const G = '<svg width="14" height="14" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  const fmtDate = (d) => { const t = new Date(String(d).length === 10 ? d + "T12:00:00" : d); return isNaN(t) ? "" : t.toLocaleDateString(LANG_ES ? "es-US" : "en-US", { month: "short", year: "numeric" }); };
  const card = (r) => {
    const n = Math.max(1, Math.min(5, r.rating || 5));
    const tags = (r.tags || []).slice(0, 3).map((t) => `<span>${esc(T(t))}</span>`).join("");
    return `<article class="review"><div class="review__stars" aria-label="${n} ${T("out of 5 stars")}">${"&#9733;".repeat(n)}</div><p class="review__text">${esc(r.text)}</p>${tags ? `<div class="review__tags">${tags}</div>` : ""}<div class="review__meta"><span>${esc(r.author || T("Google review"))}</span><span class="g-badge">${G}${esc(r.when || fmtDate(r.date))}</span></div></article>`;
  };
  function paintReviews(list) {
    $$('[data-reviews="marquee"]').forEach((track) => {
      const html = list.map(card).join("");
      track.innerHTML = html + html.replace(/<article class="review"/g, '<article class="review" aria-hidden="true"');
      track.style.setProperty("--dur", `${Math.max(45, list.length * 12)}s`);
    });
    $$('[data-reviews="grid"]').forEach((grid) => (grid.innerHTML = list.map(card).join("")));
  }
  async function reviews() {
    if (!$("[data-reviews]")) return;
    paintReviews(FEATURED);
    const data = await getJSON(API + "/api/reviews");
    if (!data) return;
    if (data.url) $$("[data-reviews-link]").forEach((a) => (a.href = data.url));
    if (data.writeUrl) $$("[data-review-write]").forEach((a) => { a.href = data.writeUrl; a.hidden = false; });
    const seen = new Set(FEATURED.map((f) => f.text.slice(0, 60).toLowerCase()));
    const fresh = (data.reviews || []).filter((x) => x.text && (x.rating || 5) >= 4 && !seen.has(x.text.slice(0, 60).toLowerCase()));
    if (fresh.length) paintReviews([...fresh, ...FEATURED]);
  }

  /* ---------- Service area map (MapLibre: custom dark style over real Front Range terrain) ---------- */
  function areaMap() {
    const el = $("#areaMap");
    if (!el) return;
    const PLACES = [
      { id: "severance", name: "Severance", ll: [-104.851, 40.524], hq: true },
      { id: "fortcollins", name: "Fort Collins", ll: [-105.084, 40.585] },
      { id: "windsor", name: "Windsor", ll: [-104.901, 40.477], left: true },
      { id: "greeley", name: "Greeley", ll: [-104.709, 40.423] },
      { id: "boulder", name: "Boulder", ll: [-105.270, 40.015] },
      { id: "broomfield", name: "Broomfield", ll: [-105.087, 39.921] },
      { id: "brighton", name: "Brighton", ll: [-104.820, 39.985] },
      { id: "denver", name: "Denver Metro", ll: [-104.990, 39.739] },
      { id: "cheyenne", name: "Cheyenne, WY", ll: [-104.820, 41.140] },
    ];
    const AREA = [[-105.20, 40.70], [-105.02, 41.24], [-104.62, 41.24], [-104.64, 40.56], [-104.58, 40.38], [-104.70, 40.02], [-104.86, 39.66], [-105.12, 39.66], [-105.36, 39.95], [-105.20, 40.30], [-105.20, 40.70]];
    const HOME = { center: [-104.96, 40.42], zoom: 7.95, pitch: 52, bearing: -14 };
    const BRONZE = "#c6a26c", BONE = "#efeae1";
    const DEM = { type: "raster-dem", tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"], encoding: "terrarium", tileSize: 256, maxzoom: 14 };
    const style = {
      version: 8,
      glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
      sources: {
        omt: { type: "vector", url: "https://tiles.openfreemap.org/planet", attribution: '&copy; <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' },
        relief: { ...DEM, attribution: "Terrain: Mapzen / AWS Open Data" },
        terrain: DEM,
        area: { type: "geojson", data: { type: "Feature", geometry: { type: "Polygon", coordinates: [AREA] } } },
      },
      layers: [
        { id: "bg", type: "background", paint: { "background-color": "#0f0e0c" } },
        { id: "hillshade", type: "hillshade", source: "relief", paint: { "hillshade-shadow-color": "#050504", "hillshade-highlight-color": "#4a4236", "hillshade-accent-color": "#191714", "hillshade-exaggeration": 0.85, "hillshade-illumination-direction": 300 } },
        { id: "water", type: "fill", source: "omt", "source-layer": "water", paint: { "fill-color": "#11171a", "fill-opacity": 0.95 } },
        { id: "waterway", type: "line", source: "omt", "source-layer": "waterway", minzoom: 9, paint: { "line-color": "#1a2328", "line-width": 1 } },
        { id: "urban", type: "fill", source: "omt", "source-layer": "landuse", filter: ["in", ["get", "class"], ["literal", ["residential", "commercial", "industrial", "retail"]]], paint: { "fill-color": BONE, "fill-opacity": ["interpolate", ["linear"], ["zoom"], 7, 0.025, 12, 0.05] } },
        { id: "roads-minor", type: "line", source: "omt", "source-layer": "transportation", minzoom: 10.5, filter: ["in", ["get", "class"], ["literal", ["minor", "tertiary", "secondary"]]], paint: { "line-color": BONE, "line-opacity": 0.07, "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.4, 14, 1.4] } },
        { id: "roads-major", type: "line", source: "omt", "source-layer": "transportation", filter: ["in", ["get", "class"], ["literal", ["primary", "trunk"]]], paint: { "line-color": BONE, "line-opacity": 0.13, "line-width": ["interpolate", ["linear"], ["zoom"], 7, 0.5, 13, 2] } },
        { id: "roads-motorway", type: "line", source: "omt", "source-layer": "transportation", filter: ["==", ["get", "class"], "motorway"], paint: { "line-color": BRONZE, "line-opacity": 0.42, "line-width": ["interpolate", ["linear"], ["zoom"], 7, 0.8, 13, 3] } },
        { id: "area-fill", type: "fill", source: "area", paint: { "fill-color": BRONZE, "fill-opacity": 0.075 } },
        { id: "area-line", type: "line", source: "area", paint: { "line-color": BRONZE, "line-width": 1.4, "line-dasharray": [3, 3], "line-opacity": 0.85 } },
        { id: "towns", type: "symbol", source: "omt", "source-layer": "place", filter: ["all", ["in", ["get", "class"], ["literal", ["city", "town"]]], ["!", ["in", ["get", "name"], ["literal", ["Fort Collins", "Windsor", "Severance", "Greeley", "Boulder", "Broomfield", "Brighton", "Denver", "Evans", "Garden City", "Cheyenne"]]]]], layout: { "text-field": ["upcase", ["get", "name"]], "text-font": ["Noto Sans Regular"], "text-size": 10, "text-letter-spacing": 0.25, "text-max-width": 8 }, paint: { "text-color": "#6f695f", "text-halo-color": "#0f0e0c", "text-halo-width": 1.2 } },
      ],
    };
    const start = (tries = 0) => {
      if (!window.maplibregl) { if (tries < 100) setTimeout(() => start(tries + 1), 100); return; }
      const ml = window.maplibregl;
      const wide = { center: [-104.96, 40.45], zoom: 6.9, pitch: 0, bearing: 0 };
      const map = new ml.Map({ container: el, style, ...(reduced ? HOME : wide), maxPitch: 70, minZoom: 6.5, maxZoom: 15, cooperativeGestures: true, attributionControl: false, fadeDuration: 0 });
      map.addControl(new ml.AttributionControl({ compact: true }), "bottom-right");
      map.addControl(new ml.NavigationControl({ visualizePitch: true }), "top-right");
      let ready = false;
      map.on("load", () => { ready = true; map.setTerrain({ source: "terrain", exaggeration: 1.45 }); });

      const markers = {};
      PLACES.forEach((p) => {
        const node = document.createElement("div");
        node.className = "map__pin" + (p.hq ? " is-hq" : "") + (p.left ? " is-left" : "");
        node.innerHTML = `<span class="map__pulse"></span><span class="map__core"></span><b>${p.name}${p.hq ? `<i>${T("Home base")}</i>` : ""}</b>`;
        node.addEventListener("click", () => fly(p.id));
        markers[p.id] = new ml.Marker({ element: node, anchor: "center" }).setLngLat(p.ll).addTo(map);
      });
      const range = document.createElement("div");
      range.className = "map__label is-range"; range.textContent = "Front Range";
      new ml.Marker({ element: range }).setLngLat([-105.42, 40.2]).addTo(map);

      const coord = $("#mapCoord");
      const fmt = ([x, y]) => `${Math.abs(y).toFixed(2)}° N · ${Math.abs(x).toFixed(2)}° W`;
      map.on("move", () => { if (coord) coord.textContent = fmt(map.getCenter().toArray()); });

      const hot = (id, on) => {
        if (id === "northern") { if (map.getLayer("area-fill")) map.setPaintProperty("area-fill", "fill-opacity", on ? 0.16 : 0.075); return; }
        markers[id]?.getElement().classList.toggle("is-hot", on);
        $$(`#areasList [data-pin="${id}"]`).forEach((li) => li.classList.toggle("is-hot", on));
      };
      function fly(id) {
        if (id === "northern") return map.flyTo({ ...HOME, duration: reduced ? 0 : 2200, essential: true });
        const p = PLACES.find((x) => x.id === id);
        if (p) map.flyTo({ center: p.ll, zoom: p.id === "denver" ? 10.4 : 11.6, pitch: 58, bearing: map.getBearing() - 18, duration: reduced ? 0 : 2400, curve: 1.5, essential: true });
      }
      $$("#areasList li").forEach((li) => {
        li.tabIndex = 0;
        li.addEventListener("mouseenter", () => hot(li.dataset.pin, true));
        li.addEventListener("mouseleave", () => hot(li.dataset.pin, false));
        li.addEventListener("click", () => fly(li.dataset.pin));
        li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fly(li.dataset.pin); } });
      });
      Object.entries(markers).forEach(([id, m]) => { const n = m.getElement(); n.addEventListener("mouseenter", () => hot(id, true)); n.addEventListener("mouseleave", () => hot(id, false)); });
      $("#mapReset")?.addEventListener("click", () => map.flyTo({ ...HOME, duration: reduced ? 0 : 2000, essential: true }));

      // First time the map comes into view: sweep down from overhead into the pitched Front Range view.
      if (!reduced) {
        let swept = false;
        const sweep = () => { if (swept) return; swept = true; map.flyTo({ ...HOME, duration: 4200, curve: 1.2, essential: true }); };
        new IntersectionObserver((es, io) => es.forEach((en) => { if (en.isIntersecting) { io.disconnect(); ready ? setTimeout(sweep, 200) : map.once("load", () => setTimeout(sweep, 300)); } }), { threshold: 0.45 }).observe(el);
      }
      addEventListener("resize", () => map.resize());
    };
    start();
  }

  /* ---------- Quote form ---------- */
  function quoteForm() {
    const form = $("#quoteForm");
    if (!form) return;
    const status = $("#formStatus"), submit = $("#quoteSubmit"), sel = $("#f-service");
    const want = new URLSearchParams(location.search).get("service");
    if (want) [...sel.options].forEach((o) => { if (o.text.toLowerCase() === want.toLowerCase()) sel.value = o.value || o.text; });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.className = "form__status";
      const data = Object.fromEntries(new FormData(form));
      let bad = null;
      [["name", (v) => v.trim().length > 1], ["email", (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)], ["phone", (v) => v.replace(/\D/g, "").length >= 10]].forEach(([k, ok]) => {
        const valid = ok(data[k] || "");
        form.elements[k].closest(".field").classList.toggle("is-invalid", !valid);
        if (!valid && !bad) bad = form.elements[k];
      });
      if (bad) { status.textContent = T("Please add your name, a valid email and a phone number."); status.classList.add("is-err"); bad.focus(); return; }
      submit.disabled = true;
      submit.textContent = T("Sending...");
      try {
        const r = await fetch(API + "/api/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        if (!r.ok) throw new Error(String(r.status));
        form.reset();
        status.textContent = T("Thanks! Your request is in. We'll get back to you as soon as possible.");
        status.classList.add("is-ok");
      } catch (_) {
        const body = `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\nService: ${data.service || "-"}\nMeasurements: ${data.dimensions || "-"}\n\n${data.notes || ""}`;
        const mail = `mailto:info@cimarronconcrete.com?subject=${encodeURIComponent("Quote request: " + (data.service || "Concrete project"))}&body=${encodeURIComponent(body)}`;
        status.innerHTML = LANG_ES ? `No pudimos enviarlo automáticamente. Por favor <a href="${mail}">envíelo por correo</a> o llame al (970) 388-2222.` : `We couldn't send that automatically. Please <a href="${mail}">email it to us</a> or call (970) 388-2222.`;
        status.classList.add("is-err");
      } finally {
        submit.disabled = false;
        submit.textContent = T("Send My Request");
      }
    });
  }

  /* ---------- Go ---------- */
  if (hasGsap && document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  reveal();
  services();
  tabs();
  reviews();
  gallery();
  videos();
  areaMap();
  quoteForm();
  if (isHome) buildSequence();
  else if (Loader.active) {
    let fake = 0;
    const tick = setInterval(() => Loader.set((fake = Math.min(0.85, fake + 0.07))), 120);
    const ready = () => { clearInterval(tick); Loader.done().then(motion); };
    document.readyState === "complete" ? ready() : addEventListener("load", ready, { once: true });
  } else motion();
})();
