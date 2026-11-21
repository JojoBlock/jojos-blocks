/* JoJo's Blocks — Round 2 site script.
   Preserves the H1 Claude Edition behaviours (modal, search overlay, tab bar,
   newsletter preview note) and adds: data-driven listings (query-string
   filters/sort/pagination), lazy MiniSearch, synonym normalisation.
   Static HTML renders first; this script only enhances. No hard-coded
   inventory counts anywhere: every count is computed from page data. */
document.documentElement.classList.add('js');
const JB = window.JB || { root: '', page: 'home', kind: '' };
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const money = n => '$' + Number(n).toFixed(2);

/* ================= GA4 custom events (D3, 2026-11-17) =================
   Ported from dev-repo js/site.js + js/main.js. Every handler fires only
   when window.gtag exists (the D1 tag block). No query text or personal
   data is ever sent. Verified locally with a stubbed gtag; arrival in the
   GA4 dashboard is NOT verifiable from this VM (dashboard access refused).
   newsletter_signup is NOT ported: the live newsletter form is a design
   preview that never submits (no backend), so there is no real signup to
   count. */
function gaEvent(name, params) {
  if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
}
document.addEventListener('click', e => {
  var b = e.target.closest ? e.target.closest('a[data-book]') : null;
  if (b) gaEvent('buy_now_click', { book_slug: b.getAttribute('data-book'), location: b.getAttribute('data-location') || 'page' });
});
document.addEventListener('click', e => {
  var d = e.target.closest ? e.target.closest('a[data-free-download]') : null;
  if (d) gaEvent('free_sample_download', { resource_slug: d.getAttribute('data-free-download'), location: d.getAttribute('data-location') || 'page' });
});
document.addEventListener('click', e => {
  var a = e.target.closest ? e.target.closest('a[data-affiliate]') : null;
  if (a) gaEvent('affiliate_outbound_click', { item: a.getAttribute('data-affiliate'), location: a.getAttribute('data-location') || 'page' });
});
document.addEventListener('click', e => {
  var g = e.target.closest ? e.target.closest('button[id^="jjb-"][id$="-start"]') : null;
  if (g) {
    var parts = window.location.pathname.split('/').filter(Boolean);
    gaEvent('game_start', { game_slug: parts.length > 1 ? parts[1] : (parts[0] || 'unknown'), location: 'page' });
  }
});
let searchCounted = false; // one search_use per page load, shared by all search inputs

