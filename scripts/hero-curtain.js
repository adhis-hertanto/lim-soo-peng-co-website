/* Hero curtain: the hero stays pinned (CSS sticky) while the About section slides up over it like a curtain.
   GSAP adds the scroll-linked motion on top: the photo drifts slower than the text, and the text rises and fades.
   Lenis gives smooth scrolling, synced with ScrollTrigger and driven from the GSAP ticker.
   Plain script (no modules), so it works from file://.

   Skipped under prefers-reduced-motion (nothing registered; the hero stays a plain sticky hero) and with ?static=1
   (for screenshot checks). Every value that shapes the feel is in CONFIG. */
(function () {
  var CONFIG = {
    pinDistanceVh: 1,                   // how far the curtain travels, in viewport heights. Ends as About covers the hero.
    bg: {
      scaleTo: 1.1,                     // photo scale at the end (slowest layer)
      driftPercent: -4                  // photo yPercent at the end
    },
    content: {
      travelVh: 30,                     // text rises this many vh over the full timeline (faster than the photo)
      fade: { start: 0, end: 0.6 }      // text opacity 1 to 0 between these fractions of the timeline
    },
    narrowMax: 768,                     // at this width and below, drift, travel and scale are halved
    narrowFactor: 0.5,
    lenis: { duration: 1.1, smoothWheel: true }
  };

  var hero = document.querySelector(".hero");
  var about = document.querySelector(".about");
  if (!hero || !about) return;

  var params = new URLSearchParams(window.location.search);
  var isStatic = params.get("static") === "1";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var cleanup = [];
  var lenis = null;

  // Once the curtain covers the hero, hide the hero so nothing under the later sections can show through.
  // Plain DOM check, so it works with or without GSAP and under reduced motion.
  function syncCover() {
    hero.classList.toggle("is-covered", about.getBoundingClientRect().top <= 0);
  }
  window.addEventListener("scroll", syncCover, { passive: true });
  window.addEventListener("resize", syncCover);
  cleanup.push(function () {
    window.removeEventListener("scroll", syncCover);
    window.removeEventListener("resize", syncCover);
  });
  syncCover();

  // "Back to top" and the logo (#top): the hero is sticky, so it always sits at the top of the viewport and the browser
  // (or Lenis) would think it is already there. Go to the top of the page directly instead.
  function onTop(e) {
    var link = e.target.closest && e.target.closest('a[href="#top"]');
    if (!link || e.defaultPrevented) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: reduce.matches ? "auto" : "smooth" });
  }
  document.addEventListener("click", onTop);
  cleanup.push(function () { document.removeEventListener("click", onTop); });

  // Design px to screen px: 1rem grows from 16px at 1440 to 21.33px at 1920 (tokens.css).
  function rem(px) { return px * parseFloat(getComputedStyle(document.documentElement).fontSize) / 16; }

  // Anchor links: smooth scroll with Lenis, clearing the 112px nav offset.
  // Links the About reveal already handled (it calls preventDefault) are left alone.
  var tick = null;

  function onAnchor(e) {
    if (e.defaultPrevented || !lenis) return;
    var link = e.target.closest && e.target.closest('a[href^="#"]');
    if (!link) return;
    var target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -rem(112) });
  }

  function startSmoothScroll() {
    if (!window.Lenis || !window.gsap || !window.ScrollTrigger) return;
    lenis = new Lenis(CONFIG.lenis);
    lenis.on("scroll", ScrollTrigger.update);
    tick = function (time) { lenis.raf(time * 1000); };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    document.addEventListener("click", onAnchor);
    cleanup.push(function () {
      document.removeEventListener("click", onAnchor);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenis = null;
    });
  }

  if (!window.gsap || !window.ScrollTrigger || reduce.matches || isStatic) {
    window.HeroCurtain = {
      kill: function () { cleanup.forEach(function (fn) { fn(); }); },
      scrollTo: function (y) { window.scrollTo(0, y); },
      setScroll: function () {}
    };
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  startSmoothScroll();

  var media = hero.querySelector(".hero__media");
  // Text block, progress control and gold circle move together: all rise and fade with the same values.
  var content = [hero.querySelector(".hero__body"), hero.querySelector(".hero__progress"), hero.querySelector(".hero__deco")].filter(Boolean);
  var mm = gsap.matchMedia();

  function build(ctx) {
    var k = ctx.conditions.narrow ? CONFIG.narrowFactor : 1;
    var scaleTo = 1 + (CONFIG.bg.scaleTo - 1) * k;
    var drift = CONFIG.bg.driftPercent * k;
    var travel = CONFIG.content.travelVh * k;

    // One timeline, normalised 0 to 1, scrubbed to the scroll distance of the pin.
    var tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: function () { return "+=" + window.innerHeight * CONFIG.pinDistanceVh; },
        scrub: true,
        invalidateOnRefresh: true
      }
    });

    // Background: slowest layer, scales and drifts up.
    tl.to(media, { scale: scaleTo, yPercent: drift, duration: 1 }, 0);
    // Content: rises faster than the background, and fades out early.
    tl.to(content, {
      y: function () { return -window.innerHeight * travel / 100; },
      duration: 1
    }, 0);
    tl.to(content, {
      opacity: 0,
      duration: CONFIG.content.fade.end - CONFIG.content.fade.start
    }, CONFIG.content.fade.start);
  }

  // Timelines created inside matchMedia are reverted automatically when the breakpoint changes or on revert().
  // One callback per breakpoint: wide screens get the full motion, narrow ones the gentler version.
  mm.add({
    wide: "(min-width: " + (CONFIG.narrowMax + 1) + "px)",
    narrow: "(max-width: " + CONFIG.narrowMax + "px)"
  }, build);

  window.HeroCurtain = {
    // Jump to a scroll position through Lenis when it is running (used by footer-reveal.js).
    scrollTo: function (y) { if (lenis) lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y); },
    // Pause and resume smooth scrolling (the page loader locks scrolling while it plays).
    setScroll: function (on) { if (lenis) { if (on) lenis.start(); else lenis.stop(); } },
    kill: function () {
      mm.revert();   // removes the timeline, ScrollTrigger and inline transforms it created
      cleanup.forEach(function (fn) { fn(); });
      hero.classList.remove("is-covered");
    }
  };
})();
