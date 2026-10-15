/* Legal pages: marks the contents link for the section in view with aria-current (underlined by CSS).
   Plain script (no modules). Without JS the list simply works as anchor links. */
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll(".toc__link"));
  if (!links.length || !("requestAnimationFrame" in window)) return;
  var targets = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
  // Design px to screen px: 1rem grows from 16px at 1440 to 21.33px at 1920 (tokens.css).
  function rem(px) { return px * parseFloat(getComputedStyle(document.documentElement).fontSize) / 16; }
  var ticking = false;

  function update() {
    ticking = false;
    var current = -1;
    targets.forEach(function (t, i) {
      if (t && t.getBoundingClientRect().top <= rem(160)) current = i; // clears the floating bar and the section title
    });
    var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (atBottom) current = links.length - 1;
    links.forEach(function (a, i) {
      if (i === current) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
