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
  $('#modalFmt').textContent = 'PDF · ' + p.pages + ' pages · Ages ' + p.ages;
  $('#modalTitle').textContent = p.title;
  $('#modalPrice').innerHTML = money(p.sale) + ' <s>' + money(p.price) + '</s>';
  $('#modalSave').textContent = (id === 'bundle')
    ? 'Save $5.97 vs the four books at regular prices ($18.96 vs $12.99).'
    : 'Save $' + (p.price - p.sale).toFixed(2) + ' vs the regular price.';
  $('#modalDesc').textContent = p.desc;
  $('#modalGet').innerHTML = '<li>' + p.pages + ' printable A4 pages</li><li>Ages ' + p.ages + '</li><li>A4 PDF — US buyers print on Letter</li><li>Personal &amp; family use</li>';
  $('#modalBuy').href = p.gum;
  $('#modalPage').href = JB.root + p.page;
  $('#modalPageLink').href = JB.root + p.page;
  $('#mstickyPrice').innerHTML = money(p.sale) + ' <s>' + money(p.price) + '</s>';
  $('#mstickyBuy').href = p.gum;
  $('#modalRelated').innerHTML = Object.keys(PRODUCTS).filter(k => k !== id && !PRODUCTS[k].kofi).map(k =>
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
document.addEventListener('click', e => {
  const d = e.target.closest('[data-detail]');
  if (d) { e.preventDefault(); openModal(d.dataset.detail); return; }
  const r = e.target.closest('[data-related]');
  if (r) { openModal(r.dataset.related); return; }
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
      const badge = it.badge ? '<span class="badge">' + it.badge + '</span>' : '';
      const price = it.salePrice ? '<div class="price-row"><span class="price">' + it.salePrice + '</span><s>' + it.price + '</s></div>' : '';
      const buy = it.gumroadUrl ? '<div class="actions"><a class="btn btn-accent" href="' + it.gumroadUrl + '" target="_blank" rel="noopener">Buy ' + it.salePrice + '</a></div>' : '';
      return '<article class="card" data-id="' + it.key + '" data-cat="' + it.filterKey + '" data-age-min="' + (it.ageMin ?? '') + '" data-age-max="' + (it.ageMax ?? '') + '" data-price="' + (it.salePriceNum ?? '') + '" data-pages="' + (it.pages || '') + '">'
        + '<div class="cover">' + badge + '<a href="' + JB.root + it.url + '" data-detail="' + it.key + '" aria-label="View ' + it.title.replace(/"/g, '&quot;') + ' details"><img src="' + it.thumb + '" alt="' + (it.coverAlt || it.title).replace(/"/g, '&quot;') + '" width="600" height="849" loading="lazy"></a></div>'
        + '<div class="body"><h3><a href="' + JB.root + it.url + '" data-detail="' + it.key + '">' + it.title + '</a></h3>'
        + '<p class="meta">' + (it.pages || '') + ' pages · ' + (it.ageLabel || '') + '</p>' + price + buy + '</div></article>';
    }
    if (kind === 'resources') {
      const thumb = it.thumb ? '<div class="rthumb"><img src="' + it.thumb + '" alt="' + it.title.replace(/"/g, '&quot;') + ' preview" loading="lazy"></div>' : '';
      return '<article class="res-item" data-cat="' + it.filterKey + '">' + thumb + '<div class="rbody"><span class="tag">' + it.tag + '</span><h3>' + it.title + '</h3><p>' + (it.desc || '') + '</p>'
        + '<a href="' + JB.root + it.url + '">View &amp; download →</a></div></article>';
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
    return '<article class="bcard"><div class="bcover"><img src="' + it.thumb + '" alt="' + it.title.replace(/"/g, '&quot;') + '" width="1200" height="675" loading="lazy"></div>'
      + '<div class="body"><span class="tag">' + it.tag + '</span><h3><a href="' + JB.root + it.url + '">' + it.title + '</a></h3><p>' + (it.desc || '') + '</p>'
      + '<a class="read" href="' + JB.root + it.url + '">Read article →</a></div></article>';
  }

/* ================= listing engine (query-string filters/sort/pagination) ================= */
const PAGE = (() => { try { return JSON.parse($('#page-data') ? $('#page-data').textContent : 'null'); } catch (e) { return null; } })();
if (PAGE) {
  const params = new URLSearchParams(window.location.search);
  const state = {
    filter: params.get('category') || params.get('filter') || 'all',
    age: params.get('age') || 'any',
    sort: params.get('sort') || 'featured',
    q: params.get('q') || '',
    topic: params.get('topic') || 'all',
    format: params.get('format') || 'all',
    price: params.get('price') || 'all',
    page: Math.max(1, parseInt(params.get('page') || '1', 10) || 1)
  };
  const grid = $('#listingGrid');
  const countEl = $('#pageCount');
  const emptyEl = $('#listingEmpty');
  const pagerEl = $('#pager');
  const loadMoreBtn = $('#loadMoreBtn');
  function visibleItems() {
    const q = normalize(state.q);
    let items = PAGE.items.filter(it => {
      if (state.filter !== 'all' && !PAGE.lockFilter && it.filterKey !== state.filter) return false;
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
    else if (state.sort === 'newest') items.sort((a, b) => String(b.dateAdded || '').localeCompare(String(a.dateAdded || '')));
    else items.sort((a, b) => (a.featuredRank || 99) - (b.featuredRank || 99));
    return items;
  }
  let renderedPages = 1;
  let viaLoadMore = false; // true after a Load-more click: render cumulatively
  function render() {
    const items = visibleItems();
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / PAGE.pageSize));
    const page = Math.min(state.page, pages);
    const shown = viaLoadMore ? items.slice(0, page * PAGE.pageSize) : items.slice((page - 1) * PAGE.pageSize, page * PAGE.pageSize);
    renderedPages = page;
    if (grid) grid.innerHTML = shown.map(it => cardHtml(PAGE.kind, it)).join('');
    if (emptyEl) {
      if (!total) {
        emptyEl.textContent = state.q ? ('No matches for "' + state.q.trim() + '". Try "animals" or browse free printables.') : 'No items match the selected filters.';
        emptyEl.classList.add('show');
      } else emptyEl.classList.remove('show');
    }
    const active = state.filter !== 'all' || state.age !== 'any' || !!state.q || state.topic !== 'all' || state.format !== 'all' || state.price !== 'all' || state.page > 1;
    if (countEl) {
      countEl.hidden = !active;
      if (active) countEl.textContent = 'Showing ' + total + ' ' + PAGE.countNoun + (total === 1 ? '' : 's') + '.';
    }
    if (pagerEl) {
      if (pages <= 1) { pagerEl.innerHTML = ''; }
      else {
        let h = '';
        for (let p = 1; p <= pages; p++) h += (p === page) ? '<span class="cur" aria-current="page">' + p + '</span>' : '<a href="' + pageUrl(p) + '">' + p + '</a>';
        pagerEl.innerHTML = h;
      }
    }
    if (loadMoreBtn) loadMoreBtn.hidden = !(page < pages);
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
    if (state.age !== 'any') chips.push({ k: 'age', label: 'Age ' + state.age });
    if (state.topic !== 'all') chips.push({ k: 'topic', label: state.topic });
    if (state.format !== 'all') chips.push({ k: 'format', label: state.format });
    if (state.price !== 'all') chips.push({ k: 'price', label: state.price });
    if (state.q) chips.push({ k: 'q', label: '"' + state.q + '"' });
    box.innerHTML = chips.map(c => '<span class="af-chip">' + c.label.replace(/</g, '&lt;') + '<button type="button" data-clear="' + c.k + '" aria-label="Remove filter ' + c.label.replace(/"/g, '') + '">✕</button></span>').join('');
    box.querySelectorAll('[data-clear]').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.clear;
      if (k === 'filter') state.filter = 'all';
      if (k === 'age') state.age = 'any';
      if (k === 'topic') state.topic = 'all';
      if (k === 'format') state.format = 'all';
      if (k === 'price') state.price = 'all';
      if (k === 'q') state.q = '';
      state.page = 1; viaLoadMore = false; syncUrl(); render();
    }));
  }
  function syncControls() {
    $$('#listingChips .chip[data-filter]').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.filter === state.filter)));
    const ageRow = $('#ageChips');
    if (ageRow) $$('#ageChips .chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.age === state.age)));
    const sort = $('#sortSelect'); if (sort) sort.value = state.sort;
    const topic = $('#facetTopic'); if (topic) topic.value = state.topic;
    const format = $('#facetFormat'); if (format) format.value = state.format;
    const price = $('#facetPrice'); if (price) price.value = state.price;
  }
  const chipsBox = $('#listingChips');
  if (chipsBox) chipsBox.addEventListener('click', e => {
    const b = e.target.closest('[data-filter]'); if (!b) return;
    state.filter = b.dataset.filter; state.page = 1; viaLoadMore = false; syncUrl(); render();
  });
  const ageBox = $('#ageChips');
  if (ageBox) ageBox.addEventListener('click', e => {
    const b = e.target.closest('[data-age]'); if (!b) return;
    state.age = b.dataset.age; state.page = 1; viaLoadMore = false; syncUrl(); render();
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
  });
  const sortEl = sortId ? document.getElementById(sortId) : null;
  if (sortEl) sortEl.addEventListener('change', () => { sort = sortEl.value; render(); });
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
  const tabMap = { shop: 'shop', free: 'free', games: 'games', blog: 'blog' };
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
