/* Page transition: moving between index.html, privacy-policy.html and terms-of-use.html. The page loader's olive panel and
   curved edge, without the counter, line or words.
   Leaving: a click on an internal link to another page slides the panel up from the bottom to cover the page (html.leaving),
   sets a flag in sessionStorage, then navigates. Arriving: the head script sees the flag and adds html.entering, so the panel
   already covers the screen; it then lifts away exactly as the loader's does (the same CONFIG.slide, shared with
   page-loader.js through window.PageTransition). On index.html the full loader is skipped in that case; it still plays on a
   first visit, a refresh and a direct load. "pageloader:leave" and "pageloader:done" fire as they do after the loader, so the
   hero reveal and carousel start as usual.
   Plain script (no modules), so it works from file://. Without GSAP, or under prefers-reduced-motion or ?static=1, links
   navigate normally and the head script never adds html.entering. Every value is in CONFIG. */
(function () {
  var CONFIG = {
    flag: "lsp-transition",
    // The loader's panel lift (page-loader.js reads this object): seconds, ease, px of extra travel, and when the hero starts.
    slide: { duration: 0.9, ease: "power3.inOut", leaveAt: 0.45, extra: 8 },
    readyMax: 6000,      // ms to wait for fonts and the first hero photo before lifting anyway (same as the loader)
    safety: 2000         // ms past readyMax and the lift before the cover is forced away
  };
  window.PageTransition = { slide: CONFIG.slide };

  var root = document.documentElement;
  var page = document.querySelector(".page");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var isStatic = new URLSearchParams(window.location.search).get("static") === "1";
  var busy = false;

  function store(on) {
    try { if (on) sessionStorage.setItem(CONFIG.flag, "1"); else sessionStorage.removeItem(CONFIG.flag); } catch (e) {}
  }

  // While the panel covers the page, the page is unreachable by keyboard and does not scroll.
  function lock(on) {
    if (page) page.inert = on;
    if (window.HeroCurtain && window.HeroCurtain.setScroll) window.HeroCurtain.setScroll(!on);
  }

  function build() {
    var el = document.createElement("div");
    el.className = "loader";
    el.setAttribute("data-loader", "");
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<div class="loader__panel" data-loader-panel><svg class="loader__curve" data-loader-curve viewBox="0 0 1440 51" preserveAspectRatio="none" focusable="false"><path d="M0 0H1440V1C1440 1 1071.5 51 720 51C368.5 51 0 1 0 1V0Z"/></svg></div>';
    return el;
  }

  // ---- Arriving: the panel covers the screen, then lifts away ----
  function arrive() {
    var loader = document.querySelector("[data-loader]");
    var panel = loader && loader.querySelector("[data-loader-panel]");
    var curve = loader && loader.querySelector("[data-loader-curve]");
    var done = false;

    function finish() {
      if (done) return;
      done = true;
      root.classList.remove("entering");
      if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
      lock(false);
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      var title = document.querySelector(".page-head__title");
      if (title) title.focus({ preventScroll: true });
      document.dispatchEvent(new Event("pageloader:done"));
      // index.html#section: scroll there the way the page already does (Lenis, the pinned About), once the panel has gone.
      if (location.hash.length > 1) {
        try {
          var link = document.querySelector('a[href="' + location.hash + '"]');
          if (link) link.click();
        } catch (e) {}
      }
    }

    if (!panel || !window.gsap) {
      document.dispatchEvent(new Event("pageloader:leave"));
      finish();
      return;
    }

    lock(true);
    if (location.hash.length > 1) window.scrollTo(0, 0);

    var photo = document.querySelector(".hero__photo.is-active");
    Promise.race([
      Promise.all([
        document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
        photo && photo.decode ? photo.decode().catch(function () {}) : Promise.resolve()
      ]),
      new Promise(function (resolve) { setTimeout(resolve, CONFIG.readyMax); })
    ]).then(function () {
      var S = CONFIG.slide;
      var tl = gsap.timeline({ onComplete: finish });
      tl.to(panel, {
        y: -(panel.offsetHeight + curve.getBoundingClientRect().height + S.extra),
        duration: S.duration,
        ease: S.ease
      }, 0);
      tl.call(function () { document.dispatchEvent(new Event("pageloader:leave")); }, null, S.leaveAt);
    });

    // Never leave the page covered.
    setTimeout(finish, CONFIG.readyMax + CONFIG.slide.duration * 1000 + CONFIG.safety);
  }

  // ---- Leaving: the panel rises to cover the page, then the next page loads ----
  function leave(url) {
    busy = true;
    var loader = document.querySelector("[data-loader]");
    if (!loader) {
      loader = build();
      document.body.insertBefore(loader, document.body.firstChild);
    }
    var panel = loader.querySelector("[data-loader-panel]");
    var curve = loader.querySelector("[data-loader-curve]");
    var S = CONFIG.slide;

    loader.classList.add("loader--rise");
    root.classList.add("leaving");
    lock(true);
    gsap.set(panel, { y: window.innerHeight + curve.getBoundingClientRect().height + S.extra });
    gsap.to(panel, {
      y: 0,
      duration: S.duration,
      ease: S.ease,
      onComplete: function () {
        store(true);
        window.location.href = url;
      }
    });
  }

  function clean(path) { return path.replace(/index\.html$/, ""); }

  function onClick(e) {
    if (busy || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!window.gsap || reduce.matches || isStatic) return;
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    if (a.protocol !== window.location.protocol || a.host !== window.location.host) return;   // other sites, mailto:, tel:
    if (clean(a.pathname) === clean(window.location.pathname)) return;                         // same page: native or Lenis
    e.preventDefault();
    leave(a.href);
  }
  document.addEventListener("click", onClick);

  // Back and forward can restore this page, cover and all, from the browser's cache: clear it so it never sticks.
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    store(false);
    busy = false;
    root.classList.remove("leaving", "entering");
    var loader = document.querySelector("[data-loader].loader--rise");
    if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
    lock(false);
  });

  if (root.classList.contains("entering")) arrive();
})();
