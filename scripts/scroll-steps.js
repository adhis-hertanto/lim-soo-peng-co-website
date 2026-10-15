/* What we do: on every breakpoint the section pins at viewport height and steps through Litigation,
   Arbitration and Mediation as you scroll. With reduced motion, the steps stay stacked and nothing pins. */
(function () {
  var root = document.querySelector("[data-steps]");
  if (!root) return;
  var steps = Array.prototype.slice.call(root.querySelectorAll(".step"));
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)");
  var ticking = false;

  function canPin() { return !calm.matches; }

  var current = -1;

  // Only touch the DOM when the active step changes, not on every scroll frame.
  function activate(i) {
    if (i === current) return;
    current = i;
    steps.forEach(function (s, n) { s.classList.toggle("is-active", n === i); });
  }

  function update() {
    ticking = false;
    if (!root.classList.contains("is-pinned")) return;
    var rect = root.getBoundingClientRect();
    var span = rect.height - window.innerHeight;
    var p = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 0;
    activate(Math.min(steps.length - 1, Math.floor(p * steps.length)));
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  function sync() {
    var pin = canPin();
    root.classList.toggle("is-pinned", pin);
    if (pin) update();
    else { current = -1; steps.forEach(function (s) { s.classList.add("is-active"); }); }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  calm.addEventListener("change", sync);
  sync();
})();
