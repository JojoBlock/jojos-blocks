/* Colouring Pages — View lightbox with dual-format downloads (2026-11-21).
   Runs on colouring pages and the Free Resources index. Binds ONLY .cl-view
   buttons (wallpapers.js owns .wp-view), so both lightboxes coexist on the
   index without double-opening. The modal shows the full-resolution PNG and
   offers Download PDF + Download PNG side by side (PDF only for the two
   pre-existing pages, which have no PNG). Prev/next steps within the page's
   own card set. Reuses the .wp-lightbox styles. */
(function () {
  var overlay = null, current = [], currentIdx = 0;

  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'wp-lightbox';
    overlay.hidden = true;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = '<button class="wp-lb-close" type="button" aria-label="Close preview">✕</button>'
      + '<button class="wp-lb-nav wp-lb-prev" type="button" aria-label="Previous colouring page">‹</button>'
      + '<button class="wp-lb-nav wp-lb-next" type="button" aria-label="Next colouring page">›</button>'
      + '<figure class="wp-lb-fig"><img alt=""><figcaption class="wp-lb-cap"><h3></h3><span class="wp-lb-actions"></span></figcaption><p class="wp-lb-note"></p></figure>';
    document.body.appendChild(overlay);
    overlay.querySelector('.wp-lb-close').addEventListener('click', closeLightbox);
    overlay.querySelector('.wp-lb-prev').addEventListener('click', function () { step(-1); });
    overlay.querySelector('.wp-lb-next').addEventListener('click', function () { step(1); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeLightbox(); });
    document.addEventListener('keydown', function (e) {
      if (overlay.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }

  function show(i) {
    var item = current[i];
    if (!item) return;
    currentIdx = i;
    var img = overlay.querySelector('img');
    img.src = item.full;
    img.alt = item.title + ' — full-resolution preview';
    overlay.querySelector('h3').textContent = item.title;
    var acts = overlay.querySelector('.wp-lb-actions');
    var pdf = '<a class="btn btn-accent" href="' + item.pdf + '" download="' + item.slug + '.pdf" data-free-download="' + item.slug + '-pdf" data-location="colouring">Download PDF</a>';
    var png = item.png
      ? '<a class="btn btn-ghost" href="' + item.png + '" download="' + item.slug + '.png" data-free-download="' + item.slug + '-png" data-location="colouring">Download PNG</a>'
      : '';
    acts.innerHTML = pdf + png;
    overlay.querySelector('.wp-lb-note').textContent = item.png
      ? 'Print-ready PDF · 8.5 × 11 in · High-res PNG — free download, no sign-up.'
      : 'Print-ready PDF · 8.5 × 11 in — free download, no sign-up.';
    var nav = current.length > 1;
    overlay.querySelector('.wp-lb-prev').style.display = nav ? '' : 'none';
    overlay.querySelector('.wp-lb-next').style.display = nav ? '' : 'none';
  }

  function step(d) { if (current.length) show((currentIdx + d + current.length) % current.length); }

  function openLightbox(btn) {
    if (!overlay) buildOverlay();
    var card = btn.closest('[data-colouring]');
    var scope = card ? card.parentElement : document;
    current = Array.prototype.slice.call(scope.querySelectorAll('.cl-view')).map(function (b) {
      return { slug: b.getAttribute('data-view'), full: b.getAttribute('data-full'),
               title: b.getAttribute('data-title'), pdf: b.getAttribute('data-pdf') || '',
               png: b.getAttribute('data-png') || '' };
    });
    var idx = current.findIndex(function (it) { return it.slug === btn.getAttribute('data-view'); });
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    show(idx < 0 ? 0 : idx);
  }

  function closeLightbox() {
    if (!overlay) return;
    overlay.hidden = true;
    document.body.style.overflow = '';
  }

  document.addEventListener('click', function (e) {
    var v = e.target.closest ? e.target.closest('.cl-view') : null;
    if (v) { e.preventDefault(); openLightbox(v); }
  });
})();