/* ---- synonym normalisation: colouring/coloring must match ---- */
const SYN = { colour: 'color', colouring: 'coloring', colours: 'colors', coloured: 'colored', favourite: 'favorite', favourites: 'favorites', organise: 'organize', organised: 'organized', behaviour: 'behavior', centre: 'center', licence: 'license', jewellery: 'jewelry', cheque: 'check', mum: 'mom' };
function normalize(s) {
  return String(s || '').toLowerCase().replace(/[’']/g, "'")
    .replace(/\b(colouring|colour|colours|coloured|favourite|favourites|organise|organised|behaviour|centre|licence|jewellery|cheque|mum)\b/g, w => SYN[w] || w)
    .replace(/\s+/g, ' ').trim();
}

/* ================= product detail modal ================= */
const PRODUCTS = (() => { try { return JSON.parse($('#product-data') ? $('#product-data').textContent : '{}'); } catch (e) { return {}; } })();
const modalBack = $('#modalBack'), modalBox = $('#modalBox');
let lastFocused = null;
function openModal(id) {
  const p = PRODUCTS[id]; if (!p || !modalBack) return;
  if (p.kofi) { window.location.href = JB.root + p.page; return; } // Ko-fi product: go to its detail page, never the book modal
  lastFocused = document.activeElement;
  $('#modalCover').innerHTML = '<img src="' + p.cover + '" alt="' + p.title.replace(/"/g, '&quot;') + ' cover" width="600" height="849">';
  $('#modalFmt').textContent = 'PDF · ' + p.pages + ' pages' + (p.ages ? ' · Ages ' + p.ages : '');
  $('#modalTitle').textContent = p.title;
  const hasDiscount = p.sale < p.price;
  $('#modalPrice').innerHTML = money(p.sale) + (hasDiscount ? ' <s>' + money(p.price) + '</s>' : '');
  $('#modalSave').textContent = (id === 'bundle')
    ? 'Save $5.97 vs the four books at regular prices ($18.96 vs $12.99).'
    : (hasDiscount ? 'Save $' + (p.price - p.sale).toFixed(2) + ' vs the regular price.' : '');
  const disc = document.getElementById('modalDiscount');
  if (disc) disc.style.display = hasDiscount ? '' : 'none';
  $('#modalDesc').textContent = p.desc;
  const getItems = p.get || [p.pages + ' printable A4 pages', 'Ages ' + p.ages, 'A4 PDF — US buyers print on Letter', 'Personal &amp; family use'];
  $('#modalGet').innerHTML = getItems.map(g => '<li>' + g + '</li>').join('');
  $('#modalBuy').href = p.gum;
  $('#modalBuy').setAttribute('data-book', id);
  $('#modalBuy').setAttribute('data-location', 'modal');
  $('#modalPage').href = JB.root + p.page;
  $('#modalPageLink').href = JB.root + p.page;
  $('#mstickyPrice').innerHTML = money(p.sale) + (hasDiscount ? ' <s>' + money(p.price) + '</s>' : '');
  $('#mstickyBuy').href = p.gum;
  $('#mstickyBuy').setAttribute('data-book', id);
  $('#mstickyBuy').setAttribute('data-location', 'modal');
  $('#modalRelated').innerHTML = Object.keys(PRODUCTS).filter(k => k !== id && !PRODUCTS[k].kofi && !PRODUCTS[k].amazon).map(k =>
    '<button class="chip" data-related="' + k + '" aria-pressed="false">' + PRODUCTS[k].title + '</button>').join('');
  modalBack.classList.add('open');
  document.body.style.overflow = 'hidden';
  $('#modalClose').focus();
}
function closeModal() {
  if (!modalBack) return;
  modalBack.classList.remove('open');
  document.body.style.overflow = '';
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}
/* Product cards navigate to their dedicated page (2026-11-20): a card click
   (cover, title, or any part of the card) takes the visitor to that
   product's own /books/ page — the same rich landing page Pinterest
   visitors land on — instead of the quick-view modal. view_details still
   fires once per card click, before navigation, using the same
   fire-and-navigate pattern as buy_now_click (verified live 20 Nov 2026:
   the GA4 event survives the immediate navigation). The dedicated page
   view itself also registers as a page_view. The modal stays in the code
   (opened only by its own related chips), but no card opens it any more. */
document.addEventListener('click', e => {
  const d = e.target.closest('[data-detail]');
  if (d) { gaEvent('view_details', { book_slug: d.dataset.detail }); return; } // default navigation follows the anchor to the dedicated page
  const r = e.target.closest('[data-related]');
  if (r) { openModal(r.dataset.related); gaEvent('view_details', { book_slug: r.dataset.related }); return; }
});
document.addEventListener('click', e => {
  // Whole-card click: the card body (meta, price, whitespace) has no link of
  // its own, so navigate it to the same dedicated page the cover/title use.
  // Buy/Amazon buttons are links themselves and keep their own destinations.
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const card = e.target.closest ? e.target.closest('article.card') : null;
  if (!card || e.target.closest('a,button')) return;
  const link = card.querySelector('a[data-detail]') || card.querySelector('.cover a[href]');
  if (!link) return;
  if (link.dataset.detail) gaEvent('view_details', { book_slug: link.dataset.detail });
  window.location.href = link.href;
});
if ($('#modalClose')) $('#modalClose').addEventListener('click', closeModal);
if (modalBack) modalBack.addEventListener('click', e => { if (e.target === modalBack) closeModal(); });

/* ================= lazy search (MiniSearch + index) ================= */
let searchReady = null;
function loadSearch() {
  if (searchReady) return searchReady;
  searchReady = new Promise(resolve => {
    const loadScript = new Promise(res => {
      if (window.MiniSearch) return res();
      const s = document.createElement('script');
      s.src = JB.root + 'assets/vendor/minisearch.umd.js';
      s.onload = res; s.onerror = () => res();
      document.head.appendChild(s);
    });
    loadScript.then(() => fetch(JB.root + 'search-index.json').then(r => r.json()).then(docs => {
      if (!window.MiniSearch) { resolve(null); return; }
      const ms = new MiniSearch({ fields: ['title', 'text'], storeFields: ['title', 'url', 'type', 'snippet'], searchOptions: { prefix: true, fuzzy: 0.2, combineWith: 'AND' } });
      ms.addAll(docs);
      resolve(ms);
    }).catch(() => resolve(null)));
  });
  return searchReady;
}
function runSearch(ms, q) {
  if (!ms) return [];
  return ms.search(normalize(q), { prefix: true, fuzzy: 0.2, combineWith: 'AND' });
}
function renderSuggestions(box, results, q) {
  if (!q.trim()) { box.classList.remove('open'); box.innerHTML = ''; return; }
  const groups = ['Products', 'Free resources', 'Games', 'Articles', 'Recommended'];
  const byGroup = {};
  results.forEach(r => { (byGroup[r.type] = byGroup[r.type] || []).push(r); });
  let html = '';
  let any = false;
  groups.forEach(g => {
    const items = (byGroup[g] || []).slice(0, 3);
    if (!items.length) return;
    any = true;
    html += '<div class="sg-group">' + g + '</div>';
    items.forEach(r => {
      html += '<button type="button" class="sg-item" role="option" data-url="' + r.url + '"><span>' + r.title.replace(/</g, '&lt;') + '</span><span class="sg-type">' + g + '</span></button>';
    });
  });
  if (!any) html = '<div class="sg-none">No matches for "' + q.replace(/</g, '&lt;') + '". Press Enter to see results.</div>';
  box.innerHTML = html;
  box.querySelectorAll('[data-url]').forEach(b => b.addEventListener('click', () => { closeSearchUI(); window.location.href = JB.root + b.dataset.url; }));
  box.classList.add('open');
}
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
function bindSearch(formId, inputId, suggestId) {
  const form = $(formId), input = $(inputId), box = $(suggestId);
  if (!form || !input || !box) return null;
  const update = debounce(() => {
    const q = input.value;
    if (q.trim() && !searchCounted) { searchCounted = true; gaEvent('search_use', { page: window.location.pathname }); }
    if (!q.trim()) { renderSuggestions(box, [], q); return; }
    loadSearch().then(ms => renderSuggestions(box, runSearch(ms, q), q));
  }, 150);
  input.addEventListener('input', update);
  input.addEventListener('focus', () => { loadSearch(); if (input.value.trim()) update(); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const q = input.value.trim();
    if (q) window.location.href = JB.root + 'search/?q=' + encodeURIComponent(q);
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); input.value = ''; renderSuggestions(box, [], ''); closeSearchUI(); }
  });
  return { input, box };
}
const headSearch = bindSearch('#headSearch', '#searchInput', '#headSuggest');
const mobSearch = bindSearch('#mobSearch', '#mobSearchInput', '#mobSuggest');
function closeSearchUI() {
  $$('.suggest').forEach(s => { s.classList.remove('open'); s.innerHTML = ''; });
  closeSearchOverlay();
}
document.addEventListener('click', e => {
  if (!e.target.closest('.search') && !e.target.closest('.suggest') && !e.target.closest('#searchIconBtn') && !e.target.closest('#tabSearch') && !e.target.closest('.search-overlay')) closeSearchUI();
});

/* ---- mobile search overlay ---- */
function openSearchOverlay() {
  const o = $('#searchOverlay'); if (!o) return;
  o.classList.add('open');
  $('#searchIconBtn').setAttribute('aria-expanded', 'true');
  document.body.classList.add('tab-hidden');
  setTimeout(() => { const i = $('#mobSearchInput'); if (i) i.focus(); }, 50);
}
function closeSearchOverlay() {
  const o = $('#searchOverlay'); if (!o) return;
  o.classList.remove('open');
  $('#searchIconBtn').setAttribute('aria-expanded', 'false');
  document.body.classList.remove('tab-hidden');
}
if ($('#searchIconBtn')) $('#searchIconBtn').addEventListener('click', () => {
  if ($('#searchOverlay').classList.contains('open')) closeSearchOverlay(); else openSearchOverlay();
});
if ($('#searchOverlayClose')) $('#searchOverlayClose').addEventListener('click', closeSearchOverlay);
if ($('#tabSearch')) $('#tabSearch').addEventListener('click', e => { e.preventDefault(); openSearchOverlay(); });

  function cardHtml(kind, it) {
    if (kind === 'products') {
      if (it.affiliateUrl) {
        // Affiliate showcase item (Creative Fabrica / Impact, 2026-11-21):
        // the card opens the item's own detail page (shop/<slug>.html) —
        // it never links straight to the merchant. The detail page carries
        // the affiliate CTA. (Owner order 21 Nov ~17:23 IST.)
        const badge = it.badge ? '<span class="badge">' + it.badge + '</span>' : '';
        const detailUrl = JB.root + (it.url || ('shop/' + it.key + '.html'));
        const imgStyle = it.imgStyle ? ' style="' + it.imgStyle + '"' : '';
        const cover = it.thumb
          ? '<a href="' + detailUrl + '" aria-label="View ' + it.title.replace(/"/g, '&quot;') + ' details"><img src="' + it.thumb + '" alt="' + it.title.replace(/"/g, '&quot;') + '" loading="lazy"' + imgStyle + '></a>'
          : '<div class="af-brand">' + it.merchant + '<small>' + (it.type || '') + '</small></div>';
        const price = it.salePrice
          ? '<div class="price-row"><span class="price">' + it.salePrice + '</span></div>' + (it.priceNote ? '<p class="af-price-note">' + it.priceNote + '</p>' : '')
          : '';
        const coverStyle = it.coverStyle ? ' style="' + it.coverStyle + '"' : '';
        return '<article class="card af-card" data-id="' + it.key + '" data-cat="' + it.filterKey + '" data-price="' + (it.salePriceNum ?? '') + '">'
          + '<div class="cover"' + coverStyle + '>' + badge + cover + '</div>'
          + '<div class="body"><span class="tag">' + it.categoryName + ' · ' + it.merchant + '</span>'
          + '<h3><a href="' + detailUrl + '">' + it.title + '</a></h3>'
          + '<p class="meta">' + (it.type || '') + '</p>' + price
          + '<div class="actions"><a class="btn btn-ink" href="' + detailUrl + '">View details →</a></div></div></article>';
      }
      if (it.kofiUrl) {
        // Ko-fi showcase product: no product modal (the shared modal is book/Gumroad-specific),
        // so the cover and title link straight to the detail page, and Buy goes to Ko-fi.
        const badge = it.badge ? '<span class="badge">' + it.badge + '</span>' : '';
        return '<article class="card" data-id="' + it.key + '" data-cat="' + it.filterKey + '" data-price="' + (it.salePriceNum ?? '') + '">'
          + '<div class="cover">' + badge + '<a href="' + JB.root + it.url + '" aria-label="View ' + it.title.replace(/"/g, '&quot;') + ' details"><img src="' + it.thumb + '" alt="' + (it.coverAlt || it.title).replace(/"/g, '&quot;') + '" width="480" height="480" loading="lazy"></a></div>'
          + '<div class="body"><h3><a href="' + JB.root + it.url + '">' + it.title + '</a></h3>'
          + '<p class="meta">' + it.format + ' · Instant download</p>'
          + '<div class="price-row"><span class="price">' + it.salePrice + '</span></div>'
          + '<div class="actions"><a class="btn btn-accent" href="' + it.kofiUrl + '" target="_blank" rel="noopener">Buy on Ko-fi</a></div></div></article>';
      }
      if (it.type === 'paperback') {
        // Paperback (Amazon) product: its own card, separate from the digital
        // book. No product modal (the shared modal is book/Gumroad-specific),
        // so the cover and title link straight to the detail page, and the
        // primary button goes to Amazon. Must mirror build.js productCard.
        const badge = it.badge ? '<span class="badge">' + it.badge + '</span>' : '';
        return '<article class="card" data-id="' + it.key + '" data-cat="' + it.filterKey + '" data-age-min="' + (it.ageMin ?? '') + '" data-age-max="' + (it.ageMax ?? '') + '" data-price="' + (it.salePriceNum ?? '') + '" data-pages="' + (it.pages || '') + '">'
          + '<div class="cover">' + badge + '<a href="' + JB.root + it.url + '" aria-label="View ' + it.title.replace(/"/g, '&quot;') + ' details"><img src="' + it.thumb + '" alt="' + (it.coverAlt || it.title).replace(/"/g, '&quot;') + '" width="600" height="849" loading="lazy"></a></div>'
          + '<div class="body"><h3><a href="' + JB.root + it.url + '">' + it.title + '</a></h3>'
          + '<p class="meta">' + it.format + (it.ageLabel ? ' · ' + it.ageLabel : '') + '</p>'
          + '<div class="price-row"><span class="price">' + it.salePrice + '</span></div>'
          + '<div class="actions"><a class="btn btn-accent" href="' + it.amazonUrl + '" target="_blank" rel="noopener" data-amazon="' + it.key + '" data-location="card">Get the Paperback on Amazon</a></div></div></article>';
      }
      const badge = it.badge ? '<span class="badge">' + it.badge + '</span>' : '';
      const wasNum = parseFloat(String(it.price || '').replace(/[^0-9.]/g, ''));
      const nowNum = parseFloat(String(it.salePrice || '').replace(/[^0-9.]/g, ''));
      const hasDiscount = !isNaN(wasNum) && !isNaN(nowNum) && nowNum < wasNum;
      const price = it.salePrice ? '<div class="price-row"><span class="price">' + it.salePrice + '</span>' + (hasDiscount ? '<s>' + it.price + '</s>' : '') + '</div>' : '';
      // Paperback (Amazon) option, when the product has one: a secondary
      // button under the primary Buy button. Must mirror build.js productCard.
      const paperbackBtn = it.paperback ? '<a class="btn btn-ghost" href="' + it.paperback.amazonUrl + '" target="_blank" rel="noopener" data-amazon="' + it.key + '" data-location="card">Paperback on Amazon — ' + it.paperback.price + '</a>' : '';
      const buy = it.gumroadUrl
        ? '<div class="actions"><a class="btn btn-accent" href="' + it.gumroadUrl + '" target="_blank" rel="noopener" data-book="' + it.key + '" data-location="card">Buy ' + it.salePrice + '</a>' + paperbackBtn + '</div>'
        : (paperbackBtn ? '<div class="actions">' + paperbackBtn + '</div>' : '');
      return '<article class="card" data-id="' + it.key + '" data-cat="' + it.filterKey + '" data-age-min="' + (it.ageMin ?? '') + '" data-age-max="' + (it.ageMax ?? '') + '" data-price="' + (it.salePriceNum ?? '') + '" data-pages="' + (it.pages || '') + '">'
        + '<div class="cover">' + badge + '<a href="' + JB.root + it.url + '" data-detail="' + it.key + '" aria-label="View ' + it.title.replace(/"/g, '&quot;') + ' details"><img src="' + it.thumb + '" alt="' + (it.coverAlt || it.title).replace(/"/g, '&quot;') + '" width="600" height="849" loading="lazy"></a></div>'
        + '<div class="body"><h3><a href="' + JB.root + it.url + '" data-detail="' + it.key + '">' + it.title + '</a></h3>'
        + '<p class="meta">' + (it.pages || '') + ' pages' + (it.ageLabel ? ' · ' + it.ageLabel : '') + '</p>' + price + buy + '</div></article>';
    }
    if (kind === 'resources') {
      const thumb = it.thumb ? '<div class="rthumb"><img src="' + it.thumb + '" alt="' + it.title.replace(/"/g, '&quot;') + ' preview" loading="lazy"></div>' : '';
      return '<article class="res-item" data-cat="' + it.filterKey + '">'
        + '<a class="card-link" href="' + JB.root + it.url + '" aria-label="' + it.title.replace(/"/g, '&quot;') + ' — ' + (it.goLabel || 'View &amp; download') + '"></a>' + thumb
        + '<div class="rbody"><span class="tag">' + it.tag + '</span><h3>' + it.title + '</h3>'
        + '<span class="go">' + (it.go || 'View &amp; download →') + '</span></div></article>';
    }
    if (kind === 'games') {
      return '<article class="gcard"><div class="gthumb"><img src="' + it.thumb + '" alt="' + it.title.replace(/"/g, '&quot;') + ' game" width="640" height="360" loading="lazy"></div>'
        + '<h3>' + it.title + '</h3><p class="meta">' + (it.categoryName || '') + '</p>'
        + '<a href="' + JB.root + it.url + '">Play free →</a></article>';
    }
    if (kind === 'affiliates') {
      const price = it.price ? '<div class="price-row"><span class="price">' + it.price + '</span></div>' : '';
      const thumb = it.thumb ? '<a href="' + JB.root + it.url + '" aria-label="View ' + it.title.replace(/"/g, '&quot;') + ' details"><img src="' + it.thumb + '" alt="' + it.title.replace(/"/g, '&quot;') + '" loading="lazy"></a>' : '';
      return '<article class="card af-card" id="af-' + it.key + '" data-cat="' + it.filterKey + '">'
        + '<div class="cover">' + thumb + '</div>'
        + '<div class="body"><span class="tag">' + it.categoryName + ' · ' + it.merchant + '</span>'
        + '<h3><a href="' + JB.root + it.url + '">' + it.title + '</a></h3>' + price
        + '<div class="actions"><a class="btn btn-ink" href="' + JB.root + it.url + '">View Product</a></div></div></article>';
    }
    return '<article class="bcard">'
      + '<a class="card-link" href="' + JB.root + it.url + '" aria-label="Read ' + it.title.replace(/"/g, '&quot;') + '"></a>'
      + '<div class="bcover"><img src="' + it.thumb + '" alt="' + it.title.replace(/"/g, '&quot;') + '" width="1200" height="675" loading="lazy"></div>'
      + '<div class="body"><span class="tag">' + it.tag + '</span><h3>' + it.title + '</h3>'
      + '<span class="read">Read article →</span></div></article>';
  }

/* ================= listing engine (query-string filters/sort/pagination) ================= */
const PAGE = (() => { try { return JSON.parse($('#page-data') ? $('#page-data').textContent : 'null'); } catch (e) { return null; } })();
if (PAGE) {
  const params = new URLSearchParams(window.location.search);
  const state = {
    filter: params.get('category') || params.get('filter') || 'all',
    age: params.get('age') || 'any',
    sort: params.get('sort') || (PAGE.kind === 'articles' ? 'newest' : 'featured'),
    q: params.get('q') || '',
    topic: params.get('topic') || 'all',
    format: params.get('format') || 'all',
    price: params.get('price') || 'all',
    page: Math.max(1, parseInt(params.get('page') || '1', 10) || 1),
    sub: params.get('sub') || ''
  };
  const grid = $('#listingGrid');
  const countEl = $('#pageCount');
  const emptyEl = $('#listingEmpty');
  const pagerEl = $('#pager');
  const loadMoreBtn = $('#loadMoreBtn');
  function visibleItems() {
    const q = normalize(state.q);
    // Shop filter pills (own-products + homepage data) use semantic values
    // — Books / Real Books / Digital Stickers / Planners — while the
    // #page-data filterKeys are grouped (books-printables, planners-stickers).
    // Without this mapping every chip except All matched 0 items (live bug).
    // Scoped to kind 'products' so FR / games / blog filters (filterKey
    // equality) are untouched.
    function filterMatch(it, f) {
      if (PAGE.kind === 'products') {
        if (f === 'books') return it.type === 'book';
        if (f === 'real-books') return it.type === 'paperback';
        if (f === 'stickers') return it.type === 'stickers';
        if (f === 'planners') return it.type === 'kit';
      }
      return it.filterKey === f;
    }
    let items = PAGE.items.filter(it => {
      if (state.filter !== 'all' && !PAGE.lockFilter && !filterMatch(it, state.filter)) return false;
      if (state.sub && it.sub !== state.sub) return false;
      if (state.topic !== 'all' && !(it.tags || []).includes(state.topic)) return false;
      if (state.format !== 'all' && it.formatKey !== state.format) return false;
      if (state.price !== 'all') {
        const p = it.salePriceNum;
        if (p == null) return false;
        if (state.price === 'under5' && !(p < 5)) return false;
        if (state.price === '5to10' && !(p >= 5 && p <= 10)) return false;
        if (state.price === 'over10' && !(p > 10)) return false;
      }
      if (state.age !== 'any' && PAGE.showAge) {
        const a = parseInt(state.age, 10);
        if (it.ageMin == null || a < it.ageMin || a > it.ageMax) return false;
      }
      if (q) {
        const hay = normalize((it.title || '') + ' ' + (it.text || '') + ' ' + (it.tags || []).join(' ') + ' ' + (it.categoryName || ''));
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (state.sort === 'price-asc') items.sort((a, b) => (a.salePriceNum ?? 1e9) - (b.salePriceNum ?? 1e9));
    else if (state.sort === 'price-desc') items.sort((a, b) => (b.salePriceNum ?? -1) - (a.salePriceNum ?? -1));
    else if (state.sort === 'pages') items.sort((a, b) => (b.pages || 0) - (a.pages || 0));
    else if (state.sort === 'az') items.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    else if (state.sort === 'newest') items.sort((a, b) => String(b.dateAdded || '').localeCompare(String(a.dateAdded || '')) || (a.featuredRank || 99) - (b.featuredRank || 99));
    else items.sort((a, b) => (a.featuredRank || 99) - (b.featuredRank || 99));
    return items;
  }
  /* ---- Phase 2: sub-category icon cards (Free Resources index) ----
     Inline SVGs (24 viewBox, currentColor) + per-sub icon colour. The map is
     keyed by sub slug; anything unmapped falls back to a keyword match on
     the slug/label, then a generic image icon. */
  const FR_SVG = {
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>',
    paw: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="6.8" cy="9.5" r="1.9"/><circle cx="10.6" cy="7" r="1.9"/><circle cx="14.8" cy="7" r="1.9"/><circle cx="18.4" cy="9.8" r="1.9"/><ellipse cx="12.4" cy="15.5" rx="4.6" ry="3.9"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z"/></svg>',
    car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>',
    chip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"/><rect x="10" y="10" width="4" height="4"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
    dice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    coin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M15 9.5c0-1.2-1.3-2-3-2s-3 .8-3 2 1 1.8 3 2 3 .8 3 2-1.3 2-3 2-3-.8-3-2"/></svg>',
    gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M5 12v9h14v-9"/><path d="M12 8s-1.5-5-4.5-5C5 3 4 5 5.5 6.5 7 8 12 8 12 8zm0 0s1.5-5 4.5-5C19 3 20 5 18.5 6.5 17 8 12 8 12 8z"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1.3"/></svg>',
    bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>',
    film: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4"/></svg>',
    rocket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
    building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg>',
    mountain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
    briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
    flower: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></svg>',
    butterfly: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16"/><path d="M5 5c-2 1-3 4-2 6s4 2 6 0c1-1 1-3 0-4-2-1-3-2-4-2z"/><path d="M19 5c2 1 3 4 2 6s-4 2-6 0c-1-1-1-3 0-4 2-1 3-2 4-2z"/><path d="M6 15c-1.5 2-1 5 1 6 2-1 2.5-3 1.5-5M18 15c1.5 2 1 5-1 6-2-1-2.5-3-1.5-5"/></svg>',
    gem: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>',
    smiley: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/></svg>',
    palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a10 10 0 1 1 10-10c0 4.42-2.87 8-6.5 8-1.5 0-3.5-.5-4.5-2S9 15 9.5 13.5 11 12 12.5 12H16a4 4 0 0 0 4-4c0-2.21-1.79-4-4-4H8"/><circle cx="13.5" cy="6.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="17.5" cy="10.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="8.5" cy="7.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="6.5" cy="12.5" r="1.1" fill="currentColor" stroke="none"/></svg>',
    gamepad: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="11" rx="5.5"/><path d="M7.5 11v3.5M5.8 12.7h3.5"/><circle cx="16" cy="11.5" r="1" fill="currentColor" stroke="none"/><circle cx="18.2" cy="14" r="1" fill="currentColor" stroke="none"/></svg>',
    cup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><path d="M6 2v2M10 2v2M14 2v2"/></svg>',
    shirt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
    music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>'
  };
  const FR_SUB_ICON = {
    books: ['book', '#2563EB'], 'sketch-drawing': ['pencil', '#F97316'],
    animals: ['paw', '#16A34A'], anime: ['sparkle', '#2563EB'],
    vehicles: ['car', '#DC2626'], arts: ['palette', '#7C3AED'],
    'coding-and-ai': ['chip', '#2563EB'], plants: ['leaf', '#16A34A'],
    'dungeons-and-dragons': ['dice', '#DC2626'], 'marvel-dc': ['star', '#DC2626'],
    outfit: ['shirt', '#DB2777'], 'crypto-world': ['coin', '#B45309'],
    'movie-series': ['film', '#7C3AED'], 'human-life': ['smiley', '#0E7490'],
    icon: ['star', '#B45309'], profession: ['briefcase', '#475569'],
    'architecture-design': ['building', '#64748B'], universe: ['rocket', '#4F46E5'],
    cinematic: ['camera', '#111214'], wallpapers: ['image', '#7C3AED'],
    landscape: ['mountain', '#16A34A'], 'health-and-fitness': ['heart', '#DC2626'],
    'space-mission': ['rocket', '#4F46E5'], dreamy: ['sparkle', '#7C3AED'],
    'anime-world': ['sparkle', '#2563EB'], 'another-world': ['gem', '#7C3AED'],
    'neon-arts': ['palette', '#EC4899'], fashion: ['shirt', '#DB2777'],
    'genius-people': ['trophy', '#B45309'], movies: ['film', '#7C3AED'],
    weird: ['smiley', '#D97706'], kids: ['smiley', '#F97316'],
    'juniors-teens': ['star', '#EC4899'], 'adults-relaxation': ['flower', '#7C3AED'],
    'expert-genius': ['gem', '#4F46E5'], bookmarks: ['bookmark', '#2563EB'],
    'wall-art': ['image', '#0E7490'], 'gift-tags-cards': ['gift', '#DC2626'],
    'labels-party': ['tag', '#DB2777'], 'daily-weekly': ['calendar', '#F97316'],
    'habits-mood': ['heart', '#16A34A'], routines: ['clock', '#2563EB'],
    'money-goals': ['target', '#B45309'], letters: ['book', '#2563EB'],
    numbers: ['target', '#4F46E5'], 'shapes-tracing': ['star', '#16A34A'],
    pets: ['paw', '#F97316'], 'wild-animals': ['paw', '#92400E'],
    butterflies: ['butterfly', '#EC4899'], 'flowers-space': ['flower', '#7C3AED'],
    'image-art': ['image', '#2563EB'], 'chatgpt-writing': ['chat', '#0E7490'],
    'work-study-video': ['briefcase', '#475569'], 'food-drinks': ['cup', '#EC4899'],
    'school-weather-space': ['rocket', '#4F46E5']
  };
  const FR_CAT_COLOR = { all: '#7C3AED', coloring: '#EC4899', 'learn-to-draw': '#0E9F7A', worksheets: '#2563EB', planners: '#F97316', printables: '#4D7C0F', wallpapers: '#7C3AED', ai: '#0E7490', stickers: '#B45309', games: '#6D28D9' };
  function subIconFor(sub, label) {
    let hit = FR_SUB_ICON[sub];
    if (!hit) {
      const hay = ((sub || '') + ' ' + (label || '')).toLowerCase();
      if (/animal|pet|paw|dog|cat|wild/.test(hay)) hit = ['paw', '#16A34A'];
      else if (/anime|spark|magic|dream/.test(hay)) hit = ['sparkle', '#2563EB'];
      else if (/car|vehicle|rocket|space|mission/.test(hay)) hit = ['rocket', '#4F46E5'];
      else if (/book|read|letter/.test(hay)) hit = ['book', '#2563EB'];
      else if (/art|draw|paint|color|neon/.test(hay)) hit = ['palette', '#7C3AED'];
      else if (/video|movie|film|cinema/.test(hay)) hit = ['film', '#7C3AED'];
      else if (/music|song/.test(hay)) hit = ['music', '#7C3AED'];
      else if (/food|drink|eat|snack/.test(hay)) hit = ['cup', '#EC4899'];
      else if (/flower|plant|leaf|nature|garden/.test(hay)) hit = ['leaf', '#16A34A'];
      else if (/heart|health|mood|habit/.test(hay)) hit = ['heart', '#DC2626'];
      else if (/money|coin|goal|target/.test(hay)) hit = ['target', '#B45309'];
      else if (/school|study|learn/.test(hay)) hit = ['book', '#2563EB'];
      else hit = ['image', '#7C3AED'];
    }
    return { svg: FR_SVG[hit[0]] || FR_SVG.image, color: hit[1] };
  }
  let renderedPages = 1;
  let viaLoadMore = false; // true after a Load-more click: render cumulatively
  function syncCrumbs() {
    const crumbs = $('#frCrumbs'); if (!crumbs) return;
    if (state.filter === 'all') { crumbs.hidden = true; crumbs.innerHTML = ''; return; }
    const catLabel = (PAGE.filterLabel && PAGE.filterLabel[state.filter]) || state.filter;
    const esc = s => String(s).replace(/</g, '&lt;');
    const catTile = document.querySelector('#listingChips [data-filter="' + state.filter + '"] .cat-ic');
    const catColor = FR_CAT_COLOR[state.filter] || '#7C3AED';
    if (state.sub) {
      const subBtn = document.querySelector('#subCatRow [data-sub="' + state.sub + '"]');
      const subLabel = subBtn ? subBtn.textContent.trim() : state.sub;
      const ic = subIconFor(state.sub, subLabel);
      crumbs.innerHTML = '<span class="fr-crumb-ic" style="color:' + ic.color + '">' + ic.svg + '</span>' + esc(catLabel) + ' \u203a ' + esc(subLabel);
    } else {
      crumbs.innerHTML = '<span class="fr-crumb-ic" style="color:' + catColor + '">' + (catTile ? catTile.innerHTML : '') + '</span>' + esc(catLabel);
    }
    crumbs.hidden = false;
  }
  function render() {
    const items = visibleItems();
    syncCrumbs();
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / PAGE.pageSize));
    const page = Math.min(state.page, pages);
    const isFrIndex = JB.page === 'listing' && PAGE.kind === 'resources';
    const filtered = state.filter !== 'all' || !!state.q || state.topic !== 'all' || state.format !== 'all' || state.price !== 'all' || state.age !== 'any' || !!state.sub;
    const showAll = isFrIndex && filtered;
    const shown = showAll ? items : (viaLoadMore ? items.slice(0, page * PAGE.pageSize) : items.slice((page - 1) * PAGE.pageSize, page * PAGE.pageSize));
    renderedPages = page;
    if (grid) grid.innerHTML = shown.map(it => cardHtml(PAGE.kind, it)).join('');
    if (emptyEl) {
      if (!total) {
        emptyEl.textContent = state.q ? ('No matches for "' + state.q.trim() + '". Try "animals" or browse free printables.') : 'No items match the selected filters.';
        emptyEl.classList.add('show');
      } else emptyEl.classList.remove('show');
    }
    const active = state.filter !== 'all' || state.age !== 'any' || !!state.q || state.topic !== 'all' || state.format !== 'all' || state.price !== 'all' || state.page > 1 || !!state.sub;
    if (countEl) {
      countEl.hidden = !active;
      if (active) countEl.textContent = 'Showing ' + total + ' ' + PAGE.countNoun + (total === 1 ? '' : 's') + '.';
    }
    if (pagerEl) {
      if (pages <= 1 || showAll) { pagerEl.innerHTML = ''; }
      else {
        let h = '';
        for (let p = 1; p <= pages; p++) h += (p === page) ? '<span class="cur" aria-current="page">' + p + '</span>' : '<a href="' + pageUrl(p) + '">' + p + '</a>';
        pagerEl.innerHTML = h;
      }
    }
    if (loadMoreBtn) loadMoreBtn.hidden = showAll || !(page < pages);
    renderActiveChips();
    syncControls();
  }
  function pageUrl(p) {
    const u = new URLSearchParams(window.location.search);
    if (p <= 1) u.delete('page'); else u.set('page', String(p));
    const s = u.toString();
    return window.location.pathname + (s ? '?' + s : '');
  }
  function syncUrl() {
    const u = new URLSearchParams();
    if (state.filter !== 'all' && !PAGE.lockFilter) u.set(PAGE.filterParam || 'category', state.filter);
    if (state.sub) u.set('sub', state.sub);
    if (state.age !== 'any') u.set('age', state.age);
    if (state.sort !== 'featured') u.set('sort', state.sort);
    if (state.q) u.set('q', state.q);
    if (state.topic !== 'all') u.set('topic', state.topic);
    if (state.format !== 'all') u.set('format', state.format);
    if (state.price !== 'all') u.set('price', state.price);
    if (state.page > 1) u.set('page', String(state.page));
    const s = u.toString();
    history.replaceState(null, '', window.location.pathname + (s ? '?' + s : ''));
  }
  function renderActiveChips() {
    const box = $('#activeFilters'); if (!box) return;
    const chips = [];
    if (state.filter !== 'all') chips.push({ k: 'filter', label: (PAGE.filterLabel && PAGE.filterLabel[state.filter]) || state.filter });
    if (state.sub) {
      const subBtn = document.querySelector('#subCatRow [data-sub="' + state.sub + '"]');
      chips.push({ k: 'sub', label: subBtn ? subBtn.textContent.trim() : state.sub });
    }
    if (state.age !== 'any') chips.push({ k: 'age', label: 'Age ' + state.age });
    if (state.topic !== 'all') chips.push({ k: 'topic', label: state.topic });
    if (state.format !== 'all') chips.push({ k: 'format', label: state.format });
    if (state.price !== 'all') chips.push({ k: 'price', label: state.price });
    if (state.q) chips.push({ k: 'q', label: '"' + state.q + '"' });
    box.innerHTML = chips.map(c => '<span class="af-chip">' + c.label.replace(/</g, '&lt;') + '<button type="button" data-clear="' + c.k + '" aria-label="Remove filter ' + c.label.replace(/"/g, '') + '">✕</button></span>').join('');
    box.querySelectorAll('[data-clear]').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.clear;
      if (k === 'filter') { state.filter = 'all'; state.sub = ''; }
      if (k === 'sub') state.sub = '';
      if (k === 'age') state.age = 'any';
      if (k === 'topic') state.topic = 'all';
      if (k === 'format') state.format = 'all';
      if (k === 'price') state.price = 'all';
      if (k === 'q') state.q = '';
      state.page = 1; viaLoadMore = false; syncUrl(); render();
      gaEvent('filter_use', { filter_value: k + ':all', page: window.location.pathname });
    }));
  }
  function syncControls() {
    $$('#listingChips .chip[data-filter]').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.filter === state.filter)));
    // Contextual sub-categories (Free Resources index only): when a main
    // category tab is tapped, show that category's sub-categories right
    // under the filter chips; tapping a sub-category opens its page.
    const subRow = $('#subCatRow');
    const subHead = $('#subCatHead');
    if (subRow && window.FR_SUBCATS) {
      const subs = window.FR_SUBCATS[state.filter];
      if (subHead) subHead.hidden = !(subs && subs.length);
      if (subs && subs.length) {
        subRow.innerHTML = subs.map(function(s){ var ic = subIconFor(s.sub, s.label); return '<button type="button" class="chip sub-chip" data-sub="' + s.sub + '" aria-pressed="' + String(state.sub === s.sub) + '" style="--sub-ic:' + ic.color + '"><span class="sub-ic">' + ic.svg + '</span><span class="sub-label">' + s.label + '</span></button>'; }).join('');
        subRow.hidden = false;
      } else {
        subRow.innerHTML = '';
        subRow.hidden = true;
      }
    }
    const ageRow = $('#ageChips');
    if (ageRow) $$('#ageChips .chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.age === state.age)));
    const sort = $('#sortSelect'); if (sort) sort.value = state.sort;
    const topic = $('#facetTopic'); if (topic) topic.value = state.topic;
    const format = $('#facetFormat'); if (format) format.value = state.format;
    const price = $('#facetPrice'); if (price) price.value = state.price;
    // Phase 2: keep the FR pill search box in sync with state.q (e.g. after
    // a search chip is cleared) — never while the user is typing in it.
    const frIn = $('#frSearchInput');
    if (frIn && document.activeElement !== frIn) frIn.value = state.q;
  }
  const chipsBox = $('#listingChips');
  if (chipsBox) chipsBox.addEventListener('click', e => {
    const b = e.target.closest('[data-filter]'); if (!b) return;
    state.filter = b.dataset.filter; state.sub = ''; state.page = 1; viaLoadMore = false; syncUrl(); render();
    // Phase 2: a category change resets the sub-row "View All" expansion.
    const subRowEl = $('#subCatRow'); if (subRowEl) subRowEl.classList.remove('expanded');
    const sv = $('#subViewAll'); if (sv) sv.textContent = 'View All \u2192';
    gaEvent('filter_use', { filter_value: state.filter, page: window.location.pathname });
  });
  const subRowBox = $('#subCatRow');
  if (subRowBox) subRowBox.addEventListener('click', e => {
    const b = e.target.closest('[data-sub]'); if (!b) return;
    state.sub = (state.sub === b.dataset.sub) ? '' : b.dataset.sub;
    state.page = 1; viaLoadMore = false; syncUrl(); render();
    gaEvent('filter_use', { filter_value: 'sub:' + (state.sub || 'all'), page: window.location.pathname });
  });
  const ageBox = $('#ageChips');
  if (ageBox) ageBox.addEventListener('click', e => {
    const b = e.target.closest('[data-age]'); if (!b) return;
    state.age = b.dataset.age; state.page = 1; viaLoadMore = false; syncUrl(); render();
    gaEvent('filter_use', { filter_value: 'age-' + state.age, page: window.location.pathname });
  });
  const sortSel = $('#sortSelect');
  if (sortSel) sortSel.addEventListener('change', () => { state.sort = sortSel.value; state.page = 1; viaLoadMore = false; syncUrl(); render(); });
  ['facetTopic', 'facetFormat', 'facetPrice'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => {
      if (id === 'facetTopic') state.topic = el.value;
      if (id === 'facetFormat') state.format = el.value;
      if (id === 'facetPrice') state.price = el.value;
      state.page = 1; viaLoadMore = false; syncUrl(); render();
      gaEvent('filter_use', { filter_value: id.replace('facet', '').toLowerCase() + ':' + el.value, page: window.location.pathname });
    });
  });
  if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => { state.page = renderedPages + 1; viaLoadMore = true; syncUrl(); render(); });
  const filtersBtn = $('#filtersBtn');
  const facets = $('#facets');
  if (filtersBtn && facets) {
    filtersBtn.addEventListener('click', () => facets.classList.toggle('open'));
    const apply = $('#sheetApply');
    if (apply) apply.addEventListener('click', () => facets.classList.remove('open'));
  }
  /* ---- Phase 2: FR pill search — filters the listing in place via state.q ----
     Debounced live filtering while typing; Enter (form submit) applies it
     immediately. The header search is untouched. */
  const frSearchForm = $('#frSearch');
  const frSearchInput = $('#frSearchInput');
  if (frSearchForm && frSearchInput) {
    let frSearchTimer = null;
    const applyFrSearch = () => {
      state.q = frSearchInput.value.trim();
      state.page = 1; viaLoadMore = false; syncUrl(); render();
    };
    frSearchInput.addEventListener('input', () => {
      clearTimeout(frSearchTimer);
      frSearchTimer = setTimeout(applyFrSearch, 200);
    });
    frSearchForm.addEventListener('submit', e => {
      e.preventDefault();
      clearTimeout(frSearchTimer);
      applyFrSearch();
      frSearchInput.blur();
    });
  }
  /* ---- Phase 2: "View All" toggles ---- */
  const catViewAll = $('#catViewAll');
  if (catViewAll) catViewAll.addEventListener('click', () => {
    const all = document.querySelector('#listingChips [data-filter="all"]');
    if (all) all.click();
  });
  const subViewAll = $('#subViewAll');
  if (subViewAll) subViewAll.addEventListener('click', () => {
    const row = $('#subCatRow'); if (!row) return;
    const expanded = row.classList.toggle('expanded');
    subViewAll.textContent = expanded ? 'Show Less \u2191' : 'View All \u2192';
  });
  render(); // always: also populates pager + Load more on a default-state load
}

/* ================= homepage rails (chip/sort filtering, no URL state) ================= */
function bindHomeRail(dataId, gridId, chipsId, sortId, countId, opts) {
  const dataEl = document.getElementById(dataId);
  const grid = document.getElementById(gridId);
  if (!dataEl || !grid) return;
  let data;
  try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
  let filter = 'all', sort = 'featured';
  const countEl = countId ? document.getElementById(countId) : null;
  const defaultCountText = countEl ? countEl.textContent : '';
  const emptyEl = opts.emptyId ? document.getElementById(opts.emptyId) : null;
  function render() {
    // 'Real Books' matches products carrying a paperback record, not a
    // filterKey (a product can be both a digital book and a real book).
    let items = data.items.filter(it => filter === 'all' || it.filterKey === filter);
    if (sort === 'price-asc') items.sort((a, b) => (a.salePriceNum ?? 1e9) - (b.salePriceNum ?? 1e9));
    else if (sort === 'price-desc') items.sort((a, b) => (b.salePriceNum ?? -1) - (a.salePriceNum ?? -1));
    else if (sort === 'pages') items.sort((a, b) => (b.pages || 0) - (a.pages || 0));
    else if (sort === 'az') items.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    else items.sort((a, b) => (a.featuredRank || 99) - (b.featuredRank || 99));
    grid.innerHTML = items.map(it => cardHtml(data.kind, it)).join('');
    if (countEl) {
      if (opts.countMode === 'featured') {
        countEl.textContent = filter === 'all' ? defaultCountText : ('Showing ' + items.length + ' of 6 featured');
        countEl.hidden = false;
      } else {
        countEl.hidden = filter === 'all';
        if (filter !== 'all') countEl.textContent = 'Showing ' + items.length + ' ' + data.countNoun + (items.length === 1 ? '' : 's') + '.';
      }
    }
    if (emptyEl) emptyEl.classList.toggle('show', items.length === 0);
  }
  const chipsBox = document.getElementById(chipsId);
  if (chipsBox) chipsBox.addEventListener('click', e => {
    const b = e.target.closest('[data-filter], [data-rfilter]'); if (!b) return;
    filter = b.dataset.filter || b.dataset.rfilter;
    chipsBox.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c === b)));
    render();
    gaEvent('filter_use', { filter_value: filter, page: window.location.pathname });
  });
  const sortEl = sortId ? document.getElementById(sortId) : null;
  if (sortEl) sortEl.addEventListener('change', () => { sort = sortEl.value; render(); });
  // Design System 2026-11-21: sort pills (homepage Our Products) — same
  // values as the old <select>, wired the same way. Only one of the two
  // controls exists on a given page.
  const sortPills = document.getElementById('sortPills');
  if (sortPills) sortPills.addEventListener('click', e => {
    const b = e.target.closest('[data-sort]'); if (!b) return;
    sort = b.dataset.sort;
    sortPills.querySelectorAll('[data-sort]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    render();
  });
}
if (JB.page === 'home') {
  bindHomeRail('home-shop-data', 'prodGrid', 'prodChips', 'sortSelect', 'prodCount', { countMode: 'filtered', emptyId: 'prodEmpty' });
  bindHomeRail('home-free-data', 'resGrid', 'resChips', null, 'resCount', { countMode: 'featured', emptyId: 'resEmpty' });
}

