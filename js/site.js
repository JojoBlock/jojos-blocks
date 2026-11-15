/* JoJo's Blocks — shared site chrome (js/site.js).
 *
 * Loaded by EVERY page (homepage, book pages, Privacy, Terms, 404,
 * Refund Policy, section landing pages, blog listing and articles).
 * It owns only the parts that are identical on all pages: the mobile
 * menu, the Explore dropdown, the header shadow, the footer year,
 * Buy Now click tracking, free-download tracking, affiliate outbound
 * click tracking, category filter chips, search boxes and game-start
 * tracking (Part 3).
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

  /* Free sample download tracking (Google Analytics 4). One handler for
     the whole site: any link carrying data-free-download reports which
     free resource was downloaded and where the click happened. The
     download itself is a plain same-site file link, so it works even
     when analytics is blocked. Mark free_sample_download as a key event
     in the GA4 console to count downloads (the owner does this in the
     console; no code change is needed here). */
  document.addEventListener("click", function (e) {
    var dl = e.target.closest ? e.target.closest("a[data-free-download]") : null;
    if (dl && typeof window.gtag === "function") {
      window.gtag("event", "free_sample_download", {
        resource_slug: dl.getAttribute("data-free-download"),
        location: dl.getAttribute("data-location") || "page"
      });
    }
  });

  /* Part 3 — affiliate outbound click tracking (Google Analytics 4).
     Any link carrying data-affiliate reports which recommendation was
     clicked and where. There are NO affiliate links on the site right
     now (the physical + digital-tools sections are Coming Soon), so
     this handler fires only once a real recommendation is published. */
  document.addEventListener("click", function (e) {
    var aff = e.target.closest ? e.target.closest("a[data-affiliate]") : null;
    if (aff && typeof window.gtag === "function") {
      window.gtag("event", "affiliate_outbound_click", {
        item: aff.getAttribute("data-affiliate"),
        location: aff.getAttribute("data-location") || "page"
      });
    }
  });

  /* Part 3 — category filter chips (blog listing). Clicking a chip
     shows only cards whose data-category matches, hides the rest, and
     updates the pressed state. Fires one GA4 filter_use event per
     click (no duplicate firing — a single delegated handler). */
  var filterBar = document.querySelector(".filter-bar");
  if (filterBar) {
    filterBar.addEventListener("click", function (e) {
      var chip = e.target.closest ? e.target.closest(".chip[data-filter]") : null;
      if (!chip) return;
      var value = chip.getAttribute("data-filter");
      filterBar.querySelectorAll(".chip[data-filter]").forEach(function (c) {
        var active = c === chip;
        c.classList.toggle("is-active", active);
        c.setAttribute("aria-pressed", active ? "true" : "false");
      });
      var visible = 0;
      document.querySelectorAll(".filter-item[data-category]").forEach(function (item) {
        var show = value === "all" || item.getAttribute("data-category") === value;
        item.hidden = !show;
        if (show) visible++;
      });
      var empty = document.querySelector(".filter-empty");
      if (empty) empty.hidden = visible > 0;
      if (typeof window.gtag === "function") {
        window.gtag("event", "filter_use", { filter_value: value, page: window.location.pathname });
      }
    });
  }

  /* Part 3 — search boxes (section landing pages). Filters the
     .filter-item cards on the page by their visible text as the user
     types. Fires one GA4 search_use event per search session (the
     first keystroke), reporting only that a search happened — never
     the query text — so no personal data leaves the page. */
  var searchBox = document.querySelector(".search-box");
  if (searchBox) {
    var searched = false;
    searchBox.addEventListener("input", function () {
      var q = searchBox.value.trim().toLowerCase();
      var visible = 0;
      document.querySelectorAll(".filter-item").forEach(function (item) {
        var show = !q || item.textContent.toLowerCase().indexOf(q) !== -1;
        item.hidden = !show;
        if (show) visible++;
      });
      var empty = document.querySelector(".filter-empty");
      if (empty) empty.hidden = visible > 0;
      if (q && !searched && typeof window.gtag === "function") {
        searched = true;
        window.gtag("event", "search_use", { page: window.location.pathname });
      }
      if (!q) searched = false;
    });
  }

  /* Part 3 — game start (ready for future games). Any button carrying
     data-game-start reports which game was started. There are no
     playable games on the site right now (the Games section is Coming
     Soon), so this handler fires only once a real game is published. */
  document.addEventListener("click", function (e) {
    var game = e.target.closest ? e.target.closest("[data-game-start]") : null;
    if (game && typeof window.gtag === "function") {
      window.gtag("event", "game_start", {
        game_slug: game.getAttribute("data-game-start"),
        location: game.getAttribute("data-location") || "page"
      });
    }
  });
})();
