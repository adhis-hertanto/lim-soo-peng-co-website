/* Hero carousel: 4 slides, 4.5s each, current segment fills, 0.6s cross-fade (CSS) of photo, text and buttons.
   Click a segment to jump. Keeps playing on hover; pauses only while keyboard focus is on the carousel and when the
   tab is hidden. Only the current slide is exposed to screen readers. With prefers-reduced-motion there is no autoplay. */
(function () {
  var root = document.querySelector("[data-carousel]");
  if (!root) return;
  var slides = Array.prototype.slice.call(root.querySelectorAll(".hero__slide"));
  var photos = Array.prototype.slice.call(root.querySelectorAll(".hero__photo"));
  var segs = Array.prototype.slice.call(root.querySelectorAll(".progress__seg"));
  var fills = segs.map(function (s) { return s.querySelector(".progress__fill"); });
  var label = root.querySelector("[data-current-label]");
  var liveRegion = root.querySelector(".hero__slides");
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)");
  var DURATION = 4500; // ms per slide
  var index = 0, elapsed = 0, last = null, focus = false, raf = 0;
  // While the page loader plays, hold on slide 1 so it is not used up behind the loader.
  var held = document.documentElement.classList.contains("loading") || document.documentElement.classList.contains("entering");

  function paused() { return calm.matches || held || focus || document.hidden; }

  function release() {
    if (!held) return;
    held = false; elapsed = 0; last = null;
  }
  document.addEventListener("pageloader:done", release);
  setTimeout(release, 12000); // never stay held if the loader fails

  function setFill(i, pct) { fills[i].style.setProperty("--fill", pct + "%"); }

  function go(i) {
    index = (i + slides.length) % slides.length;
    elapsed = 0;
    root.setAttribute("data-current", String(index + 1)); // slide 3 uses the stronger overlay
    slides.forEach(function (s, n) {
      var on = n === index;
      s.classList.toggle("is-active", on);
      if (on) { s.removeAttribute("aria-hidden"); s.removeAttribute("inert"); }
      else { s.setAttribute("aria-hidden", "true"); s.setAttribute("inert", ""); }
    });
    photos.forEach(function (p, n) {
      var on = n === index;
      p.classList.toggle("is-active", on);
      if (on) p.removeAttribute("aria-hidden"); else p.setAttribute("aria-hidden", "true");
      if (on) p.loading = "eager";
    });
    segs.forEach(function (b, n) {
      b.setAttribute("aria-current", n === index ? "true" : "false");
      setFill(n, n === index ? (calm.matches ? 100 : 0) : 0);
    });
    if (label) label.textContent = segs[index].getAttribute("aria-label");
  }

  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (last === null) last = now;
    var dt = Math.min(now - last, 100);
    last = now;
    if (paused()) return;
    elapsed += dt;
    if (elapsed >= DURATION) { go(index + 1); return; }
    setFill(index, (elapsed / DURATION) * 100);
  }

  function updateLive() { liveRegion.setAttribute("aria-live", paused() ? "polite" : "off"); }

  function start() {
    cancelAnimationFrame(raf);
    last = null;
    if (!calm.matches) raf = requestAnimationFrame(tick);
    updateLive();
  }

  segs.forEach(function (b, n) { b.addEventListener("click", function () { go(n); }); });
  root.addEventListener("focusin", function (e) {
    // Keyboard focus pauses; a mouse click that merely focuses a segment does not.
    focus = !!(e.target.matches && e.target.matches(":focus-visible"));
    updateLive();
  });
  root.addEventListener("focusout", function (e) {
    if (!root.contains(e.relatedTarget)) { focus = false; updateLive(); }
  });
  calm.addEventListener("change", function () { go(index); start(); });

  go(0);
  start();
})();