/* ================= search results page ================= */
if (JB.page === 'search') {
  const q = new URLSearchParams(window.location.search).get('q') || '';
  const input = $('#searchPageInput');
  if (input) input.value = q;
  const box = $('#searchResults');
  function renderSearchResults(ms, query) {
    if (!box) return;
    if (!query.trim()) { box.innerHTML = '<p class="sec-sub">Type a word above to search books, free resources, games and articles.</p>'; return; }
    const results = runSearch(ms, query);
    if (!results.length) {
      box.innerHTML = '<p class="sec-sub">No matches for "' + query.replace(/</g, '&lt;') + '". Try "animals" or browse free printables.</p>';
      return;
    }
    const groups = ['Products', 'Free resources', 'Games', 'Articles', 'Recommended'];
    const byGroup = {};
    results.forEach(r => { (byGroup[r.type] = byGroup[r.type] || []).push(r); });
    let html = '';
    groups.forEach(g => {
      const items = byGroup[g] || [];
      if (!items.length) return;
      html += '<div class="sres-group"><h2>' + g + '</h2>';
      items.forEach(r => {
        html += '<div class="sres-item"><h3><a href="' + JB.root + r.url + '">' + r.title.replace(/</g, '&lt;') + '</a></h3>'
          + (r.snippet ? '<p>' + r.snippet.replace(/</g, '&lt;') + '</p>' : '') + '</div>';
      });
      html += '</div>';
    });
    box.innerHTML = html;
  }
  if (q.trim()) loadSearch().then(ms => renderSearchResults(ms, q));
  else renderSearchResults(null, '');
  const form = $('#searchPageForm');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const v = input.value.trim();
    if (v && !searchCounted) { searchCounted = true; gaEvent('search_use', { page: window.location.pathname }); }
    history.replaceState(null, '', v ? ('?q=' + encodeURIComponent(v)) : window.location.pathname);
    loadSearch().then(ms => renderSearchResults(ms, v));
  });
}

