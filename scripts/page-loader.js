/* Page loader: plays on every load and refresh. A counter and progress line run from 0 to 100 while three words
   (Clarity, Direction, Peace of mind) arrive one after another, then the olive panel lifts away, curved edge first.
   One GSAP timeline. The counter holds before its last stretch until the page is actually ready (fonts loaded and
   the first hero photo decoded), for at most CONFIG.readyMax milliseconds, so a slow connection never traps anyone.
   Plain script (no modules), so it works from file://.

   Shown only when the head script adds html.loading: not with prefers-reduced-motion, not with ?static=1, and never
   without JavaScript. Events: "pageloader:leave" (the panel is half way up: the hero reveal starts) and
   "pageloader:done" (finished: the hero carousel starts). Every value is in CONFIG. */
(function () {
  var CONFIG = {
    stages: [33, 66, 100],            // the counter value at which each word arrives
    segment: 0.6,                      // seconds the counter takes for each third (about 1.8s of counting)
    pause: 0.25,                       // seconds the counter holds at the first two stages
    word: { y: 24, duration: 0.55, ease: "power3.out" },
    move: { duration: 0.4, ease: "power3.out" },  // the block moves up one line when a word arrives
    hold: 0.3,                         // seconds on 100% before the counter and line fade
    fade: 0.3,
    // Shared with the page transition (scripts/page-transition.js loads first and owns these values).
    slide: (window.PageTransition && window.PageTransition.slide) || { duration: 0.9, ease: "power3.inOut", leaveAt: 0.45, extra: 8 },
    readyMax: 6000                     // ms to wait for fonts and the first photo before carrying on anyway
  };

  var root = document.documentElement;
  var loader = document.querySelector("[data-loader]");
  if (!loader) return;
  if (root.classList.contains("entering")) return;   // arriving from another page: scripts/page-transition.js lifts the panel
  var page = document.querySelector(".page");

  function setScroll(on) {
    if (window.HeroCurtain && window.HeroCurtain.setScroll) window.HeroCurtain.setScroll(on);
  }

  function finish() {
    root.classList.remove("loading");
    if (page) page.inert = false;
    setScroll(true);
    if (loader.parentNode) loader.parentNode.removeChild(loader);
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    document.dispatchEvent(new Event("pageloader:done"));
  }

  // Not playing (reduced motion, ?static=1, no GSAP, or restored from the back-forward cache): get out of the way.
  if (!root.classList.contains("loading") || !window.gsap) {
    root.classList.remove("loading");
    if (loader.parentNode) loader.parentNode.removeChild(loader);
    document.dispatchEvent(new Event("pageloader:done"));
    return;
  }
  window.addEventListener("pageshow", function (e) { if (e.persisted && loader.parentNode) finish(); });

  var panel = loader.querySelector("[data-loader-panel]");
  var curve = loader.querySelector("[data-loader-curve]");
  var block = loader.querySelector("[data-loader-block]");
  var progress = loader.querySelector("[data-loader-progress]");
  var count = loader.querySelector("[data-loader-count]");
  var fill = loader.querySelector("[data-loader-fill]");
  var words = Array.prototype.slice.call(loader.querySelectorAll("[data-loader-word]"));

  // The rest of the page waits, unreachable by keyboard, while the loader plays.
  if (page) page.inert = true;
  setScroll(false);

  // Ready = fonts loaded and the first hero photo decoded, or the time limit.
  var ready = false;
  var photo = document.querySelector(".hero__photo.is-active");
  var readyPromise = Promise.race([
    Promise.all([
      document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
      photo && photo.decode ? photo.decode().catch(function () {}) : Promise.resolve()
    ]),
    new Promise(function (resolve) { setTimeout(resolve, CONFIG.readyMax); })
  ]).then(function () { ready = true; });

  // The block is bottom-anchored. To start with only the counter near the bottom and bring each word into view, it is
  // pushed down by the height of the words still to come, and moves up as each one arrives.
  function heightFrom(index) {
    var sum = 0;
    for (var i = index; i < words.length; i++) sum += words[i].offsetHeight;
    return sum;
  }
  function offsetAt(stage) {
    if (stage === 0) return heightFrom(0) + parseFloat(window.getComputedStyle(progress).marginBottom);
    return heightFrom(stage);
  }

  var state = { v: 0 };
  var setFill = gsap.quickSetter(fill, "scaleX");
  function render() {
    count.textContent = Math.round(state.v);
    setFill(state.v / 100);
  }

  gsap.set(block, { y: offsetAt(0), autoAlpha: 1 });
  render();

  var tl = gsap.timeline({ defaults: { ease: "none" }, onComplete: finish });
  var t = 0;
  CONFIG.stages.forEach(function (target, i) {
    // Before the last stretch, wait here if the page is not ready yet.
    if (i === CONFIG.stages.length - 1) {
      tl.call(function () {
        if (!ready) {
          tl.pause();
          readyPromise.then(function () { tl.resume(); });
        }
      }, null, t);
    }
    tl.to(state, { v: target, duration: CONFIG.segment, ease: "none", onUpdate: render }, t);
    t += CONFIG.segment;
    tl.fromTo(words[i],
      { autoAlpha: 0, y: CONFIG.word.y },
      { autoAlpha: 1, y: 0, duration: CONFIG.word.duration, ease: CONFIG.word.ease }, t);
    tl.to(block, {
      y: function () { return offsetAt(i + 1); },
      duration: CONFIG.move.duration, ease: CONFIG.move.ease
    }, t);
    if (i < CONFIG.stages.length - 1) t += CONFIG.pause;
  });

  t += CONFIG.hold;
  tl.to(progress, { autoAlpha: 0, duration: CONFIG.fade, ease: "power1.out" }, t);
  t += CONFIG.fade;

  // The panel lifts away; its curved edge travels with it, so it leaves last, like a curtain.
  tl.to(panel, {
    y: function () { return -(panel.offsetHeight + curve.getBoundingClientRect().height + CONFIG.slide.extra); },
    duration: CONFIG.slide.duration,
    ease: CONFIG.slide.ease
  }, t);
  tl.call(function () { document.dispatchEvent(new Event("pageloader:leave")); }, null, t + CONFIG.slide.leaveAt);
})();
