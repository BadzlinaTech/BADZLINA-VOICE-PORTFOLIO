/**
 * Cinematic scroll experience — GSAP ScrollTrigger + Splitting.js
 * -----------------------------------------------------------
 * Every section is a "chapter": the page background flows to a new
 * pastel colour as each chapter takes over, titles write themselves
 * letter by letter, scenes rise in like film shots, and the hero sits
 * on a living canvas of voice-waves that repaint as you scroll.
 * Degrades gracefully: if the CDN libraries fail to load, the
 * IntersectionObserver reveal in main.js takes over instead.
 */
(function cinematic() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || !window.ScrollTrigger || reduceMotion) return;

  gsap.registerPlugin(ScrollTrigger);

  // ---------- 1. Letter-by-letter titles (Splitting.js) ----------
  if (window.Splitting) {
    Splitting({ target: '[data-splitting]', by: 'chars' });

    // background-clip:text gradients break once chars are transformed,
    // so repaint the hero gradient as one colour per letter instead
    function heroGradient(t) {
      const stops = [
        { at: 0.30, c: [46, 42, 42] },    // --dark
        { at: 0.65, c: [79, 168, 206] },  // --sky-deep
        { at: 1.00, c: [239, 143, 184] }  // --pink-deep
      ];
      let prev = { at: 0, c: stops[0].c };
      for (let i = 0; i < stops.length; i++) {
        if (t <= stops[i].at) {
          const span = stops[i].at - prev.at || 1;
          const k = (t - prev.at) / span;
          const c = prev.c.map(function (v, j) {
            return Math.round(v + (stops[i].c[j] - v) * k);
          });
          return 'rgb(' + c.join(',') + ')';
        }
        prev = stops[i];
      }
      return 'rgb(' + stops[stops.length - 1].c.join(',') + ')';
    }

    // the hero title plays immediately, like an opening credit
    document.querySelectorAll('.hero [data-splitting]').forEach(function (el) {
      el.classList.add('char-colored');
      const chars = el.querySelectorAll('.char');
      chars.forEach(function (c, i) {
        const col = heroGradient(chars.length > 1 ? i / (chars.length - 1) : 0);
        c.style.color = col;
        c.style.webkitTextFillColor = col;
      });
      gsap.fromTo(chars,
        { opacity: 0, y: 60, rotateX: -90, transformPerspective: 600 },
        { opacity: 1, y: 0, rotateX: 0, stagger: 0.035, duration: 0.9, ease: 'back.out(1.6)', delay: 0.15 });
    });

    // every other split title writes itself in when its chapter arrives
    document.querySelectorAll('[data-splitting]').forEach(function (el) {
      if (el.closest('.hero')) return;
      const chars = el.querySelectorAll('.char');
      if (!chars.length) return;
      gsap.fromTo(chars,
        { opacity: 0, y: 46, rotateX: -90, transformPerspective: 600 },
        {
          scrollTrigger: { trigger: el.closest('section') || el, start: 'top 72%' },
          opacity: 1, y: 0, rotateX: 0, stagger: 0.03, duration: 0.7, ease: 'back.out(1.7)'
        });
    });
  }

  // ---------- 2. Fluid chapter colours ----------
  const chapters = [
    { sel: '.hero',    color: '#FFFCF7' },
    { sel: '#about',   color: '#FDEFF6' },
    { sel: '#reel',    color: '#E9F5FC' },
    { sel: '#genres',  color: '#EAFAF2' },
    { sel: '#specs',   color: '#FFF5E0' },
    { sel: '#booking', color: '#FFEDE6' }
  ];
  chapters.forEach(function (ch) {
    const el = document.querySelector(ch.sel);
    if (!el) return;
    function paint() {
      gsap.to('body', { backgroundColor: ch.color, duration: 1.1, ease: 'power2.out' });
    }
    ScrollTrigger.create({
      trigger: el, start: 'top 55%', end: 'bottom 55%',
      onEnter: paint, onEnterBack: paint
    });
  });

  // ---------- 3. Cinematic scene entrances ----------
  gsap.utils.toArray('.about-card, .reel-card, .genre-tabs, .booking-wrap').forEach(function (el) {
    gsap.fromTo(el,
      { opacity: 0, y: 90, scale: 0.94 },
      {
        scrollTrigger: { trigger: el, start: 'top 82%' },
        opacity: 1, y: 0, scale: 1, duration: 1.05, ease: 'power3.out'
      });
  });

  gsap.utils.toArray('.section-sub').forEach(function (el) {
    gsap.fromTo(el,
      { opacity: 0, y: 30 },
      {
        scrollTrigger: { trigger: el, start: 'top 85%' },
        opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.15
      });
  });

  gsap.utils.toArray('.spec-item').forEach(function (el, i) {
    gsap.fromTo(el,
      { opacity: 0, y: 60, x: (i % 2 === 0 ? -40 : 40) },
      {
        scrollTrigger: { trigger: el, start: 'top 85%' },
        opacity: 1, y: 0, x: 0, duration: 0.9, ease: 'power3.out', delay: (i % 4) * 0.08
      });
  });

  // the hero drifts away like a title card as chapter two takes over
  gsap.to('.hero-inner', {
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    yPercent: -20, opacity: 0.2, ease: 'none'
  });

  // ---------- 4. The living voice canvas ----------
  const canvas = document.getElementById('voiceCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const hero = document.querySelector('.hero');

  function resize() {
    canvas.width = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // the wave colours "sing" from one pastel chord to another on scroll
  const paletteA = [[126, 200, 227], [247, 184, 210], [244, 201, 93]];
  const paletteB = [[248, 123, 85], [181, 234, 215], [239, 143, 184]];

  function lerp(a, b, t) { return a + (b - a) * t; }
  function mix(c1, c2, t) {
    return 'rgba(' + Math.round(lerp(c1[0], c2[0], t)) + ',' +
      Math.round(lerp(c1[1], c2[1], t)) + ',' +
      Math.round(lerp(c1[2], c2[2], t)) + ',';
  }

  let raf = null;
  function draw(time) {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const scrollT = Math.min(window.scrollY / (window.innerHeight * 1.2), 1);
    const t = time * 0.001;

    for (let layer = 0; layer < 3; layer++) {
      const base = mix(paletteA[layer], paletteB[layer], scrollT);
      const amp = (h * 0.055) * (1 + layer * 0.5) * (1 + 0.25 * Math.sin(t * (0.7 + layer * 0.3)));
      const yBase = h * (0.56 + layer * 0.13);
      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) {
        const y = yBase +
          Math.sin(x * 0.008 + t * (1.1 + layer * 0.35) + layer * 2.1) * amp +
          Math.sin(x * 0.02 - t * (0.6 + layer * 0.2)) * amp * 0.35;
        if (x === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = base + (0.18 - layer * 0.04) + ')';
      ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  }
  raf = requestAnimationFrame(draw);

  // pause the canvas while the hero is off screen (saves phone battery)
  ScrollTrigger.create({
    trigger: hero, start: 'top bottom', end: 'bottom top',
    onLeave: function () { if (raf) { cancelAnimationFrame(raf); raf = null; } },
    onEnterBack: function () { if (!raf) { raf = requestAnimationFrame(draw); } }
  });
})();
