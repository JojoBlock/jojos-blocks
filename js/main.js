/* JoJo’s Blocks — interactions. Vanilla JS, no dependencies. */
(function () {
  "use strict";
  /* Mark JS as available: without this class the FAQ answers stay
     visible (no-JS fallback) — see css/styles.css (.faq-a). */
  document.documentElement.classList.add("js");

  var grid = document.getElementById("product-grid");
  var modal = document.getElementById("product-modal");
  var modalBody = document.getElementById("modal-body");
  var toast = document.getElementById("toast");
  var toastTimer = null;
  var lastFocused = null;

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 4200);
  }

  function metaLine(p) {
    var bits = [];
    if (p.age) bits.push("Ages " + p.age.replace(/^Ages\s*/i, ""));
    if (p.pages) bits.push(p.pages + " pages");
    bits.push(p.format);
    return bits.join(" · ");
  }

  function buyButton(url, label, cls, bookSlug, location) {
    if (url) {
      var attrs = (bookSlug ? ' data-book="' + bookSlug + '" data-location="' + (location || "card") + '"' : "");
      return '<a class="btn ' + cls + '" href="' + url + '" target="_blank" rel="noopener"' + attrs + '>' + label + '</a>';
    }
    return '<button type="button" class="btn ' + cls + ' btn-disabled" data-missing="' + label + '">' + label + ' — buy link unavailable</button>';
  }

  /* GA4 event tracking — fires only when the GA4 tag has loaded.
     Buy-button clicks are the measurable conversion: the purchase
     itself happens on Gumroad and cannot be tracked from this site. */
  function trackEvent(name, params) {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, params || {});
    }
  }
  /* Buy-button clicks are tracked in js/site.js (shared by every page),
     not here — one handler for the whole site, so a click is never
     counted twice. */

  function priceHTML(p, cls) {
    if (!p.price) return "";
    var note = (p.salePrice && p.salePrice !== p.price)
      ? ' <span class="price-note">10% off with JOJOS10 · you pay ' + p.salePrice + '</span>'
      : "";
    return '<p class="' + cls + '">' + p.price + note + '</p>';
  }

  function cardHTML(p) {
    /* Books 3 and 4 sit further down the page: load their covers
       eagerly so they never show up as blank color blocks while
       lazy-loading catches up. Fixed width/height reserves the
       600x849 cover shape and prevents layout shift. */
    var loading = (p.id === "book-03" || p.id === "book-04") ? "eager" : "lazy";
    return '' +
    '<article class="card reveal" data-id="' + p.id + '">' +
      '<div class="card-cover"><img src="' + p.cover + '" alt="' + p.coverAlt + '" loading="' + loading + '" width="600" height="849">' +
      '<span class="card-badge">' + p.slot + '</span></div>' +
      '<div class="card-body">' +
        '<h3>' + p.title + '</h3>' +
        '<p class="card-theme">' + p.theme + '</p>' +
        '<p>' + p.description + '</p>' +
        '<p class="card-meta">' + metaLine(p) + '</p>' +
        priceHTML(p, "card-price") +
        '<ul class="card-features">' + p.features.map(function (f) { return "<li>" + f + "</li>"; }).join("") + '</ul>' +
        '<div class="card-actions">' +
          '<button type="button" class="btn btn-outline" data-details="' + p.id + '">View Details</button>' +
          buyButton(p.pdfUrl, "Buy Now on Gumroad", "btn-primary", p.slug, "card") +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function renderProducts() {
    if (!grid) return;
    grid.innerHTML = PRODUCTS.map(cardHTML).join("");
    document.getElementById("book-count").textContent = "New coloring books added regularly";
  }

  /* Per-product deep links: each book has its own shareable URL,
     https://jojosblocks.online/#book-<slug> — opening it scrolls to
     the collection and opens that book's details modal. Added
     10 Nov 2026 as the destination URL for Pinterest Pins. */
  function productFromHash() {
    var m = /^#book-([a-z0-9-]+)$/.exec(window.location.hash || "");
    if (!m) return null;
    return PRODUCTS.find(function (x) { return x.slug === m[1]; }) || null;
  }
  function openFromHash() {
    var p = productFromHash();
    if (p) {
      var books = document.getElementById("books");
      if (books) books.scrollIntoView();
      openModal(p);
    }
  }

  function openModal(p) {
    lastFocused = document.activeElement;
    modalBody.innerHTML =
      '<div class="modal-cover"><img src="' + p.cover + '" alt="' + p.coverAlt + '" width="600" height="849"></div>' +
      '<div class="modal-info"><span class="eyebrow">' + p.slot + ' · ' + p.theme + '</span>' +
      '<h3 id="modal-title">' + p.title + '</h3>' +
      '<p class="card-meta">' + metaLine(p) + '</p>' +
      priceHTML(p, "modal-price") +
      '<p>' + p.description + '</p>' +
      '<h4>What&rsquo;s inside</h4>' +
      '<ul class="card-features">' + p.features.map(function (f) { return "<li>" + f + "</li>"; }).join("") + '</ul>' +
      '<div class="card-actions">' + buyButton(p.pdfUrl, "Buy Now on Gumroad", "btn-primary", p.slug, "modal") + '</div>' +
      '<p class="modal-note"><a href="books/' + p.slug + '.html">Open the full product page for ' + p.title + '</a></p>' +
      '<p class="modal-note">License: ' + (p.license === "personal-family" ? "Personal &amp; family use" : "See Terms &amp; Conditions") + ' — see <a href="terms.html">Terms &amp; Conditions</a> for the full license.</p>' +
      '<p class="modal-note">' + (p.pdfUrl ? 'This is a digital PDF. Click Buy Now on Gumroad to buy securely — your download is ready right after purchase. This site takes no payment itself.' : 'This is a digital PDF coloring book. It is not available to buy right now.') + '</p></div>';
    trackEvent("view_details", { book_slug: p.slug });
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var closeBtn = modal.querySelector(".modal-close");
    if (closeBtn) closeBtn.focus();
    /* Deep link: the modal's URL is shareable (replaceState, so the
       back button is not polluted with a modal entry). */
    if (p.slug) history.replaceState(null, "", "#book-" + p.slug);
  }

  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    /* Leave the deep link behind: back to the collection anchor. */
    if (productFromHash()) history.replaceState(null, "", "#books");
    if (lastFocused && lastFocused.focus) lastFocused.focus();
    lastFocused = null;
  }

  /* Focus trap: while the modal is open, Tab cycles only through
     the controls inside it instead of wandering behind it. */
  modal.addEventListener("keydown", function (e) {
    if (e.key !== "Tab" || !modal.classList.contains("open")) return;
    var focusables = modal.querySelectorAll('button:not([disabled]), a[href]');
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  document.addEventListener("click", function (e) {
    var details = e.target.closest("[data-details]");
    if (details) {
      var p = PRODUCTS.find(function (x) { return x.id === details.getAttribute("data-details"); });
      if (p) openModal(p);
      return;
    }
    var missing = e.target.closest("[data-missing]");
    if (missing) {
      showToast(missing.getAttribute("data-missing") + ": this book is not available to buy right now.");
      return;
    }
    if (e.target === modal || e.target.closest(".modal-close")) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
  });

  /* Deep-link navigation: a #book-<slug> URL opens that book's
     modal; any other hash closes the modal (e.g. back to #books). */
  window.addEventListener("hashchange", function () {
    var p = productFromHash();
    if (p) { openModal(p); return; }
    if (modal.classList.contains("open")) closeModal();
  });

  /* Mobile menu, Explore dropdown, header shadow and footer year live
     in js/site.js (shared by every page) — not duplicated here. */

  /* FAQ accordion — one open at a time, keyboard friendly (native <button>).
     Buttons are wired in index.html with aria-controls + ids, so screen
     readers can follow each question to its answer. */
  document.querySelectorAll(".faq-q").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".faq-item");
      var isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(function (i) {
        i.classList.remove("open");
        i.querySelector(".faq-q").setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* Reveal on scroll — render the product cards FIRST, so they are
     included in the elements observed below. (Previously the cards
     were rendered after this setup, so they were never observed and
     stayed invisible.) */
  renderProducts();

  /* If the visitor arrived on a per-product link
     (https://jojosblocks.online/#book-<slug>), open that book's
     details modal straight away. */
  openFromHash();

  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* Newsletter — front-end only, honestly labeled */
  var form = document.getElementById("newsletter-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("newsletter-email").value.trim();
      var note = document.getElementById("newsletter-note");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        note.textContent = "Please enter a valid email address.";
        return;
      }
      if (SITE_CONFIG.newsletterConnected && SITE_CONFIG.newsletterEndpoint) {
        /* Live: save the email to the subscriber sheet via the
           Apps Script endpoint, then show a real success message.
           The button is disabled while subscribing so a double
           tap cannot save the same email twice. */
        var btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
        note.textContent = "Subscribing…";
        fetch(SITE_CONFIG.newsletterEndpoint, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ email: email })
        }).then(function (res) {
          if (btn) btn.disabled = false;
          if (res.type === "opaque" || res.ok) {
            note.textContent = "Thank you! You’re subscribed — welcome to the JoJo’s Blocks community.";
            trackEvent("newsletter_signup", {});
            form.reset();
          } else {
            note.textContent = "Sorry, something went wrong — please try again.";
          }
        }).catch(function () {
          if (btn) btn.disabled = false;
          note.textContent = "Sorry, something went wrong — please try again.";
        });
        return;
      }
      note.textContent = "Thank you — the newsletter isn’t connected yet, so your email wasn’t sent or stored.";
      form.reset();
    });
  }

  /* Footer year is set by js/site.js. The footer contact email is
     written directly in the footer partial — no JavaScript needed. */

})();
