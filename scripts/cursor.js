/* Custom cursor: a small gold circle that trails the pointer (gsap.quickTo) and grows into a labelled circle over some areas.
   Labels come from one place, resolve() below:
   - What we do (pinned by services-scroll.js): "Explore" before the first service, then "Previous" (top half of the viewport)
     and "Next" (bottom half) on each service. A click scrolls to that stop, through Lenis when it is running.
   - Any element with data-cursor="Label" (the lawyer cards use "View"; their button already covers the whole card, so a click
     opens the bio dialog through the existing bio-dialog.js flow).
   Purely visual: no focus changes, and keyboard use is untouched. The circle is a popover so it stays above the bio <dialog>
   (the top layer ignores z-index); it is promoted again whenever a dialog opens.

   Only runs with a fine hovering pointer (never on touch). Without GSAP nothing is added and the native cursor stays.
   Under prefers-reduced-motion the lag and the scale animation are off (state changes are instant). Sizes are in components.css. */
(function () {
  if (!window.gsap) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  var CONFIG = {
    dotScale: 1 / 6,                                  // the 16px dot as a fraction of the 96px full size (--cursor-size)
    follow: { duration: 0.35, ease: "power3.out" },   // the lag behind the pointer
    grow: { duration: 0.3, ease: "power3.out" },      // scale and label fade
    epsilon: 0.02                                     // timeline units of slack when working out which stop the scroll is on
  };
  // Elements that keep the native cursor, so the circle steps aside over them (unless they are inside a labelled area).
  var NATIVE = "a[href], button, summary, label, select, input, textarea, [role='button'], [role='link']";

  var html = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var hasPopover = typeof HTMLElement.prototype.showPopover === "function";

  var el = document.createElement("div");
  el.className = "cursor";
  el.setAttribute("aria-hidden", "true");
  if (hasPopover) el.setAttribute("popover", "manual");
  var labelEl = document.createElement("span");
  labelEl.className = "cursor__label";
  el.appendChild(labelEl);
  document.body.appendChild(el);
  if (hasPopover) el.showPopover();

  gsap.set(el, { xPercent: -50, yPercent: -50, scale: 0 });
  var moveX = gsap.quickTo(el, "x", CONFIG.follow);
  var moveY = gsap.quickTo(el, "y", CONFIG.follow);

  var x = 0, y = 0;          // last pointer position
  var seen = false;          // the pointer has moved at least once
  var inside = true;         // the pointer is in the window
  var target = null;         // element under the pointer
  var current = { scale: 0, label: null };
  var queued = false;

  // ---- Labels ----

  // Stops are timeline positions from services-scroll.js. Returns { label, go } or null; go is the stop a click scrolls to.
  function services(t, py) {
    var S = window.ServicesScroll;
    var st = S && S.trigger();
    if (!st || !S.stage.contains(t)) return null;
    var pos = st.progress * S.distance;
    if (pos < S.firstService - CONFIG.epsilon) return { label: "Explore", go: S.firstService };
    var at = 0;                                                 // the stop the scroll is on (or has just passed)
    S.stops.forEach(function (s, i) { if (s <= pos + CONFIG.epsilon) at = i; });
    if (py < window.innerHeight / 2) return { label: "Previous", go: S.stops[at - 1] };
    if (at + 1 < S.stops.length) return { label: "Next", go: S.stops[at + 1] };
    return null;                                                // past the last service: nothing further to step to
  }

  function resolve(t, py) {
    if (!t || !t.closest) return null;
    var s = services(t, py);
    if (s) return s;
    var host = t.closest("[data-cursor]");
    return host ? { label: host.getAttribute("data-cursor") } : null;
  }

  // Scroll to a timeline position of the What we do pin. Lenis when it is running, native smooth scroll otherwise.
  function goTo(position) {
    var S = window.ServicesScroll;
    var st = S && S.trigger();
    if (!st || position == null) return;
    var top = st.start + position / S.distance * (st.end - st.start);
    if (window.lenis) window.lenis.scrollTo(top);
    else window.scrollTo({ top: top, behavior: reduce.matches ? "auto" : "smooth" });
  }

  // ---- Rendering ----

  function render() {
    queued = false;
    var r = seen && inside ? resolve(target, y) : null;
    var label = r && r.label;
    var scale = !seen || !inside ? 0 : label ? 1 : target && target.closest && target.closest(NATIVE) ? 0 : CONFIG.dotScale;
    html.classList.toggle("has-cursor-label", !!label);
    if (label) labelEl.textContent = label;      // keeps the old text while it fades out
    if (scale === current.scale && !!label === !!current.label) { current.label = label; return; }
    current = { scale: scale, label: label };
    if (reduce.matches) {
      gsap.set(el, { scale: scale });
      gsap.set(labelEl, { opacity: label ? 1 : 0 });
    } else {
      gsap.to(el, { scale: scale, duration: CONFIG.grow.duration, ease: CONFIG.grow.ease, overwrite: true });
      gsap.to(labelEl, { opacity: label ? 1 : 0, duration: CONFIG.grow.duration, overwrite: true });
    }
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(render);
  }

  // ---- Events ----

  document.addEventListener("mousemove", function (e) {
    x = e.clientX; y = e.clientY; target = e.target;
    inside = true;
    if (!seen) {
      seen = true;
      html.classList.add("has-cursor");
      gsap.set(el, { x: x, y: y });
    } else if (reduce.matches) {
      gsap.set(el, { x: x, y: y });
    } else {
      moveX(x); moveY(y);
    }
    queue();
  }, { passive: true });

  html.addEventListener("mouseleave", function () { inside = false; queue(); });
  html.addEventListener("mouseenter", function () { inside = true; queue(); });

  // The page moves under a still pointer: look at what is under it again.
  function onScroll() {
    if (!seen) return;
    target = document.elementFromPoint(x, y);
    queue();
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  if (window.ServicesScroll) window.ServicesScroll.onUpdate(onScroll);

  document.addEventListener("click", function (e) {
    var r = resolve(e.target, e.clientY);
    if (r && r.go != null) goTo(r.go);
  });

  // Keep the circle above a modal <dialog> (both live in the top layer; the later one is on top).
  new MutationObserver(function (records) {
    records.forEach(function (rec) {
      var dialog = rec.target;
      if (hasPopover) { if (dialog.open) { el.hidePopover(); el.showPopover(); } }
      else (dialog.open ? dialog : document.body).appendChild(el);
    });
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });

  window.Cursor = { refresh: onScroll };
})();
