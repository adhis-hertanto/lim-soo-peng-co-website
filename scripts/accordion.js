/* Matters accordion: one panel open at a time. Buttons carry aria-expanded and aria-controls.
   Panels expand and collapse with a 0.4s height and fade (Web Animations API, so no extra library), measured from the
   real content height. Rapid clicks pick up from the current height. With prefers-reduced-motion they switch instantly. */
(function () {
  var root = document.querySelector("[data-accordion]");
  if (!root) return;
  var buttons = Array.prototype.slice.call(root.querySelectorAll(".accordion__button"));
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)");
  var DURATION = 400;                       // ms
  var EASE = "cubic-bezier(0.22, 1, 0.36, 1)"; // fast start, soft landing

  function settle() {
    // The page got taller or shorter: let scroll-driven pieces (reveals, footer) recalculate.
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }

  function animate(panel, open) {
    var running = panel.__anim;
    var current = running ? panel.getBoundingClientRect().height : (panel.hidden ? 0 : panel.offsetHeight);
    if (running) running.cancel();
    panel.__anim = null;

    if (calm.matches || !panel.animate) {
      panel.hidden = !open;
      return;
    }

    if (open) panel.hidden = false;
    var cs = window.getComputedStyle(panel);
    var padTop = cs.paddingTop, padBottom = cs.paddingBottom;
    var full = panel.offsetHeight; // natural height, with padding
    var closed = { height: "0px", paddingTop: "0px", paddingBottom: "0px", opacity: 0, overflow: "hidden" };
    var shown = { height: full + "px", paddingTop: padTop, paddingBottom: padBottom, opacity: 1, overflow: "hidden" };
    var startPartial = { height: current + "px", paddingTop: padTop, paddingBottom: padBottom, opacity: Math.min(1, current / (full || 1)), overflow: "hidden" };
    var frames = open ? [current > 0 ? startPartial : closed, shown] : [current > 0 && current < full ? startPartial : shown, closed];

    var anim = panel.animate(frames, { duration: DURATION, easing: EASE });
    panel.__anim = anim;
    anim.onfinish = function () {
      panel.__anim = null;
      if (!open) panel.hidden = true;
      settle();
    };
    anim.oncancel = function () { /* replaced by a newer animation */ };
  }

  function set(btn, open) {
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    if (panel) animate(panel, open);
  }

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var willOpen = btn.getAttribute("aria-expanded") !== "true";
      buttons.forEach(function (b) {
        var isOpen = b.getAttribute("aria-expanded") === "true";
        var shouldOpen = willOpen && b === btn;
        if (isOpen !== shouldOpen) set(b, shouldOpen);
      });
    });
  });
})();
