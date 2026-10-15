/* About: the statement reveals line by line and the three cards rise over it.
   Every breakpoint with motion allowed, when the viewport is tall enough for the cards: the stage pins for
   about two viewport heights. Lines go from 15% to 100% opacity, then after a short hold the cards rise from
   below and come to rest centred in the viewport (on tablet and desktop in a row, on mobile in one column;
   middle, left, right, 120px of scroll apart) while the text blurs to 6px and drops to 40% opacity.
   Everything is scrubbed to scroll. A viewport too short for the cards: lines fade in as they enter and the
   cards fade up.
   Reduced motion or no JS: stacked and fully visible.
   Lines are split from the rendered layout into an aria-hidden copy; the original stays for assistive tech. */
(function () {
  var track = document.querySelector("[data-about]");
  if (!track) return;
  var section = track.closest(".about");
  var stage = track.querySelector(".about__stage");
  var statement = track.querySelector(".statement");
  var source = track.querySelector(".statement__source");
  var list = track.querySelector(".cards");
  var cards = Array.prototype.slice.call(track.querySelectorAll(".card"));
  var rising = []; // rise order, set in sync(): wide screens Direction, Clarity, Peace of mind; mobile Clarity, Direction, Peace of mind
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)");
  var STAGGER = 120;   // px of scroll between cards
  var LOW = 0.15;      // starting line opacity
  var BLUR = 6;        // px
  var DIM = 0.4;       // text opacity under the cards
  var mode = "";       // "", "pin" or "fade"
  var copy = null, words = [], lines = [], seen = null, ticking = false;

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  // Build an aria-hidden copy of the statement with one span per word, keeping the gold full stop.
  function split() {
    copy = document.createElement("span");
    copy.className = "statement__copy";
    copy.setAttribute("aria-hidden", "true");
    (function walk(from, to) {
      Array.prototype.forEach.call(from.childNodes, function (node) {
        if (node.nodeType === 3) {
          node.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { to.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement("span");
            w.className = "statement__word";
            w.textContent = part;
            to.appendChild(w);
            words.push(w);
          });
        } else if (node.nodeType === 1) {
          var el = document.createElement("span");
          if (node.classList.contains("gold-stop")) el.className = "gold-stop";
          to.appendChild(el);
          walk(node, el);
        }
      });
    })(source, copy);
    statement.appendChild(copy);
    source.classList.add("vh");
  }

  function unsplit() {
    if (copy) copy.remove();
    copy = null; words = []; lines = [];
    source.classList.remove("vh");
  }

  // Group words into rendered lines by their vertical offset.
  function measure() {
    lines = [];
    var top = null, line;
    words.forEach(function (w) {
      var t = w.offsetTop;
      if (top === null || Math.abs(t - top) > 2) { line = []; lines.push(line); top = t; }
      line.push(w);
    });
  }

  function setLine(line, o) {
    var v = String(LOW + (1 - LOW) * o);
    line.forEach(function (w) { w.style.setProperty("--o", v); });
  }

  function update() {
    ticking = false;
    var vh = window.innerHeight;
    if (mode === "pin") {
      var y = Math.max(0, -track.getBoundingClientRect().top);
      var pin = Math.max(1, track.offsetHeight - stage.offsetHeight);
      // Reveal over the first 40% of the pin, hold to 50%, then the cards rise over the second half.
      var reveal = clamp(y / (pin * 0.4)) * lines.length;
      lines.forEach(function (line, i) { setLine(line, clamp(reveal - i)); });
      var span = Math.max(1, pin * 0.5 - STAGGER * (rising.length - 1));
      var sum = 0;
      rising.forEach(function (card, k) {
        var p = clamp((y - pin * 0.5 - STAGGER * k) / span);
        var eased = 1 - Math.pow(1 - p, 3);
        card.style.setProperty("--rise", ((1 - eased) * vh).toFixed(1) + "px");
        sum += p;
      });
      var over = sum / rising.length;
      statement.style.setProperty("--blur", (BLUR * over).toFixed(2) + "px");
      statement.style.setProperty("--dim", String(1 - (1 - DIM) * over));
    } else if (mode === "fade") {
      // Each line fades in across the lowest quarter of the viewport.
      lines.forEach(function (line) {
        var top = line[0].getBoundingClientRect().top;
        setLine(line, clamp((vh - top) / (vh * 0.25)));
      });
    }
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  function reset() {
    section.classList.remove("is-pinned", "is-fading");
    statement.style.removeProperty("--blur");
    statement.style.removeProperty("--dim");
    cards.forEach(function (c) { c.style.removeProperty("--rise"); c.classList.remove("is-in"); });
    if (seen) { seen.disconnect(); seen = null; }
  }

  // Design px to screen px: 1rem grows from 16px at 1440 to 21.33px at 1920 (tokens.css).
  function rem(px) { return px * parseFloat(getComputedStyle(document.documentElement).fontSize) / 16; }

  function sync() {
    reset();
    mode = "";
    rising = window.innerWidth < 768
      ? [cards[0], cards[1], cards[2]]
      : [cards[1], cards[0], cards[2]];
    if (calm.matches) { unsplit(); return; }
    if (!copy) split();
    section.classList.add("is-pinned");
    // Pin only if the viewport leaves room for the cards (the row on wide screens, the column on mobile)
    // with some space above and below them.
    // Mobile stacks the cards in one column below the 72px nav bar; wide screens use a row with space around it.
    var room = window.innerWidth < 768 ? 88 : rem(120);
    if (window.innerHeight >= list.offsetHeight + room) mode = "pin";
    else section.classList.remove("is-pinned");
    if (!mode) {
      mode = "fade";
      section.classList.add("is-fading");
      if ("IntersectionObserver" in window) {
        seen = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { e.target.classList.add("is-in"); seen.unobserve(e.target); }
          });
        }, { rootMargin: "0px 0px -10% 0px" });
        cards.forEach(function (c) { seen.observe(c); });
      } else {
        cards.forEach(function (c) { c.classList.add("is-in"); });
      }
    }
    measure();
    update();
  }

  // While pinned, the heading sits in a sticky stage, so a jump to #about lands on the start of the sequence.
  document.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest('a[href="#about"]');
    if (!link || mode !== "pin") return;
    e.preventDefault();
    window.scrollTo(0, track.getBoundingClientRect().top + window.scrollY);
    if (history.pushState) history.pushState(null, "", "#about");
  });

  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(sync, 150);
  });
  window.addEventListener("scroll", onScroll, { passive: true });
  calm.addEventListener("change", sync);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sync);
  sync();
})();
