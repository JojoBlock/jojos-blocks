/* JoJo’s Blocks — interactions. Vanilla JS, no dependencies. */
(function () {
  "use strict";
  var grid = document.getElementById("product-grid");
  var modal = document.getElementById("product-modal");
  var modalBody = document.getElementById("modal-body");
  var toast = document.getElementById("toast");
  var toastTimer = null;

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

  function buyButton(url, label, cls) {
    if (url) {
      return '<a class="btn ' + cls + '" href="' + url + '" target="_blank" rel="noopener sponsored">' + label + '</a>';
    }
    return '<button type="button" class="btn ' + cls + ' btn-disabled" data-missing="' + label + '">' + label + ' — link coming soon</button>';
  }

  function cardHTML(p) {
    return '' +
    '<article class="card reveal" data-id="' + p.id + '">' +
      '<div class="card-cover"><img src="' + p.cover + '" alt="' + p.coverAlt + '" loading="lazy" width="600" height="760">' +
      '<span class="card-badge">' + p.slot + '</span></div>' +
      '<div class="card-body">' +
        '<h3>' + p.title + '</h3>' +
        '<p class="card-theme">' + p.theme + '</p>' +
        '<p>' + p.description + '</p>' +
        '<p class="card-meta">' + metaLine(p) + '</p>' +
        '<ul class="card-features">' + p.features.map(function (f) { return "<li>" + f + "</li>"; }).join("") + '</ul>' +
        '<div class="card-actions">' +
          '<button type="button" class="btn btn-outline" data-details="' + p.id + '">View Details</button>' +
          buyButton(p.pdfUrl, "Get the PDF", "btn-primary") +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function renderProducts() {
    if (!grid) return;
    grid.innerHTML = PRODUCTS.map(cardHTML).join("");
    document.getElementById("book-count").textContent = "New coloring books added regularly";
  }

  function openModal(p) {
    modalBody.innerHTML =
      '<div class="modal-cover"><img src="' + p.cover + '" alt="' + p.coverAlt + '"></div>' +
      '<div class="modal-info"><span class="eyebrow">' + p.slot + ' · ' + p.theme + '</span>' +
      '<h3>' + p.title + '</h3>' +
      '<p class="card-meta">' + metaLine(p) + '</p>' +
      '<p>' + p.description + '</p>' +
      '<h4>What&rsquo;s inside</h4>' +
      '<ul class="card-features">' + p.features.map(function (f) { return "<li>" + f + "</li>"; }).join("") + '</ul>' +
      '<div class="card-actions">' + buyButton(p.pdfUrl, "Get the PDF", "btn-primary") + '</div>' +
      '<p class="modal-note">This is a digital PDF coloring book. No payment is taken on this site, and no purchase link has been added yet — add one in js/products.js when you are ready to sell it.</p></div>';
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var closeBtn = modal.querySelector(".modal-close");
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  document.addEventListener("click", function (e) {
    var details = e.target.closest("[data-details]");
    if (details) {
      var p = PRODUCTS.find(function (x) { return x.id === details.getAttribute("data-details"); });
      if (p) openModal(p);
      return;
    }
    var missing = e.target.closest("[data-missing]");
    if (missing) {
      showToast(missing.getAttribute("data-missing") + ": the purchase link has not been added yet. Add it in js/products.js — see README.md.");
      return;
    }
    if (e.target === modal || e.target.closest(".modal-close")) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
  });

  /* Mobile menu */
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
  }

  /* Header shadow on scroll */
  var header = document.getElementById("site-header");
  window.addEventListener("scroll", function () {
    if (header) header.classList.toggle("scrolled", window.scrollY > 8);
  }, { passive: true });

  /* FAQ accordion — one open at a time, keyboard friendly (native <button>) */
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

  /* Reveal on scroll */
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

  /* Newsletter — front-end only, honestly labelled */
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
      if (SITE_CONFIG.newsletterConnected) {
        note.textContent = "Thank you! You are subscribed.";
      } else {
        note.textContent = "Thank you — your email was noted in this browser only. The newsletter is not connected to an email service yet, so no email was sent or stored on a server. Connect a service (see README.md) to make this live.";
      }
      form.reset();
    });
  }

  /* Footer year + contact placeholder */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  var contactEl = document.getElementById("contact-email");
  if (contactEl) {
    contactEl.textContent = SITE_CONFIG.contactEmail || "Email address to be added";
  }

  renderProducts();
})();
