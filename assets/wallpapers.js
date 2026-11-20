/* Wallpapers Hub — dedicated search + View lightbox (2026-11-20).
   Runs only on pages carrying [data-wp-search] (hub pages + Free Resources index).
   Search matches wallpaper titles, keywords, board and section names, and (on the
   Free Resources index) the free-resource items from #page-data. Lightbox shows
   the full-resolution image for View; Download is a direct file link (tracked
   by the site's data-free-download handler). */
(function () {
  var form = document.querySelector('[data-wp-search]');
  if (!form) return;
  var input = form.querySelector('input[type="search"]');
  var resultsBox = document.getElementById('wpResults');
  var listing = document.getElementById('wpListing') || document.getElementById('listingGrid');
  var root = (window.JB && window.JB.root) || '';
  var W = window.WALLPAPERS || { boards: [], sections: [], wallpapers: [] };

  function norm(s) { return (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function haystack(parts) { return norm(parts.filter(Boolean).join(' ')); }
  function matches(hay, words) { return words.every(function (w) { return hay.indexOf(w) !== -1; }); }

  var resources = [];
  try {
    var pd = document.getElementById('page-data');
    if (pd) { var p = JSON.parse(pd.textContent); resources = p.items || []; }
  } catch (e) { resources = []; }

  var timer = null;
  function runSearch() {
    var q = norm(input.value);
    if (!q) { resultsBox.hidden = true; resultsBox.innerHTML = ''; if (listing) listing.hidden = false; return; }
    var words = q.split(' ');
    var wps = W.wallpapers.filter(function (w) {
      return matches(haystack([w.title, w.boardName, w.sectionName, (w.keywords || []).join(' ')]), words);
    }).slice(0, 12);
    var secs = W.sections.filter(function (s) {
      return matches(haystack([s.name, s.boardName, (s.keywords || []).join(' ')]), words);
    }).slice(0, 8);
    var brds = W.boards.filter(function (b) {
      return matches(haystack([b.name, (b.keywords || []).join(' ')]), words);
    }).slice(0, 8);
    var res = resources.filter(function (r) {
      return matches(haystack([r.title, r.desc, r.categoryName, (r.tags || []).join(' ')]), words);
    }).slice(0, 8);
    var html = '<h2>Results for &ldquo;' + esc(input.value.trim()) + '&rdquo;</h2>';
    if (!wps.length && !secs.length && !brds.length && !res.length) {
      html += '<p class="wp-noresults">Nothing matches that yet — try a board or category name like Architecture, Anime, Space, Neon or Doctor.</p>';
    }
    if (wps.length) {
      html += '<div class="wp-grid wp-grid-wallpapers">' + wps.map(function (w) {
        var thumb = w.file ? root + w.file : root + 'assets/wallpapers/wallpaper-placeholder.svg';
        var meta = esc(w.boardName) + (w.sectionName ? ' · ' + esc(w.sectionName) : '') + ' · 9:16 · JPG';
        var dl = w.file
          ? '<a class="btn btn-accent wp-download" href="' + root + w.file + '" download="' + w.slug + '.jpg" data-free-download="' + w.slug + '" data-location="wallpapers">Download</a>'
          : '<button class="btn btn-accent wp-download" type="button" disabled>Download</button>';
        var badge = w.file ? '' : ' <span class="wp-coming">Coming soon</span>';
        return '<article class="wp-item" data-wallpaper="' + w.slug + '">'
          + '<div class="wp-thumb"><img src="' + thumb + '" alt="' + esc(w.title) + ' — free 9:16 phone wallpaper" width="1080" height="1920" loading="lazy"></div>'
          + '<div class="wp-body"><h3>' + esc(w.title) + badge + '</h3><p class="wp-meta">' + meta + '</p></div>'
          + '<div class="wp-actions"><button class="btn btn-ghost wp-view" type="button" data-view="' + w.slug + '" data-full="' + (w.file ? root + w.file : root + 'assets/wallpapers/wallpaper-placeholder.svg') + '" data-title="' + esc(w.title) + '" data-available="' + (w.file ? '1' : '0') + '">View</button>' + dl + '</div></article>';
      }).join('') + '</div>';
    }
    if (secs.length) {
      html += '<h2 class="wp-section-title">Sub-categories</h2><div class="wp-grid">' + secs.map(function (s) {
        return '<article class="wp-card"><a class="card-link" href="' + root + s.url + '" aria-label="' + esc(s.name) + ' — 2 wallpapers"></a>'
          + '<div class="wp-cover"><img src="' + root + 'assets/wallpapers/cover-placeholder.svg" alt="' + esc(s.name) + ' wallpapers cover" width="1024" height="1024" loading="lazy"></div>'
          + '<div class="wp-body"><h3>' + esc(s.name) + '</h3><p class="wp-count">2 wallpapers · ' + esc(s.boardName) + '</p></div></article>';
      }).join('') + '</div>';
    }
    if (brds.length) {
      html += '<h2 class="wp-section-title">Categories</h2><div class="wp-grid">' + brds.map(function (b) {
        return '<article class="wp-card"><a class="card-link" href="' + root + b.url + '" aria-label="' + esc(b.name) + ' — ' + b.count + ' wallpapers"></a>'
          + '<div class="wp-cover"><img src="' + root + 'assets/wallpapers/cover-placeholder.svg" alt="' + esc(b.name) + ' wallpapers cover" width="1024" height="1024" loading="lazy"></div>'
          + '<div class="wp-body"><h3>' + esc(b.name) + '</h3><p class="wp-count">' + b.count + ' wallpapers</p></div></article>';
      }).join('') + '</div>';
    }
    if (res.length) {
      html += '<h2 class="wp-section-title">Free resources</h2><div class="res-grid">' + res.map(function (r) {
        return '<article class="res-item" data-cat="' + esc(r.filterKey || r.category) + '">'
          + '<a class="card-link" href="' + root + r.url + '" aria-label="' + esc(r.title) + ' — View &amp; download"></a>'
          + '<div class="rthumb"><img src="' + esc(r.thumb) + '" alt="' + esc(r.title) + ' preview" loading="lazy"></div>'
          + '<div class="rbody"><span class="tag">' + esc(r.tag) + '</span><h3>' + esc(r.title) + '</h3><span class="go">View &amp; download →</span></div></article>';
      }).join('') + '</div>';
    }
    resultsBox.innerHTML = html;
    resultsBox.hidden = false;
    if (listing) listing.hidden = true;
  }
  input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(runSearch, 150); });
  form.addEventListener('submit', function (e) { e.preventDefault(); clearTimeout(timer); runSearch(); });

  /* ---- View lightbox ---- */
  var overlay = null, current = [], currentIdx = 0;
  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'wp-lightbox';
    overlay.hidden = true;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = '<button class="wp-lb-close" type="button" aria-label="Close preview">✕</button>'
      + '<button class="wp-lb-nav wp-lb-prev" type="button" aria-label="Previous wallpaper">‹</button>'
      + '<button class="wp-lb-nav wp-lb-next" type="button" aria-label="Next wallpaper">›</button>'
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
    acts.innerHTML = item.available
      ? '<a class="btn btn-accent" href="' + item.full + '" download="' + item.slug + '.jpg" data-free-download="' + item.slug + '" data-location="wallpapers">Download</a>'
      : '<button class="btn btn-accent" type="button" disabled>Download</button>';
    overlay.querySelector('.wp-lb-note').textContent = item.available
      ? 'Full resolution · 9:16 · JPG — free download, no sign-up.'
      : 'This wallpaper is being generated — check back soon.';
    var nav = current.length > 1;
    overlay.querySelector('.wp-lb-prev').style.display = nav ? '' : 'none';
    overlay.querySelector('.wp-lb-next').style.display = nav ? '' : 'none';
  }
  function step(d) { if (current.length) show((currentIdx + d + current.length) % current.length); }
  function openLightbox(btn) {
    if (!overlay) buildOverlay();
    var card = btn.closest('[data-wallpaper]');
    var scope = card ? card.parentElement : document;
    current = Array.prototype.slice.call(scope.querySelectorAll('[data-view]')).map(function (b) {
      return { slug: b.getAttribute('data-view'), full: b.getAttribute('data-full'),
               title: b.getAttribute('data-title'), available: b.getAttribute('data-available') === '1' };
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
    var v = e.target.closest ? e.target.closest('[data-view]') : null;
    if (v) { e.preventDefault(); openLightbox(v); }
  });
})();
