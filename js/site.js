/* JoJo's Blocks — shared site chrome (js/site.js).
 *
 * Loaded by EVERY page (homepage, book pages, Privacy, Terms, 404,
 * Refund Policy). It owns only the parts that are identical on all
 * pages: the mobile menu, the Explore dropdown, the header shadow,
 * the footer year, and Buy Now click tracking.
 *
 * Page-specific behavior lives elsewhere: homepage cards, the product
 * modal, the FAQ accordion and the newsletter form are in js/main.js
 * (homepage only). Keeping the chrome here means the header and
 * footer behave the same everywhere, and a fix is made once.
 */
(function () {
  /* Mobile menu: the hamburger toggles the nav panel. Any link inside
     the panel closes it again, so tapping a destination never leaves
     the menu covering the page. Escape closes it too. */
  var navToggle = document.getElementById("nav-toggle");
  var navMenu = document.getElementById("nav-menu");
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      var open = navMenu.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.textContent = open ? "✕" : "☰";
    });
    navMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        navMenu.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.textContent = "☰";
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navMenu.classList.contains("open")) {
        navMenu.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.textContent = "☰";
        navToggle.focus();
      }
    });
  }

  /* Explore dropdown: click (or Enter/Space on the button) toggles it.
     Hover and keyboard focus also open it on desktop, via CSS
     (:hover / :focus-within). Escape closes it and returns focus to
     the button; a click anywhere outside closes it. "Soon" items are
     plain text, not links, so they cannot be activated by mistake.
     NOTE: the menu can be visible through CSS :hover / :focus-within
     without the .open class, so Escape must check all three states.
     Closing adds .dismissed, which suppresses the CSS hover/focus
     rules until the pointer or focus moves away — otherwise refocusing
     the button would reopen the menu through :focus-within. */
  var dropdownToggle = document.getElementById("explore-toggle");
  var dropdown = document.getElementById("explore-menu");
  var dropdownItem = dropdownToggle ? dropdownToggle.closest(".has-dropdown") : null;
  function closeDropdown(refocus) {
    if (!dropdownItem) return;
    dropdownItem.classList.remove("open");
    dropdownItem.classList.add("dismissed");
    if (dropdownToggle) dropdownToggle.setAttribute("aria-expanded", "false");
    if (refocus && dropdownToggle) dropdownToggle.focus();
  }
  function clearDismissed() {
    if (dropdownItem) dropdownItem.classList.remove("dismissed");
  }
  if (dropdownToggle && dropdownItem) {
    dropdownToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      clearDismissed();
      var open = dropdownItem.classList.toggle("open");
      dropdownToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    dropdownToggle.addEventListener("blur", clearDismissed);
    dropdownItem.addEventListener("mouseenter", clearDismissed);
    dropdownItem.addEventListener("mouseleave", clearDismissed);
    document.addEventListener("click", function (e) {
      if (!dropdownItem.contains(e.target)) closeDropdown(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var visible = dropdownItem.classList.contains("open") ||
        dropdownItem.matches(":hover") || dropdownItem.matches(":focus-within");
      if (visible) closeDropdown(true);
    });
  }

  /* Header shadow on scroll: a soft shadow appears once the page has
     moved, so the sticky header stays visibly separate from content. */
  var header = document.getElementById("site-header");
  if (header) {
    window.addEventListener("scroll", function () {
      header.classList.toggle("scrolled", window.scrollY > 8);
    }, { passive: true });
  }

  /* Footer year. */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Buy Now click tracking (Google Analytics 4). One handler for the
     whole site: any link carrying data-book reports which book and
     where the click happened. The purchase itself happens on Gumroad
     and is not tracked here. */
  document.addEventListener("click", function (e) {
    var buy = e.target.closest ? e.target.closest("a[data-book]") : null;
    if (buy && typeof window.gtag === "function") {
      window.gtag("event", "buy_now_click", {
        book_slug: buy.getAttribute("data-book"),
        location: buy.getAttribute("data-location") || "page"
      });
    }
  });
})();
