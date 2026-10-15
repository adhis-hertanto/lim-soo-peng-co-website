/* Mobile menu: toggle, aria-expanded, focus trap, Esc to close. Active below 768px only. */
(function () {
  var nav = document.getElementById("nav");
  var toggle = nav && nav.querySelector(".nav__toggle");
  if (!toggle) return;
  var mq = window.matchMedia("(max-width: 767px)");
  var focusable = "a[href], button:not([disabled])";

  function isOpen() { return nav.classList.contains("is-open"); }

  function visibleFocusables() {
    return Array.prototype.filter.call(nav.querySelectorAll(focusable), function (el) {
      return el.offsetParent !== null || el === toggle;
    });
  }

  function setOpen(open, returnFocus) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", toggle.getAttribute(open ? "data-label-close" : "data-label-open"));
    if (!open && returnFocus) toggle.focus();
  }

  toggle.addEventListener("click", function () { setOpen(!isOpen(), false); });

  nav.addEventListener("click", function (e) {
    if (isOpen() && e.target.closest && e.target.closest(".nav__links a")) setOpen(false, false);
  });

  document.addEventListener("keydown", function (e) {
    if (!isOpen() || !mq.matches) return;
    if (e.key === "Escape") { setOpen(false, true); return; }
    if (e.key !== "Tab") return;
    var items = visibleFocusables();
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (!nav.contains(document.activeElement)) { first.focus(); e.preventDefault(); }
    else if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  });

  mq.addEventListener("change", function (e) { if (!e.matches && isOpen()) setOpen(false, false); });
})();
