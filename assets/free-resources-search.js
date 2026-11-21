/* Free Resources — unified instant search (2026-11-21).
   Replaces the wallpaper-only search in wallpapers.js wherever it loads: it
   sets window.FREE_SEARCH so wallpapers.js skips its own search binding (its
   lightbox still runs). Searches colouring pages + tiers (window.COLOURING),
   wallpapers + boards + sections (window.WALLPAPERS) and the free-resource
   items from #page-data — all from the one "What are you looking for today?"
   bar. Colouring result cards carry .cl-view (colouring.js lightbox) and
   dual PDF/PNG downloads; wallpaper result cards carry .wp-view
   (wallpapers.js lightbox). Load order on every search page: data files,
   this file, wallpapers.js, colouring.js, site.js. */
window.FREE_SEARCH = true;
(function () {
  var form = document.querySelector('[data-wp-search]');
  if (!form) return;
  var input = form.querySelector('input[type="search"]');
  var resultsBox = document.getElementById('wpResults');
  var listing = document.getElementById('wpListing') || document.getElementById('listingGrid');
  var root = (window.JB && window.JB.root) || '';
  var W = window.WALLPAPERS || { boards: [], sections: [], wallpapers: [] };
  var C = window.COLOURING || { tiers: [], pages: [] };

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
    var cls = C.pages.filter(function (pg) {
      return matches(haystack([pg.title, pg.tierName, pg.ages, pg.level, (pg.keywords || []).join(' ')]), words);
    }).slice(0, 12);
    var wps = W.wallpapers.filter(function (w) {
      return matches(haystack([w.title, w.boardName, w.sectionName, (w.keywords || []).join(' ')]), words);
    }).slice(0, 12);
    var tiers = C.tiers.filter(function (t) {
      return matches(haystack([t.name, t.ages, t.level, (t.keywords || []).join(' ')]), words);
    }).slice(0, 4);
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
    if (!cls.length && !wps.length && !tiers.length && !secs.length && !brds.length && !res.length) {
      html += '<p class="wp-noresults">Nothing matches that yet — try a colouring topic like lion or mandala, a wallpaper board like Animals or Space, or a category like Planners.</p>';
    }
    if (cls.length) {
      html += '<h2 class="wp-section-title">Colouring pages</h2><div class="wp-grid wp-grid-wallpapers">' + cls.map(function (pg) {
        var thumb = pg.png ? root + pg.png : (pg.preview ? root + pg.preview : root + 'assets/wallpapers/cover-placeholder.svg');
        var meta = esc(pg.tierName) + ' · ' + esc(pg.ages) + ' · ' + (pg.png ? 'PDF + PNG' : 'PDF');
        var dlPdf = pg.pdf ? '<a class="btn btn-accent" href="' + root + pg.pdf + '" download="' + pg.slug + '.pdf" data-free-download="' + pg.slug + '-pdf" data-location="colouring">Download PDF</a>' : '';
        var dlPng = pg.png ? '<a class="btn btn-ghost" href="' + root + pg.png + '" download="' + pg.slug + '.png" data-free-download="' + pg.slug + '-png" data-location="colouring">Download PNG</a>' : '';
        var full = pg.png ? root + pg.png : root + pg.pdf;
        return '<article class="wp-item cl-item" data-colouring="' + pg.tier + '-' + pg.slug + '">'
          + '<a class="card-link" href="' + root + pg.url + '" aria-label="' + esc(pg.title) + ' — View &amp; download"></a>'
          + '<div class="wp-thumb cl-thumb"><img src="' + thumb + '" alt="' + esc(pg.title) + ' — free printable colouring page" width="816" height="1056" loading="lazy"></div>'
          + '<div class="wp-body"><h3>' + esc(pg.title) + '</h3><p class="wp-meta">' + meta + '</p></div>'
          + '<div class="wp-actions cl-actions"><button class="btn btn-ghost cl-view" type="button" data-view="' + pg.tier + '-' + pg.slug + '" data-full="' + full + '" data-title="' + esc(pg.title) + '" data-available="1" data-pdf="' + (pg.pdf ? root + pg.pdf : '') + '" data-png="' + (pg.png ? root + pg.png : '') + '">View</button></div>'
          + '<div class="wp-actions cl-actions cl-actions-dl">' + dlPdf + dlPng + '</div></article>';
      }).join('') + '</div>';
    }
    if (wps.length) {
      html += '<h2 class="wp-section-title">Wallpapers</h2><div class="wp-grid wp-grid-wallpapers">' + wps.map(function (w) {
        var thumb = w.file ? root + w.file : root + 'assets/wallpapers/wallpaper-placeholder.svg';
        var ext = w.file ? w.file.split('.').pop().toUpperCase() : 'WEBP';
        var meta = esc(w.boardName) + (w.sectionName ? ' · ' + esc(w.sectionName) : '') + ' · 9:16 · ' + ext;
        var dl = w.file
          ? '<a class="btn btn-accent wp-download" href="' + root + w.file + '" download="' + w.slug + '.' + ext.toLowerCase() + '" data-free-download="' + w.slug + '" data-location="wallpapers">Download</a>'
          : '<button class="btn btn-accent wp-download" type="button" disabled>Download</button>';
        var badge = w.file ? '' : ' <span class="wp-coming">Coming soon</span>';
        return '<article class="wp-item" data-wallpaper="' + w.slug + '">'
          + '<div class="wp-thumb"><img src="' + thumb + '" alt="' + esc(w.title) + ' — free 9:16 phone wallpaper" width="1080" height="1920" loading="lazy"></div>'
          + '<div class="wp-body"><h3>' + esc(w.title) + badge + '</h3><p class="wp-meta">' + meta + '</p></div>'
          + '<div class="wp-actions"><button class="btn btn-ghost wp-view" type="button" data-view="' + w.slug + '" data-full="' + (w.file ? root + w.file : root + 'assets/wallpapers/wallpaper-placeholder.svg') + '" data-title="' + esc(w.title) + '" data-available="' + (w.file ? '1' : '0') + '">View</button>' + dl + '</div></article>';
      }).join('') + '</div>';
    }
    if (tiers.length) {
      html += '<h2 class="wp-section-title">Colouring categories</h2><div class="wp-grid">' + tiers.map(function (t) {
        return '<article class="wp-card"><a class="card-link" href="' + root + t.url + '" aria-label="' + esc(t.name) + ' colouring pages — ' + esc(t.ages) + '"></a>'
          + '<div class="wp-cover"><img src="' + root + 'assets/wallpapers/cover-placeholder.svg" alt="' + esc(t.name) + ' colouring pages cover" width="1024" height="1024" loading="lazy"></div>'
          + '<div class="wp-body"><h3>' + esc(t.name) + '</h3><p class="wp-count">' + esc(t.ages) + ' · ' + esc(t.level) + ' · ' + t.count + ' pages</p></div></article>';
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
})();