/* ================= bottom tab bar ================= */
function setActiveTab(name) {
  $$('.tabbar a[data-tab]').forEach(a => a.classList.toggle('on', a.dataset.tab === name));
}
$$('.tabbar a[data-tab]').forEach(a => {
  if (a.dataset.tab === 'search') return;
  a.addEventListener('click', () => setActiveTab(a.dataset.tab));
});
if (JB.page === 'home' && 'IntersectionObserver' in window) {
  const tabMap = { shop: 'products', free: 'free', games: 'games', blog: 'blog' };
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting && tabMap[en.target.id]) setActiveTab(tabMap[en.target.id]); });
  }, { rootMargin: '-40% 0px -55% 0px' });
  ['shop', 'free', 'games', 'blog'].forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
}
let kbTimer = null;
document.addEventListener('focusin', e => { if (e.target.matches('input,select,textarea')) document.body.classList.add('tab-hidden'); });
document.addEventListener('focusout', e => {
  if (e.target.matches('input,select,textarea')) {
    clearTimeout(kbTimer);
    kbTimer = setTimeout(() => { if (!document.activeElement || !document.activeElement.matches('input,select,textarea')) document.body.classList.remove('tab-hidden'); }, 150);
  }
});
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    if (window.visualViewport.height < window.innerHeight * 0.8) document.body.classList.add('tab-hidden');
    else if (!document.activeElement || !document.activeElement.matches('input,select,textarea')) document.body.classList.remove('tab-hidden');
  });
}

