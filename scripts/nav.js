/* Nav: marks the link for the section in view with aria-current (underlined by CSS).
   Links scroll to sections via native anchors; scroll-margin-top in CSS keeps them below the bar. */
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav__link[href^='#']"));
  var sections = links.map(function (a) {
    // #about is the heading inside the pinned About stage; track its section instead.
    var target = document.getElementById(a.getAttribute("href").slice(1));
    return target && target.closest ? target.closest("section") || target : target;
  });
  if (!("requestAnimationFrame" in window)) return;
  // Design px to screen px: 1rem grows from 16px at 1440 to 21.33px at 1920 (tokens.css).
  function rem(px) { return px * parseFloat(getComputedStyle(document.documentElement).fontSize) / 16; }
  var ticking = false;
  var header = document.querySelector(".site-header");
  var bar = document.getElementById("nav");
  // Sections marked data-nav="light" have a light ground, so the bar switches to dark text under them.
  var tones = Array.prototype.slice.call(document.querySelectorAll("main > section, footer"));

  function tone() {
    if (!header || !bar) return;
    var r = bar.getBoundingClientRect();
    var y = r.top + r.height / 2;
    var light = false;
    var mainEl = document.querySelector(".page__main");
    var covered = mainEl ? mainEl.getBoundingClientRect().bottom > y : false; // footer still hidden under the page
    tones.forEach(function (s) {
      if (s.tagName === "FOOTER" && covered) return;
      var b = s.getBoundingClientRect();
      if (b.top <= y && b.bottom > y) light = s.getAttribute("data-nav") === "light";
    });
    header.classList.toggle("is-on-light", light);
  }

  // Hide on scroll down, show on scroll up. Ignores tiny movements; never hides near the top or with the menu open.
  var lastY = window.scrollY;
  function direction() {
    if (!header || !bar) return;
    var y = window.scrollY;
    var delta = y - lastY;
    if (Math.abs(delta) < 4) return;
    var keyboardFocus = !!header.querySelector(":focus-visible"); // a mouse click leaves focus on the link, so this ignores it
    header.classList.toggle("is-hidden", delta > 0 && y > 120 && !bar.classList.contains("is-open") && !keyboardFocus);
    lastY = y;
  }

  // Tabbing into a hidden nav brings it back.
  if (header) header.addEventListener("focusin", function (e) {
    if (e.target.matches && e.target.matches(":focus-visible")) header.classList.remove("is-hidden");
  });

  function update() {
    ticking = false;
    tone();
    direction();
    var current = -1;
    sections.forEach(function (s, i) {
      if (s && s.getBoundingClientRect().top <= rem(120)) current = i; // clears the floating bar
    });
    var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (atBottom) current = sections.length - 1;
    links.forEach(function (a, i) {
      if (i === current) a.setAttribute("aria-current", "true");
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