/* ================= newsletter (preview: validated, never submitted anywhere) ================= */
const nlForm = $('#nlForm');
if (nlForm) nlForm.addEventListener('submit', e => {
  e.preventDefault();
  const email = $('#nlEmail').value.trim();
  const note = $('#nlNote');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { note.textContent = 'Please enter a valid email address.'; return; }
  note.textContent = 'Thanks — this is a design preview, so the newsletter isn’t connected here and nothing was sent. On the live site, this form subscribes you to JoJo’s Blocks updates.';
  e.target.reset();
});

/* ================= Esc closes modal / overlay / suggestions ================= */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (modalBack && modalBack.classList.contains('open')) { closeModal(); return; }
    const so = $('#searchOverlay');
    if (so && so.classList.contains('open')) { closeSearchOverlay(); return; }
    closeSearchUI();
  }
  if (e.key === 'Tab' && modalBack && modalBack.classList.contains('open')) {
    const f = Array.from(modalBox.querySelectorAll('a[href],button:not([disabled]),input,select,[tabindex]:not([tabindex="-1"])')).filter(el => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* ================= hero carousel (2026-11-20, preview) ================= */
/* Auto-sliding + swipeable showcase in the hero. Auto-advances every ~3.5s,
   pauses on hover/focus/touch and when the tab is hidden, and never runs when
   the user prefers reduced motion. Dots, swipe (touch/pen, 50px) and arrow
   keys all jump slides and restart the timer. Design System 2026-11-21:
   every [data-carousel] on the page gets its own instance (the homepage
   Kids Books showcase reuses it); data-noauto disables auto-advance. */
(function () {
  var cars = document.querySelectorAll('[data-carousel]');
  if (!cars.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  Array.prototype.forEach.call(cars, function (car) {
  var slides = Array.prototype.slice.call(car.querySelectorAll('[data-slide]'));
  var dots = Array.prototype.slice.call(car.querySelectorAll('[data-dot]'));
  if (slides.length < 2) return;
  var noauto = car.hasAttribute('data-noauto');
  var DELAY = 3500, SWIPE = 50, cur = 0, timer = null, paused = false, sx = null, resumeT = null;
  function show(n, user) {
    cur = (n + slides.length) % slides.length;
    slides.forEach(function (s, i) {
      s.classList.toggle('is-active', i === cur);
      s.setAttribute('aria-hidden', String(i !== cur));
    });
    dots.forEach(function (d, i) {
      d.classList.toggle('is-active', i === cur);
      if (i === cur) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });
    if (user) restart();
  }
  function start() {
    if (reduce || paused || noauto) return;
    stop();
    timer = window.setInterval(function () { show(cur + 1); }, DELAY);
  }
  function stop() { if (timer) { window.clearInterval(timer); timer = null; } }
  function restart() { stop(); start(); }
  dots.forEach(function (d, i) { d.addEventListener('click', function () { show(i, true); }); });
  car.addEventListener('mouseenter', function () { paused = true; stop(); });
  car.addEventListener('mouseleave', function () { paused = false; start(); });
  car.addEventListener('focusin', function () { paused = true; stop(); });
  car.addEventListener('focusout', function () { paused = false; start(); });
  car.addEventListener('touchstart', function (e) {
    paused = true; stop();
    if (resumeT) { window.clearTimeout(resumeT); resumeT = null; }
    sx = e.changedTouches[0].clientX;
  }, { passive: true });
  car.addEventListener('touchend', function (e) {
    var swiped = false;
    if (sx !== null) {
      var dx = e.changedTouches[0].clientX - sx;
      sx = null;
      if (Math.abs(dx) > SWIPE) { show(cur + (dx < 0 ? 1 : -1), true); swiped = true; }
    }
    if (!swiped) resumeT = window.setTimeout(function () { paused = false; start(); }, 1000);
  }, { passive: true });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });
  car.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') show(cur - 1, true);
    else if (e.key === 'ArrowRight') show(cur + 1, true);
  });
  start();
  });
})();
