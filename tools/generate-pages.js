#!/usr/bin/env node
/* JoJo's Blocks — page generator (dependency-free, Node.js only).
 *
 * Reads data/products.json (the ONE central product data source) and
 * data/navigation.json (navigation + category registry) and renders
 * the website's generated files from templates:
 *   - index.html          (homepage, from templates/index.html)
 *   - books/<slug>.html   (one per published product, from templates/book.html)
 *   - free-printables/index.html (free resources page, from
 *     templates/free-resources.html + data/free-resources.json)
 *   - blog/index.html     (blog listing, from templates/blog-index.html
 *     + data/articles.json)
 *   - blog/<slug>.html    (one per published article, from
 *     templates/blog-article.html + data/articles.json)
 *   - <section>/index.html (one per section landing page, from
 *     templates/section.html + data/sections.json — Part 3)
 *   - free-resources/<slug>/index.html (one per free resource, from
 *     templates/resource.html + data/resources.json — Part 5)
 *   - privacy.html, terms.html, 404.html, refund-policy.html
 *                         (from templates/<name>.html)
 *   - sitemap.xml         (static pages + published products + blog
 *     + section landing pages)
 *   - llms.txt            (product list for AI systems + blog articles
 *     + section landing pages)
 *   - js/products.js      (homepage card/modal data, same values as data/products.json)
 *
 * Every page shares ONE header and ONE footer, from
 * templates/partials/header.html and templates/partials/footer.html.
 * The navigation menu and footer links are built from
 * data/navigation.json, so a new category is activated by editing
 * that one file (plus its content) — never by editing five pages.
 *
 * Usage (run from the repository root):
 *   node tools/generate-pages.js --only <slug>   regenerate ONE book page
 *   node tools/generate-pages.js --only article:<slug>
 *                                            regenerate ONE article page (+ listing)
 *   node tools/generate-pages.js --all           regenerate everything above
 *   node tools/generate-pages.js --check         dry run: print what would change, write nothing
 *
 * Safety rules:
 *   - Never deletes a file. Never touches css/, js/site.js, js/main.js
 *     or assets/. The generated outputs above are overwritten in place
 *     from their templates — never edit a generated file by hand.
 *   - Draft products (status "draft") are skipped: no page, no sitemap entry,
 *     no entry in js/products.js.
 *   - js/products.js is GENERATED from the same data. Never edit it by hand:
 *     edit data/products.json and re-run this script.
 *   - A category with status "soon" in data/navigation.json is rendered
 *     as plain text, never as a link — no visitor can land on an empty
 *     category page. The generator FAILS if a live item has no href or
 *     a soon item has one.
 *   - refund-policy.html is generated but is a DRAFT (unlinked from the
 *     footer) until the owner approves it and it gets qualified legal
 *     review. It has been listed in the sitemap since Part 4.
 *     404.html is never in the sitemap.
 *   - Free resources live in data/free-resources.json and are rendered by
 *     renderFreePage() into free-printables/index.html. The PDF itself must
 *     already exist under assets/free-resources/ and its byte size must match
 *     the data file, or the build fails — so a paid PDF can never be
 *     published as a free download by mistake.
 *   - Blog articles live in data/articles.json and are rendered by
 *     renderArticle() into blog/<slug>.html (+ blog/index.html listing).
 *     The article meta description must be 120-160 characters, the
 *     category must be one of the fixed list in data/categories.json
 *     (blog.categories), related articles must exist, and inline links
 *     must point at a page this generator writes — or the build fails.
 *   - Section landing pages live in data/sections.json and are rendered
 *     by renderSectionPage() into <section>/index.html (Part 3). A
 *     category with status "soon" renders as a Coming Soon card with no
 *     link and no download/buy/play button. A live category must have a
 *     real href. Section meta descriptions must be 120-160 characters.
 *     New sections must be added to writtenFiles + renderSitemap, or
 *     the nav validation / sitemap will fail or silently omit them.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_FILE = path.join(ROOT, "data", "products.json");
const NAV_FILE = path.join(ROOT, "data", "navigation.json");
const CATEGORIES_FILE = path.join(ROOT, "data", "categories.json");
const FREE_DATA_FILE = path.join(ROOT, "data", "free-resources.json");
const FREE_TEMPLATE = path.join(ROOT, "templates", "free-resources.html");
const ARTICLES_FILE = path.join(ROOT, "data", "articles.json");
const ARTICLE_TEMPLATE = path.join(ROOT, "templates", "blog-article.html");
const BLOG_INDEX_TEMPLATE = path.join(ROOT, "templates", "blog-index.html");
const SECTIONS_FILE = path.join(ROOT, "data", "sections.json");
const SECTION_TEMPLATE = path.join(ROOT, "templates", "section.html");
const RESOURCES_FILE = path.join(ROOT, "data", "resources.json");
const RESOURCE_TEMPLATE = path.join(ROOT, "templates", "resource.html");
const TEMPLATE_FILE = path.join(ROOT, "templates", "book.html");
const TEMPLATES_DIR = path.join(ROOT, "templates");
const PARTIALS_DIR = path.join(TEMPLATES_DIR, "partials");

function fail(msg) {
  console.error("generate-pages: ERROR: " + msg);
  process.exit(1);
}

function escAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escText(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function priceAmount(price) {
  // "$3.99" -> "3.99" (for product:price:amount and JSON-LD)
  return String(price).replace(/^\$/, "");
}

function cardMeta(p) {
  const bits = [];
  if (p.age) bits.push(p.age);
  if (p.pages) bits.push(p.pages + " pages");
  bits.push(p.format);
  return bits.join(" · ");
}

function licenseText(p) {
  // Data value -> the short license line shown on book pages and in modals.
  // "personal-family" is the owner-approved default (2026-11-14).
  // Single-Classroom Use is a future add-on, not a data value yet.
  if (p.license === "personal-family") return "Personal & family use";
  return "See Terms & Conditions";
}

function discountPct(price, salePrice) {
  // Percentage computed from the two prices, never hardcoded.
  if (!price || !salePrice || salePrice === price) return 0;
  const was = parseFloat(String(price).replace(/[^0-9.]/g, ""));
  const now = parseFloat(String(salePrice).replace(/[^0-9.]/g, ""));
  if (!was || !now || now >= was) return 0;
  return Math.round((1 - now / was) * 100);
}

function priceBlock(p, code) {
  // Inner HTML for the price display: crossed-out original, discount
  // badge, large final price, and the code line. A product with no
  // sale price shows its plain price with no discount claim.
  // The wrapper <p class="... price-block"> lives in the template.
  const pct = discountPct(p.price, p.salePrice);
  if (!pct) return '<span class="price-now">' + escText(p.price) + "</span>";
  return '<span class="price-was">' + escText(p.price) + "</span>" +
    ' <span class="price-off">' + pct + "% OFF</span>" +
    '<span class="price-now">' + escText(p.salePrice) + "</span>" +
    '<span class="price-code">' + escText(code) + " applied at checkout</span>";
}

/* ---- Shared header + footer (Phase 1C) -------------------------------
 * One header and one footer for every page, built from the partials
 * plus data/navigation.json. `prefix` is "" for root pages and "../"
 * for books/ pages; `isHome` is true only when rendering index.html,
 * where same-page links stay anchors (#books) instead of reloading
 * the homepage (index.html#books). */
function hrefFor(href, prefix, isHome) {
  if (!href) return href;
  if (/^(https?:|mailto:|#)/.test(href)) return href;
  if (href === "index.html") return isHome ? "#top" : prefix + "index.html";
  if (href.startsWith("index.html#")) return isHome ? href.slice("index.html".length) : prefix + href;
  return prefix + href;
}

function navItemsHTML(prefix, isHome, currentId) {
  const nav = NAV;
  const lines = [];
  for (const item of nav.top) {
    if (item.status === "menu") {
      // Dropdown menu: the button label comes from the menu item itself
      // (Part 3 — was hardcoded "Explore"). Live children link out,
      // soon children are text.
      // Current-page state (15 Nov 2026 UI/UX pass): when the page
      // being rendered is this menu's section (e.g. the Products
      // landing page) or one of its children, the toggle gets
      // .is-active and the matching child link gets aria-current.
      let menuActive = item.id === currentId;
      const kids = nav.explore.map((c) => {
        if (c.status === "live") {
          if (!c.href) fail("navigation.json: live category '" + c.id + "' has no href");
          const current = c.id === currentId ? ' aria-current="page"' : "";
          if (c.id === currentId) menuActive = true;
          return '        <li><a href="' + escAttr(hrefFor(c.href, prefix, isHome)) + '"' + current + '><strong>' + escText(c.label) + '</strong><small>' + escText(c.description || "") + '</small></a></li>';
        }
        if (c.href) fail("navigation.json: soon category '" + c.id + "' must not have an href (it has no content yet)");
        return '        <li class="dropdown-soon"><strong>' + escText(c.label) + ' <span class="soon-pill">Soon</span></strong><small>' + escText(c.description || "") + '</small></li>';
      }).join("\n");
      lines.push('        <li class="has-dropdown">');
      lines.push('          <button class="dropdown-toggle' + (menuActive ? " is-active" : "") + '" id="explore-toggle" aria-expanded="false" aria-haspopup="true" aria-controls="explore-menu">' + escText(item.label) + ' <span class="chev" aria-hidden="true">⌄</span></button>');
      lines.push('          <ul class="dropdown-menu" id="explore-menu">');
      lines.push(kids);
      lines.push('          </ul>');
      lines.push('        </li>');
      continue;
    }
    if (item.status === "soon") {
      if (item.href) fail("navigation.json: soon item '" + item.id + "' must not have an href (it has no content yet)");
      lines.push('        <li><span class="nav-soon">' + escText(item.label) + ' <span class="soon-pill">Soon</span></span></li>');
      continue;
    }
    if (!item.href) fail("navigation.json: live item '" + item.id + "' has no href");
    // Current-page state (15 Nov 2026 UI/UX pass): the nav link for
    // the page being rendered carries aria-current="page" and
    // .is-active, so a visitor can tell from the header where they are.
    const current = item.id === currentId ? ' aria-current="page" class="is-active"' : "";
    lines.push('        <li><a href="' + escAttr(hrefFor(item.href, prefix, isHome)) + '"' + current + '>' + escText(item.label) + '</a></li>');
  }
  // Contact is the header's compact button (mailto — direct, no dead page).
  const contact = nav.contact;
  lines.push('        <li><a class="btn btn-primary btn-sm" href="' + escAttr(contact.href) + '">' + escText(contact.label) + '</a></li>');
  return lines.join("\n") + "\n";
}

function footerLinksHTML(prefix, isHome) {
  const nav = NAV;
  const lines = [];
  for (const link of nav.footer.links) {
    lines.push('        <a href="' + escAttr(hrefFor(link.href, prefix, isHome)) + '">' + escText(link.label) + '</a>');
  }
  // Refund Policy is deliberately NOT linked here: it is a draft until
  // the owner approves it and it gets qualified legal review.
  // Pinterest uses the official "P" badge (simple-icons path) with an
  // accessible label; Instagram stays unlinked (it shows the owner's
  // first name) until the owner decides otherwise.
  lines.push('        <a class="social-link" href="' + escAttr(nav.pinterestUrl) + '" target="_blank" rel="noopener" aria-label="JoJo\u2019s Blocks on Pinterest">' + PINTEREST_ICON + '<span>Pinterest</span></a>');
  return lines.join("\n") + "\n";
}

// Official Pinterest "P" badge (simple-icons Pinterest glyph, CC0).
// Inlined so the footer needs no extra asset; colored via CSS.
const PINTEREST_ICON = '<svg class="social-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/></svg>';

function chromeFor(prefix, isHome, currentId) {
  const headerTpl = fs.readFileSync(path.join(PARTIALS_DIR, "header.html"), "utf8");
  const footerTpl = fs.readFileSync(path.join(PARTIALS_DIR, "footer.html"), "utf8");
  const homeHref = isHome ? "#top" : prefix + "index.html";
  const header = headerTpl
    .replaceAll("{{PREFIX}}", prefix)
    .replaceAll("{{HOME_HREF}}", homeHref)
    .replaceAll("{{NAV_ITEMS}}", navItemsHTML(prefix, isHome, currentId || null));
  const footer = footerTpl
    .replaceAll("{{PREFIX}}", prefix)
    .replaceAll("{{HOME_HREF}}", homeHref)
    .replaceAll("{{FOOTER_BLURB}}", escText(NAV.footer.blurb))
    .replaceAll("{{FOOTER_LINKS}}", footerLinksHTML(prefix, isHome));
  for (const [name, out] of [["header", header], ["footer", footer]]) {
    const leftover = out.match(/\{\{[A-Z_]+\}\}/);
    if (leftover) fail("unreplaced token " + leftover[0] + " in " + name + " partial");
  }
  return { header, footer };
}

function renderStaticPage(templateName, outName, prefix, isHome) {
  const template = fs.readFileSync(path.join(TEMPLATES_DIR, templateName), "utf8");
  const chrome = chromeFor(prefix, isHome);
  const out = template
    .replaceAll("{{HEADER}}", chrome.header)
    .replaceAll("{{FOOTER}}", chrome.footer);
  const leftover = out.match(/\{\{[A-Z_]+\}\}/);
  if (leftover) fail("unreplaced token " + leftover[0] + " while rendering " + outName);
  return out;
}

/* Part 3 — homepage (templates/index.html) with the latest articles
 * injected. The template carries a {{LATEST_ARTICLES}} placeholder in
 * its "Latest from the blog" section; the generator fills it with the
 * three newest published articles (same card pattern as the blog
 * listing). If the placeholder is absent, the homepage renders without
 * it — the leftover-token check still passes. */
function renderHome(articles) {
  const template = fs.readFileSync(path.join(TEMPLATES_DIR, "index.html"), "utf8");
  const site = DATA.site;
  const chrome = chromeFor("", true, "home");
  const sorted = [...articles].sort((x, y) => (y.datePublished < x.datePublished ? -1 : y.datePublished > x.datePublished ? 1 : x.slug.localeCompare(y.slug))).slice(0, 3);
  const cards = sorted.map((a) =>
    '<article class="blog-card"><a class="blog-card-cover" href="blog/' + a.slug + '.html"><img src="' + a.coverImage + '" alt="' + escAttr(a.coverAlt) + '" width="1200" height="630" loading="lazy"></a>' +
    '<div class="blog-card-body"><span class="eyebrow">' + escText(a.category) + "</span>" +
    '<h2><a href="blog/' + a.slug + '.html">' + escText(a.title) + "</a></h2>" +
    "<p>" + escText(a.excerpt) + "</p>" +
    '<p class="card-meta"><time datetime="' + a.datePublished + '">' + a.datePublished + "</time> · " + readingTime(a) + "</p></div></article>"
  ).join("\n");
  const out = template
    .replaceAll("{{HEADER}}", chrome.header)
    .replaceAll("{{FOOTER}}", chrome.footer)
    .replaceAll("{{LATEST_ARTICLES}}", cards);
  const leftover = out.match(/\{\{[A-Z_]+\}\}/);
  if (leftover) fail("unreplaced token " + leftover[0] + " while rendering index.html");
  return out;
}

function renderBook(p, all) {
  const template = fs.readFileSync(TEMPLATE_FILE, "utf8");
  const site = DATA.site;
  const canonical = site.domain + "/books/" + p.slug + ".html";
  const ogImage = site.domain + "/" + p.cover;
  const others = all.filter((o) => o.slug !== p.slug && o.status === "published");
  // The template already contains the "Back to the full collection" paragraph
  // after this token, so this block is ONLY the links paragraph.
  const alsoLikeBlock =
    "<p>" +
    others
      .map(
        (o) =>
          '<a href="' + o.slug + '.html">' + escText(o.title) + "</a>"
      )
      .join(" · ") +
    "</p>";
  const featuresLi = (p.features || [])
    .map((f) => "<li>" + escText(f) + "</li>")
    .join("");
  // Book pages share the site header/footer (prefix "../").
  const chrome = chromeFor("../", false);
  const out = template
    .replaceAll("{{HEADER}}", chrome.header)
    .replaceAll("{{FOOTER}}", chrome.footer)
    .replaceAll("{{TITLE}}", escText(p.title))
    .replaceAll("{{META_DESCRIPTION}}", escAttr(p.seo.metaDescription))
    .replaceAll("{{CANONICAL_URL}}", canonical)
    .replaceAll("{{SEO_TITLE}}", escAttr(p.seo.seoTitle))
    .replaceAll("{{OG_IMAGE_URL}}", ogImage)
    .replaceAll("{{COVER_REL_PATH}}", "../" + p.cover)
    .replaceAll("{{COVER_WIDTH}}", String(p.coverWidth))
    .replaceAll("{{COVER_HEIGHT}}", String(p.coverHeight))
    .replaceAll("{{COVER_ALT}}", escAttr(p.coverAlt))
    .replaceAll("{{PRICE_AMOUNT}}", priceAmount(p.price))
    .replaceAll("{{PRICE_BLOCK}}", priceBlock(p, DATA.site.discountCode))
    .replaceAll("{{EYEBROW}}", escText(p.slot + " · " + p.theme))
    .replaceAll("{{CARD_META}}", escText(cardMeta(p)))
    .replaceAll("{{DESCRIPTION}}", escText(p.description))
    .replaceAll("{{FEATURES_LI}}", featuresLi)
    .replaceAll("{{GUMROAD_URL}}", escAttr(p.gumroadUrl))
    .replaceAll("{{LICENSE_TEXT}}", escText(licenseText(p)))
    .replaceAll("{{SLUG}}", p.slug)
    .replaceAll("{{ALSO_LIKE_LINKS}}", alsoLikeBlock);
  const leftover = out.match(/\{\{[A-Z_]+\}\}/);
  if (leftover) fail("unreplaced token " + leftover[0] + " while rendering " + p.slug);
  return out;
}

function productCardHTML(p, prefix) {
  // Server-rendered product card for the free resources page, mirroring
  // the homepage card in js/main.js (same classes, same data) — but
  // without the "reveal" class (main.js is homepage-only, so a reveal
  // card would stay invisible) and with a plain "View Book" link instead
  // of the modal button (the modal lives in main.js too).
  const featuresLi = (p.features || [])
    .map((f) => "<li>" + escText(f) + "</li>")
    .join("");
  return '<article class="card">' +
    '<div class="card-cover"><img src="' + escAttr(prefix + p.cover) + '" alt="' + escAttr(p.coverAlt) + '" loading="lazy" width="600" height="849">' +
    '<span class="card-badge">' + escText(p.slot) + '</span></div>' +
    '<div class="card-body">' +
    '<h3>' + escText(p.title) + '</h3>' +
    '<p class="card-theme">' + escText(p.theme) + '</p>' +
    '<p>' + escText(p.description) + '</p>' +
    '<p class="card-meta">' + escText(cardMeta(p)) + '</p>' +
    '<p class="card-price price-block">' + priceBlock(p, DATA.site.discountCode) + '</p>' +
    '<ul class="card-features">' + featuresLi + '</ul>' +
    '<div class="card-actions">' +
    '<a class="btn btn-outline" href="' + escAttr(prefix + "books/" + p.slug + ".html") + '">View Book</a>' +
    '<a class="btn btn-primary" href="' + escAttr(p.gumroadUrl) + '" target="_blank" rel="noopener" data-book="' + escAttr(p.slug) + '" data-location="free-resources">Buy Now on Gumroad</a>' +
    '</div>' +
    '</div>' +
    '</article>';
}

function renderFreePage(free, published) {
  const template = fs.readFileSync(FREE_TEMPLATE, "utf8");
  const site = DATA.site;
  const prefix = "../";
  const canonical = site.domain + "/free-printables/";
  const pdfRel = prefix + free.file;
  const whatsInside = (free.contents || []).map((c) =>
    '<article class="feature"><div class="icon icon-mint" aria-hidden="true">' + escText(c.icon) + '</div><h3>' + escText(c.title) + '</h3><p>' + escText(c.text) + '</p><p class="card-meta">' + escText(c.book) + '</p></article>'
  ).join("\n        ");
  const printSteps = (free.printSteps || []).map((s, i) =>
    '<article class="step"><div class="step-num">' + (i + 1) + '</div><h3>' + escText(s.title) + '</h3><p>' + escText(s.text) + '</p></article>'
  ).join("\n        ");
  const licenseLi = (free.license || []).map((l) => "<li>" + escText(l) + "</li>").join("");
  // The FAQ uses native <details>/<summary> (no JavaScript): the homepage
  // accordion lives in js/main.js, which this page does not load.
  const faqItems = (free.faqs || []).map((f) =>
    '<details class="faq-item"><summary class="faq-q">' + escText(f.q) + '<span class="chev" aria-hidden="true">⌄</span></summary><div class="faq-a"><p>' + escText(f.a) + '</p></div></details>'
  ).join("\n        ");
  const faqJsonLd = '<script type="application/ld+json">\n' + JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": (free.faqs || []).map((f) => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  }, null, 2) + '\n</script>';
  const cards = published.map((p) => productCardHTML(p, prefix)).join("\n        ");
  const chrome = chromeFor(prefix, false, "free-resources");
  const out = template
    .replaceAll("{{HEADER}}", chrome.header)
    .replaceAll("{{FOOTER}}", chrome.footer)
    .replaceAll("{{SEO_TITLE}}", escAttr(free.seoTitle))
    .replaceAll("{{META_DESCRIPTION}}", escAttr(free.metaDescription))
    .replaceAll("{{CANONICAL_URL}}", canonical)
    .replaceAll("{{OG_IMAGE_URL}}", site.domain + "/assets/og-home.jpg")
    .replaceAll("{{HERO_HEADING}}", escText(free.heroHeading))
    .replaceAll("{{HERO_INTRO}}", escText(free.heroIntro))
    .replaceAll("{{PDF_REL_PATH}}", escAttr(pdfRel))
    .replaceAll("{{PAGES}}", String(free.pages))
    .replaceAll("{{FORMAT}}", escText(free.format))
    .replaceAll("{{AGES}}", escText(free.ages))
    .replaceAll("{{FILE_SIZE}}", escText(free.fileSize))
    .replaceAll("{{WHATS_INSIDE}}", whatsInside)
    .replaceAll("{{PRINT_STEPS}}", printSteps)
    .replaceAll("{{LICENSE_LI}}", licenseLi)
    .replaceAll("{{PRODUCT_CARDS}}", cards)
    .replaceAll("{{FAQ_ITEMS}}", faqItems)
    .replaceAll("{{FAQ_JSONLD}}", faqJsonLd)
    .replaceAll("{{BREADCRUMB_JSONLD}}", breadcrumbJsonLd([
      { name: "Home", url: site.domain + "/" },
      { name: "Free Printables", url: canonical },
    ]));
  const leftover = out.match(/\{\{[A-Z_]+\}\}/);
  if (leftover) fail("unreplaced token " + leftover[0] + " while rendering free-printables");
  return out;
}

// ---------- Blog articles (data/articles.json) ----------
// Content blocks are structured data, not raw HTML: lead, h2, h3, p, ul,
// cta. Paragraph and list text may contain inline links as [label](/path);
// the href must point at a page this generator writes. US English only.
function inlineLinks(text) {
  const esc = escText(text);
  return esc.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, href) =>
    '<a href="' + escAttr(href) + '">' + label + "</a>");
}

function articleWords(a) {
  let n = 0;
  for (const b of a.content || []) {
    if (b.text) n += b.text.split(/\s+/).filter(Boolean).length;
    if (b.items) for (const it of b.items) n += it.split(/\s+/).filter(Boolean).length;
    if (b.links) for (const l of b.links) n += l.label.split(/\s+/).filter(Boolean).length;
  }
  return n;
}

function readingTime(a) {
  const mins = Math.max(1, Math.ceil(articleWords(a) / 200));
  return mins + " min read";
}

function renderArticleContent(a) {
  const parts = [];
  for (const b of a.content || []) {
    if (b.t === "lead") parts.push('<p class="lead">' + inlineLinks(b.text) + "</p>");
    else if (b.t === "h2") parts.push("<h2>" + escText(b.text) + "</h2>");
    else if (b.t === "h3") parts.push("<h3>" + escText(b.text) + "</h3>");
    else if (b.t === "p") parts.push("<p>" + inlineLinks(b.text) + "</p>");
    else if (b.t === "ul") parts.push("<ul>" + b.items.map((it) => "<li>" + inlineLinks(it) + "</li>").join("") + "</ul>");
    else if (b.t === "cta") {
      const links = (b.links || []).map((l) =>
        '<a class="btn ' + (l.primary ? "btn-primary" : "btn-outline") + '" href="' + escAttr(l.href) + '">' + escText(l.label) + "</a>"
      ).join("\n          ");
      parts.push('<div class="callout"><h2>' + escText(b.title) + "</h2><p>" + inlineLinks(b.text) + '</p><div class="callout-actions">\n          ' + links + "\n        </div></div>");
    } else fail("article " + a.slug + ": unknown content block type: " + b.t);
  }
  return parts.join("\n    ");
}

function faqItemsHTML(faqs) {
  return (faqs || []).map((f) =>
    '<details class="faq-item"><summary class="faq-q">' + escText(f.q) + '<span class="chev" aria-hidden="true">⌄</span></summary><div class="faq-a"><p>' + escText(f.a) + "</p></div></details>"
  ).join("\n        ");
}

function faqJsonLdScript(faqs) {
  if (!faqs || !faqs.length) return "";
  return '<script type="application/ld+json">\n' + JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((f) => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  }, null, 2) + "\n</script>";
}

function articleJsonLd(a, ogImage) {
  return '<script type="application/ld+json">\n' + JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": a.title,
    "description": a.metaDescription,
    "image": ogImage,
    "datePublished": a.datePublished,
    "dateModified": a.datePublished,
    "author": { "@type": "Organization", "name": "JoJo's Blocks" },
    "publisher": { "@type": "Organization", "name": "JoJo's Blocks", "logo": { "@type": "ImageObject", "url": DATA.site.domain + "/assets/profile-logo.jpg" } }
  }, null, 2) + "\n</script>";
}

function breadcrumbJsonLd(items) {
  return '<script type="application/ld+json">\n' + JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((it, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": it.name,
      "item": it.url
    }))
  }, null, 2) + "\n</script>";
}

function renderArticle(a, all) {
  const template = fs.readFileSync(ARTICLE_TEMPLATE, "utf8");
  const site = DATA.site;
  const prefix = "../";
  const canonical = site.domain + "/blog/" + a.slug + ".html";
  const ogImage = site.domain + "/" + a.coverImage;
  const related = (a.relatedArticles || []).map((slug) => all.find((x) => x.slug === slug)).filter(Boolean);
  const relatedSection = related.length
    ? '<section class="section section-alt" aria-label="Related articles">\n    <div class="wrap">\n      <h2>Related articles</h2>\n      <ul class="related-list">\n' +
      related.map((r) => '        <li><a href="' + r.slug + '.html">' + escText(r.title) + "</a></li>").join("\n") +
      "\n      </ul>\n    </div>\n  </section>"
    : "";
  // FAQ + sources are appended after the content blocks (same pattern as
  // the free page: visible text first, JSON-LD built from the same data).
  let content = renderArticleContent(a);
  if (a.faqs && a.faqs.length) {
    content += '\n    <h2>Frequently asked questions</h2>\n    <div class="faq">\n        ' + faqItemsHTML(a.faqs) + "\n    </div>";
  }
  if (a.sources && a.sources.length) {
    content += '\n    <section class="article-sources"><h2>Sources</h2><ul>' +
      a.sources.map((s) => s.href
        ? '<li><a href="' + escAttr(s.href) + '" target="_blank" rel="noopener">' + escText(s.text) + "</a></li>"
        : "<li>" + escText(s.text) + "</li>").join("") +
      "</ul></section>";
  }
  const chrome = chromeFor(prefix, false, "blog");
  const out = template
    .replaceAll("{{HEADER}}", chrome.header)
    .replaceAll("{{FOOTER}}", chrome.footer)
    .replaceAll("{{TITLE}}", escText(a.title))
    .replaceAll("{{SEO_TITLE}}", escAttr(a.seoTitle))
    .replaceAll("{{META_DESCRIPTION}}", escAttr(a.metaDescription))
    .replaceAll("{{CANONICAL_URL}}", canonical)
    .replaceAll("{{OG_IMAGE_URL}}", ogImage)
    .replaceAll("{{COVER_IMAGE}}", escAttr(prefix + a.coverImage))
    .replaceAll("{{COVER_ALT}}", escAttr(a.coverAlt))
    .replaceAll("{{DATE_PUBLISHED}}", a.datePublished)
    .replaceAll("{{READING_TIME}}", readingTime(a))
    .replaceAll("{{CATEGORIES}}", escText(a.category))
    .replaceAll("{{TAGS}}", escText((a.tags || []).join(", ")))
    .replaceAll("{{CONTENT_HTML}}", content)
    .replaceAll("{{RELATED_SECTION}}", relatedSection)
    .replaceAll("{{ARTICLE_JSONLD}}", articleJsonLd(a, ogImage))
    .replaceAll("{{BREADCRUMB_JSONLD}}", breadcrumbJsonLd([
      { name: "Home", url: site.domain + "/" },
      { name: "Blog", url: site.domain + "/blog/" },
      { name: a.title, url: canonical },
    ]))
    .replaceAll("{{FAQ_JSONLD}}", faqJsonLdScript(a.faqs));
  const leftover = out.match(/\{\{[A-Z_]+\}\}/);
  if (leftover) fail("unreplaced token " + leftover[0] + " while rendering blog/" + a.slug);
  return out;
}

/* Part 3 — blog listing with a category browse + filter. Each card
 * carries data-category so site.js can filter client-side. Categories
 * with no articles yet render as disabled "Soon" chips (no fake
 * articles, no dead links). The fixed category list comes from
 * data/categories.json (the blog taxonomy entry). */
function renderBlogIndex(articles, blogHome, blogCategories) {
  const template = fs.readFileSync(BLOG_INDEX_TEMPLATE, "utf8");
  const site = DATA.site;
  const sorted = [...articles].sort((x, y) => (y.datePublished < x.datePublished ? -1 : y.datePublished > x.datePublished ? 1 : x.slug.localeCompare(y.slug)));
  const cards = sorted.map((a) =>
    '<article class="blog-card filter-item" data-category="' + escAttr(a.category) + '"><a class="blog-card-cover" href="' + a.slug + '.html"><img src="../' + a.coverImage + '" alt="' + escAttr(a.coverAlt) + '" width="1200" height="630" loading="lazy"></a>' +
    '<div class="blog-card-body"><span class="eyebrow">' + escText(a.category) + "</span>" +
    '<h2><a href="' + a.slug + '.html">' + escText(a.title) + "</a></h2>" +
    "<p>" + escText(a.excerpt) + "</p>" +
    '<p class="card-meta"><time datetime="' + a.datePublished + '">' + a.datePublished + "</time> · " + readingTime(a) + "</p></div></article>"
  ).join("\n");
  const counts = {};
  for (const a of articles) counts[a.category] = (counts[a.category] || 0) + 1;
  const filterChips = '<button type="button" class="chip is-active" data-filter="all" aria-pressed="true">All <span class="chip-count">' + articles.length + "</span></button>" +
    (blogCategories || []).map((cat) => {
      const n = counts[cat] || 0;
      if (n > 0) return '<button type="button" class="chip" data-filter="' + escAttr(cat) + '" aria-pressed="false">' + escText(cat) + ' <span class="chip-count">' + n + "</span></button>";
      return '<span class="chip is-soon" aria-disabled="true">' + escText(cat) + ' <span class="soon-pill">Soon</span></span>';
    }).join("");
  const categoryFilter = '<div class="filter-bar" role="group" aria-label="Filter articles by category">' + filterChips + "</div>" +
    '<p class="filter-empty" hidden>No articles in this category yet — check back soon.</p>';
  const chrome = chromeFor("../", false, "blog");
  const out = template
    .replaceAll("{{HEADER}}", chrome.header)
    .replaceAll("{{FOOTER}}", chrome.footer)
    .replaceAll("{{SEO_TITLE}}", escAttr(blogHome.seoTitle))
    .replaceAll("{{META_DESCRIPTION}}", escAttr(blogHome.metaDescription))
    .replaceAll("{{CANONICAL_URL}}", site.domain + "/blog/")
    .replaceAll("{{ARTICLE_CARDS}}", cards)
    .replaceAll("{{CATEGORY_FILTER}}", categoryFilter)
    .replaceAll("{{BREADCRUMB_JSONLD}}", breadcrumbJsonLd([
      { name: "Home", url: site.domain + "/" },
      { name: "Blog", url: site.domain + "/blog/" },
    ]));
  const leftover = out.match(/\{\{[A-Z_]+\}\}/);
  if (leftover) fail("unreplaced token " + leftover[0] + " while rendering blog/index.html");
  return out;
}

function productCardHTML(p, prefix, location) {
  // Server-rendered product card for the free resources page, mirroring
  // the homepage card in js/main.js (same classes, same data) — but
  // without the "reveal" class (main.js is homepage-only, so a reveal
  // card would stay invisible) and with a plain "View Book" link instead
  // of the modal button (the modal lives in main.js too).
  // location (Part 3) labels the GA4 buy_now_click event so the same
  // card can be reused on the Products landing page.
  const loc = location || "free-resources";
  const featuresLi = (p.features || [])
    .map((f) => "<li>" + escText(f) + "</li>")
    .join("");
  return '<article class="card filter-item">' +
    '<div class="card-cover"><img src="' + escAttr(prefix + p.cover) + '" alt="' + escAttr(p.coverAlt) + '" loading="lazy" width="600" height="849">' +
    '<span class="card-badge">' + escText(p.slot) + '</span></div>' +
    '<div class="card-body">' +
    '<h3>' + escText(p.title) + '</h3>' +
    '<p class="card-theme">' + escText(p.theme) + '</p>' +
    '<p>' + escText(p.description) + '</p>' +
    '<p class="card-meta">' + escText(cardMeta(p)) + '</p>' +
    '<p class="card-price price-block">' + priceBlock(p, DATA.site.discountCode) + '</p>' +
    '<ul class="card-features">' + featuresLi + '</ul>' +
    '<div class="card-actions">' +
    '<a class="btn btn-outline" href="' + escAttr(prefix + "books/" + p.slug + ".html") + '">View Book</a>' +
    '<a class="btn btn-primary" href="' + escAttr(p.gumroadUrl) + '" target="_blank" rel="noopener" data-book="' + escAttr(p.slug) + '" data-location="' + escAttr(loc) + '">Buy Now on Gumroad</a>' +
    '</div>' +
    '</div>' +
    '</article>';
}

/* Part 5 — free resource detail pages (data/resources.json +
 * templates/resource.html). One reusable template produces
 * /free-resources/<slug>/index.html for each resource, with a Print
 * button (window.print()), a Download button for the real file, and
 * print CSS (css/styles.css) that prints only the artwork. The
 * Free Resources landing page lists the resources grouped by
 * category (resourceListHTML); categories with no real resource stay
 * Coming Soon and never appear here. */
function formatFileSize(bytes) {
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(2).replace(/\.?0+$/, "") + " MB";
  return Math.round(bytes / 1024) + " KB";
}

// Anchor ids for the resource groups on the Free Resources landing
// page — these must match the live category hrefs in
// data/sections.json (free-resources section). Six categories
// (15 Nov 2026 UI/UX pass); the brief's taxonomy.
const RESOURCE_CATEGORY_ANCHORS = {
  "Coloring Pages": "coloring-pages",
  "Learn to Draw": "learn-to-draw",
  "Learning Worksheets": "learning-worksheets",
  "Planners & Routine": "planners-routine",
  "Creative Printables": "creative-printables",
  "Wallpapers & AI": "wallpapers-ai"
};

// Category filter chips for the Free Resources landing page
// (15 Nov 2026 UI/UX pass). The brief's exact 6 categories, in order,
// with counts from the live resource list. "All Resources" is selected
// by default. The chip values are the category names themselves, so
// they match the data-category attributes on the resource cards.
const RESOURCE_FILTER_CATEGORIES = [
  "Coloring Pages",
  "Learn to Draw",
  "Learning Worksheets",
  "Planners & Routine",
  "Creative Printables",
  "Wallpapers & AI"
];

function resourceFilterBarHTML(resources) {
  const counts = {};
  for (const r of resources) counts[r.category] = (counts[r.category] || 0) + 1;
  const chips = '<button type="button" class="chip is-active" data-filter="all" aria-pressed="true">All Resources <span class="chip-count">' + resources.length + '</span></button>' +
    RESOURCE_FILTER_CATEGORIES.map((cat) =>
      '<button type="button" class="chip" data-filter="' + escAttr(cat) + '" aria-pressed="false">' + escText(cat) + ' <span class="chip-count">' + (counts[cat] || 0) + '</span></button>'
    ).join("");
  return '<div class="filter-bar" role="group" aria-label="Filter free resources by category">' + chips + '</div>';
}

// Guide accordions for the Free Resources landing page
// (15 Nov 2026 UI/UX pass). The section guide's existing content,
// moved below the listings into collapsed <details> accordions so the
// resources sit near the top of the page. Nothing is deleted: the
// three guide items are retitled (Printing tips -> Printing Guide,
// Ages 2-7 -> Age Guide, What each category will offer ->
// What's Included) and a fourth accordion carries the licence wording
// already stated in the guide ("personal and family use only ... print
// as many copies as you need for your own household ... No resale or
// redistribution"). Native <details>/<summary> is keyboard-operable
// and exposes its expanded state without JavaScript.
function resourceGuideAccordionsHTML(section) {
  const guide = section.guide;
  if (!guide || !guide.items || !guide.items.length) return "";
  const titles = ["Printing Guide", "Age Guide", "What's Included"];
  const items = guide.items.map((it, i) =>
    '      <details class="accordion-item">\n' +
    '        <summary class="accordion-q">' + escText(titles[i] || it.h) + '<span class="chev" aria-hidden="true">⌄</span></summary>\n' +
    '        <div class="accordion-a"><p>' + escText(it.text) + '</p></div>\n' +
    '      </details>'
  ).join("\n");
  const licence =
    '      <details class="accordion-item">\n' +
    '        <summary class="accordion-q">Usage &amp; Licence<span class="chev" aria-hidden="true">⌄</span></summary>\n' +
    '        <div class="accordion-a"><p>Every free resource is for personal and family use only — print as many copies as you need for your own household. No resale or redistribution. Please don\u2019t share the files themselves; instead, tell friends to download their own free copy from this page.</p></div>\n' +
    '      </details>';
  return '    <div class="guide-accordions">\n      <h2>' + escText(guide.title) + '</h2>\n' + items + '\n' + licence + '\n    </div>\n';
}

// Guide accordions for the Games & Play landing page
// (15 Nov 2026 UI/UX Pass 2). Same collapsed <details> pattern as the
// Free Resources guide accordions above, but the item headings are
// used as-is (no retitling) and there is no licence accordion: the
// three guide items move out of the full-text block at the top of the
// page into collapsed accordions above the category grid, so the
// discovery area follows a compact collapsed block.
function sectionGuideAccordionsHTML(section) {
  const guide = section.guide;
  if (!guide || !guide.items || !guide.items.length) return "";
  const items = guide.items.map((it) =>
    '      <details class="accordion-item">\n' +
    '        <summary class="accordion-q">' + escText(it.h) + '<span class="chev" aria-hidden="true">⌄</span></summary>\n' +
    '        <div class="accordion-a"><p>' + escText(it.text) + '</p></div>\n' +
    '      </details>'
  ).join("\n");
  return '    <div class="guide-accordions">\n      <h2>' + escText(guide.title) + '</h2>\n' + items + '\n    </div>\n';
}

function resourceJsonLd(r, canonical, downloadUrl) {
  return '<script type="application/ld+json">\n' + JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": r.title,
    "description": r.metaDescription,
    "url": canonical,
    "isAccessibleForFree": true,
    "license": DATA.site.domain + "/terms.html",
    "encodingFormat": r.is_pdf ? "application/pdf" : "image/jpeg",
    "contentUrl": downloadUrl,
    "author": { "@type": "Organization", "name": "JoJo's Blocks" }
  }, null, 2) + "\n</script>";
}

function renderResourcePage(r) {
  const template = fs.readFileSync(RESOURCE_TEMPLATE, "utf8");
  const site = DATA.site;
  const prefix = "../../";
  const canonical = site.domain + "/free-resources/" + r.slug + "/";
  const ogImage = site.domain + "/" + r.preview;
  const downloadUrl = site.domain + "/" + r.file;
  const fileName = r.file.split("/").pop();
  const fileType = r.is_pdf ? "pdf" : "jpg";
  const downloadLabel = r.is_pdf ? "Download PDF" : "Download JPG";
  const fileMeta = r.is_pdf
    ? "PDF · A4" + (r.page_orientation === "landscape" ? " landscape" : "") + " · " + (r.pages === 1 ? "1 page" : r.pages + " pages") + " · " + formatFileSize(r.file_size_bytes)
    : "JPG · 1080x1920 · " + formatFileSize(r.file_size_bytes);
  const usageLi = r.is_pdf
    ? "<li>Print at home on A4 paper — if your printer uses US Letter, choose \u201cFit to page\u201d so nothing is cut off.</li>" +
      "<li>" + escText(r.licence) + " only — print as many copies as you need for your own household.</li>" +
      "<li>No resale or redistribution.</li>"
    : "<li>Save the JPG to your phone and set it as your wallpaper (1080x1920).</li>" +
      "<li>" + escText(r.licence) + " only.</li>" +
      "<li>No resale or redistribution.</li>";
  const chrome = chromeFor(prefix, false, "free-resources");
  const out = template
    .replaceAll("{{HEADER}}", chrome.header)
    .replaceAll("{{FOOTER}}", chrome.footer)
    .replaceAll("{{PAGE_CLASS}}", r.page_orientation === "landscape" ? ' class="page-landscape"' : "")
    .replaceAll("{{TITLE}}", escText(r.title))
    .replaceAll("{{SEO_TITLE}}", escAttr(r.seoTitle))
    .replaceAll("{{META_DESCRIPTION}}", escAttr(r.metaDescription))
    .replaceAll("{{CANONICAL_URL}}", canonical)
    .replaceAll("{{OG_IMAGE_URL}}", ogImage)
    .replaceAll("{{CATEGORY}}", escText(r.category))
    .replaceAll("{{DESCRIPTION}}", escText(r.description))
    .replaceAll("{{PREVIEW_REL_PATH}}", escAttr(prefix + r.preview))
    .replaceAll("{{PREVIEW_WIDTH}}", String(r.preview_width))
    .replaceAll("{{PREVIEW_HEIGHT}}", String(r.preview_height))
    .replaceAll("{{PREVIEW_ALT}}", escAttr(r.title + " — free printable preview"))
    .replaceAll("{{FILE_META}}", escText(fileMeta))
    .replaceAll("{{FILE_REL_PATH}}", escAttr(prefix + r.file))
    .replaceAll("{{FILE_NAME}}", escAttr(fileName))
    .replaceAll("{{DOWNLOAD_LABEL}}", escText(downloadLabel))
    .replaceAll("{{FILE_TYPE}}", fileType)
    .replaceAll("{{SLUG}}", r.slug)
    .replaceAll("{{USAGE_LI}}", usageLi)
    .replaceAll("{{RESOURCE_JSONLD}}", resourceJsonLd(r, canonical, downloadUrl))
    .replaceAll("{{BREADCRUMB_JSONLD}}", breadcrumbJsonLd([
      { name: "Home", url: site.domain + "/" },
      { name: "Free Resources", url: site.domain + "/free-resources/" },
      { name: r.title, url: canonical },
    ]));
  const leftover = out.match(/\{\{[A-Z_]+\}\}/);
  if (leftover) fail("unreplaced token " + leftover[0] + " while rendering free-resources/" + r.slug);
  return out;
}

function resourceCardHTML(r, prefix) {
  const pageHref = r.slug + "/";
  const meta = r.is_pdf
    ? "PDF · A4" + (r.page_orientation === "landscape" ? " landscape" : "") + " · " + (r.pages === 1 ? "1 page" : r.pages + " pages")
    : "JPG · 1080x1920";
  return '<article class="card resource-card filter-item" data-category="' + escAttr(r.category) + '">' +
    '<a class="card-cover" href="' + escAttr(pageHref) + '" aria-label="' + escAttr(r.title) + '"><img src="' + escAttr(prefix + r.preview) + '" alt="' + escAttr(r.title + " — free printable preview") + '" loading="lazy" width="' + r.preview_width + '" height="' + r.preview_height + '"></a>' +
    '<div class="card-body">' +
    '<span class="eyebrow">' + escText(r.category) + '</span>' +
    '<h3><a href="' + escAttr(pageHref) + '">' + escText(r.title) + '</a></h3>' +
    '<p>' + escText(r.description) + '</p>' +
    '<p class="card-meta">' + escText(meta) + ' · Free</p>' +
    '<div class="card-actions"><a class="btn btn-primary" href="' + escAttr(pageHref) + '">View &amp; Print</a></div>' +
    '</div>' +
    '</article>';
}

function resourceListHTML(resources, prefix) {
  const groups = [];
  const byCat = new Map();
  for (const r of resources) {
    if (!byCat.has(r.category)) { byCat.set(r.category, []); groups.push(r.category); }
    byCat.get(r.category).push(r);
  }
  const parts = ['    <div class="section-resources">\n      <h2>Free downloads</h2>\n      <p class="lead">' + resources.length + ' free resources to download, print and play with — no sign-up, no account, just print and play.</p>'];
  for (const cat of groups) {
    const anchor = RESOURCE_CATEGORY_ANCHORS[cat] || cat.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    parts.push('      <h3 class="resource-group" id="' + anchor + '">' + escText(cat) + '</h3>');
    parts.push('      <div class="product-grid">');
    for (const r of byCat.get(cat)) parts.push(resourceCardHTML(r, prefix));
    parts.push('      </div>');
  }
  parts.push('    </div>');
  return parts.join("\n");
}

/* Part 3 — section landing pages (data/sections.json + templates/section.html).
 * One generic renderer for every section landing page. A category with
 * status "live" becomes a linked card; status "soon" becomes a Coming
 * Soon card with NO link and NO download/buy/play button. The featured
 * block is either the real products (type "products"), one real resource
 * (type "resource"), or absent. */
function renderSectionPage(section, products, resources) {
  const template = fs.readFileSync(SECTION_TEMPLATE, "utf8");
  const site = DATA.site;
  const prefix = "../";
  const canonical = site.domain + "/" + section.path.replace(/index\.html$/, "");
  // Featured block.
  let featured = "";
  if (section.featured && section.featured.type === "products") {
    const cards = products.filter((p) => p.status === "published").map((p) => productCardHTML(p, prefix, section.id)).join("\n");
    featured = '    <div class="section-featured" id="products">\n      <h2>' + escText(section.featured.title) + '</h2>\n      <p class="lead">' + escText(section.featured.description) + '</p>\n      <div class="product-grid">\n' + cards + '\n      </div>\n    </div>\n';
  } else if (section.featured && section.featured.type === "resource") {
    const f = section.featured;
    // Taster Pack card (15 Nov 2026 UI/UX pass): the real cover thumbnail
    // (assets/free-resources/taster-pack-thumbnail.jpg, a render of the
    // PDF's page 1) replaces the text-only 🎁 emoji card. Same PDF link,
    // same data-free-download tracking, same meta line.
    featured = '    <div class="section-featured">\n      <article class="feature-card feature-card--taster filter-item">\n        <img class="feature-cover" src="' + escAttr(prefix + "assets/free-resources/taster-pack-thumbnail.jpg") + '" alt="JoJo\u2019s Blocks Free Taster Pack — cover page" width="849" height="1200" loading="lazy">\n        <div class="feature-body">\n        <h2>' + escText(f.title) + '</h2>\n        <p>' + escText(f.description) + '</p>\n        <p class="card-meta">' + escText(f.meta) + '</p>\n        <a class="btn btn-primary" href="' + escAttr(hrefFor(f.href, prefix, false)) + '" data-free-download="taster-pack" data-location="' + escAttr(section.id) + '">' + escText(f.buttonText) + '</a>\n        </div>\n      </article>\n    </div>\n';
  }
  // Category cards.
  const cards = (section.categories || []).map((c) => {
    if (c.status === "live") {
      if (!c.href) fail("data/sections.json: live category '" + c.id + "' has no href");
      return '      <a class="category-card filter-item" href="' + escAttr(hrefFor(c.href, prefix, false)) + '">\n        <span class="category-icon" aria-hidden="true">' + escText(c.icon || "✦") + '</span>\n        <h3>' + escText(c.label) + '</h3>\n        <p>' + escText(c.description) + '</p>\n        <span class="category-cta">Browse →</span>\n      </a>';
    }
    if (c.href) fail("data/sections.json: soon category '" + c.id + "' must not have an href");
    return '      <article class="category-card coming-soon filter-item">\n        <span class="category-icon" aria-hidden="true">' + escText(c.icon || "✦") + '</span>\n        <h3>' + escText(c.label) + '</h3>\n        <p>' + escText(c.description) + '</p>\n        <p class="coming-soon-text">' + escText(c.comingSoon || "More coming soon.") + '</p>\n        <span class="soon-pill">Coming Soon</span>\n      </article>';
  }).join("\n");
  // Part 4 — optional honest guide/intro content (data/sections.json
  // "guide": {title, items:[{h, text}]}). Rendered only when present;
  // a section without a guide renders byte-identical output, because
  // the template token sits on the intro line and renders to "".
  // EXCEPTION (15 Nov 2026 UI/UX pass): on the Free Resources page the
  // guide is NOT rendered up top — it moves below the listings as
  // collapsed accordions (guideAccordions, token after the resource
  // list), so the resources sit near the top of the page.
  let guide = "";
  let guideAccordions = "";
  let filterBar = "";
  if (section.id === "free-resources") {
    guideAccordions = resourceGuideAccordionsHTML(section);
    if (resources && resources.length) filterBar = resourceFilterBarHTML(resources);
  } else if (section.id === "games") {
    // UI/UX Pass 2: the games guide renders as collapsed accordions
    // (sectionGuideAccordionsHTML), not as full text at the top.
    guideAccordions = sectionGuideAccordionsHTML(section);
  } else if (section.guide && section.guide.items && section.guide.items.length) {
    guide = '\n    <div class="section-guide">\n      <h2>' + escText(section.guide.title) + '</h2>\n' +
      section.guide.items.map((it) => '      <h3>' + escText(it.h) + '</h3>\n      <p>' + escText(it.text) + '</p>').join("\n") +
      '\n    </div>';
  }
  // Optional note / affiliate disclosure.
  const note = section.note
    ? '    <div class="section-note">\n      <h2>Good to know</h2>\n      <p>' + escText(section.note) + '</p>\n    </div>\n'
    : "";
  // Part 5 — the Free Resources landing page lists the real downloads
  // grouped by category; every other section renders no list ("").
  let resourceList = "";
  if (section.id === "free-resources" && resources && resources.length) {
    resourceList = resourceListHTML(resources, prefix);
  }
  // Nav current-page id: the Products landing page is the nav's
  // "Digital Products" child, not the "Products" menu itself.
  // UI/UX Pass 2: the search box is dead UI on Games (js/site.js only
  // filters .filter-item:not(.category-card), and every games card is
  // a category card), so it renders empty there and byte-identical
  // markup everywhere else.
  const searchHtml = section.id === "games" ? "" :
    '\n    <div class="section-search" role="search">\n' +
    '      <label class="visually-hidden" for="section-search">Search this section</label>\n' +
    '      <input type="search" id="section-search" class="search-box" placeholder="Search ' + escText(section.title) + '…" autocomplete="off">\n' +
    '    </div>';
  const chrome = chromeFor(prefix, false, section.id === "products" ? "digital-products" : section.id);
  const out = template
    .replaceAll("{{HEADER}}", chrome.header)
    .replaceAll("{{FOOTER}}", chrome.footer)
    .replaceAll("{{PREFIX}}", prefix)
    .replaceAll("{{SEO_TITLE}}", escAttr(section.seoTitle))
    .replaceAll("{{META_DESCRIPTION}}", escAttr(section.metaDescription))
    .replaceAll("{{CANONICAL_URL}}", canonical)
    .replaceAll("{{TITLE}}", escText(section.title))
    .replaceAll("{{EYEBROW}}", escText(section.eyebrow))
    .replaceAll("{{HEADING}}", escText(section.heading))
    .replaceAll("{{INTRO}}", escText(section.intro))
    .replaceAll("{{FEATURED_HTML}}", featured)
    .replaceAll("{{RESOURCE_LIST_HTML}}", resourceList)
    .replaceAll("{{GUIDE_HTML}}", guide)
    .replaceAll("{{GUIDE_ACCORDIONS_HTML}}", guideAccordions)
    .replaceAll("{{SEARCH_HTML}}", searchHtml)
    .replaceAll("{{FILTER_BAR_HTML}}", filterBar)
    .replaceAll("{{CATEGORY_CARDS}}", cards)
    .replaceAll("{{NOTE_HTML}}", note)
    .replaceAll("{{BREADCRUMB_JSONLD}}", breadcrumbJsonLd([
      { name: "Home", url: site.domain + "/" },
      { name: section.title, url: canonical },
    ]));
  const leftover = out.match(/\{\{[A-Z_]+\}\}/);
  if (leftover) fail("unreplaced token " + leftover[0] + " while rendering " + section.path);
  return out;
}

function renderSitemap(published, site, articles, sections, resources) {
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
  const url = (loc, lastmod, changefreq, priority) =>
    `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
  for (const sp of DATA.staticPages) {
    lines.push(url(site.domain + sp.path, sp.lastmod, sp.changefreq, sp.priority));
  }
  // Part 4: refund-policy.html is a real page that returns 200, so it
  // belongs in the sitemap (listed here, not via data/products.json,
  // which is the protected product data file). It stays unlinked from
  // the footer until the owner approves it + qualified legal review.
  lines.push(url(site.domain + "/refund-policy.html", "2026-11-15", "yearly", "0.3"));
  // Original order: homepage, then the 5 book pages in data order, then privacy/terms.
  // staticPages holds "/" first; insert the book pages right after it.
  const home = lines.splice(2, 1)[0];
  const bookLines = published.map((p) =>
    url(site.domain + "/books/" + p.slug + ".html", p.lastmod, "monthly", "0.8")
  );
  // Blog: listing first (priority 0.8, lastmod = latest article), then each
  // published article (priority 0.7, lastmod = its publication date).
  const blogLines = [];
  if (articles && articles.length) {
    const latest = articles.map((a) => a.datePublished).sort().pop();
    blogLines.push(url(site.domain + "/blog/", latest, "monthly", "0.8"));
    for (const a of articles) blogLines.push(url(site.domain + "/blog/" + a.slug + ".html", a.datePublished, "monthly", "0.7"));
  }
  // Part 3 section landing pages (only real pages that exist — Coming Soon
  // category cards are not separate pages, so they never appear here).
  const sectionLines = (sections || []).map((s) =>
    url(site.domain + "/" + s.path.replace(/index\.html$/, ""), s.lastmod, "monthly", "0.8")
  );
  // Part 5 free resource detail pages (only real pages that exist).
  const resourceLines = (resources || []).map((r) =>
    url(site.domain + "/free-resources/" + r.slug + "/", r.lastmod, "monthly", "0.7")
  );
  lines.splice(2, 0, home, ...bookLines, ...blogLines, ...sectionLines, ...resourceLines);
  lines.push("</urlset>", "");
  return lines.join("\n");
}

function renderLlms(published, site, free, articles, sections, resources) {
  const parts = [];
  parts.push("# JoJo's Blocks\n");
  parts.push(
    "> JoJo's Blocks is a digital products brand. Its first products are digital PDF coloring books for parents and children — printable at home, screen-free, for learning through play. The books are sold through Gumroad; this website takes no payment itself.\n"
  );
  parts.push(
    "- Website: " + site.domain + "/\n" +
    "- Sitemap: " + site.domain + "/sitemap.xml\n" +
    "- Pinterest: https://www.pinterest.com/JoJosBlocks/\n" +
    "- Online store (Gumroad): https://jojosblocks.gumroad.com/\n"
  );
  parts.push("## What the website is for\n");
  parts.push(
    "JoJo's Blocks helps parents, preschool teachers and homeschool families find printable coloring and activity books for young children. Every book is a digital PDF: buy it, download it, print the pages at home and color them again and again. No printed books are shipped. No accounts or passwords are needed to browse the website.\n"
  );
  parts.push("## Who the books are for\n");
  parts.push(
    "- Parents of young children looking for calm, screen-free activities\n" +
    "- Preschool teachers and homeschool families\n" +
    "- Children learning letters, animals, community helpers and space themes through coloring, tracing, counting, matching and puzzles\n"
  );
  parts.push("## Products\n");
  parts.push(
    "All prices are in USD. A 10% discount code " + site.discountCode +
    " is automatically applied at Gumroad checkout, so the price paid is lower than the listed price (shown below in brackets).\n"
  );
  for (const p of published) {
    // Keep the original llms.txt wording exactly: "ages 2–4" / "ages 3–5".
    // (The age is part of llmsFormat already; nothing is derived here.)
    parts.push(
      "### " + p.shortTitle + "\n\n" +
      "- Product page: " + site.domain + "/books/" + p.slug + ".html\n" +
      "- Price: " + p.price + " (" + p.salePrice + " with " + site.discountCode + ")\n" +
      "- Format: " + p.llmsFormat + "\n" +
      "- What it is: " + p.llmsSummary + "\n"
    );
  }
  if (free) {
    parts.push("## Free sample\n");
    parts.push(
      "### " + free.title + "\n\n" +
      "- Free download: " + site.domain + "/free-printables/\n" +
      "- File: " + free.file + " (" + free.pages + " pages, " + free.format + ", " + free.fileSize + ")\n" +
      "- Ages: " + free.ages + "\n" +
      "- What it is: one sample activity from each of the four books — " +
      (free.contents || []).map((c) => c.title).join(", ") + ".\n" +
      "- License: personal and family use only; no resale or redistribution. No sign-up or email address is needed to download it.\n"
    );
  }
  if (articles && articles.length) {
    parts.push("## Blog articles\n");
    for (const a of articles) {
      parts.push(
        "### " + a.title + "\n\n" +
        "- Article: " + site.domain + "/blog/" + a.slug + ".html\n" +
        "- Published: " + a.datePublished + "\n" +
        "- What it is: " + a.excerpt + "\n"
      );
    }
  }
  if (sections && sections.length) {
    parts.push("## Sections\n");
    for (const s of sections) {
      parts.push(
        "### " + s.title + "\n\n" +
        "- Page: " + site.domain + "/" + s.path.replace(/index\.html$/, "") + "\n" +
        "- What it is: " + s.intro + "\n"
      );
    }
  }
  if (resources && resources.length) {
    parts.push("## Free resources\n");
    parts.push(
      "Free printables, coloring pages, worksheets and creative downloads — no sign-up or email address is needed to download them. License: personal and family use only; no resale or redistribution.\n"
    );
    for (const r of resources) {
      parts.push(
        "### " + r.title + "\n\n" +
        "- Resource page: " + site.domain + "/free-resources/" + r.slug + "/\n" +
        "- File: " + r.file + " (" + formatFileSize(r.file_size_bytes) + ")\n" +
        "- Category: " + r.category + "\n" +
        "- What it is: " + r.description + "\n"
      );
    }
  }
  parts.push("## How buying works\n");
  parts.push(
    "1. Browse the books on the website.\n" +
    '2. Click "Buy Now on Gumroad" on any book.\n' +
    "3. Checkout and payment happen on Gumroad; the PDF download is provided by Gumroad after purchase.\n" +
    "4. Print the pages at home and color them.\n"
  );
  parts.push("## Website information pages\n");
  parts.push(
    "- Privacy Policy: " + site.domain + "/privacy.html\n" +
    "- Terms & Conditions: " + site.domain + "/terms.html\n"
  );
  parts.push("## Contact\n");
  parts.push(
    site.contactEmail
      ? "Contact: " + site.contactEmail + "\n"
      : "No public email address is listed on the website. The brand can be found on Pinterest at https://www.pinterest.com/JoJosBlocks/ and its Gumroad store at https://jojosblocks.gumroad.com/.\n"
  );
  parts.push("## Notes for AI systems\n");
  parts.push(
    "- Use the product pages above as the source of truth for titles, page counts, ages and prices. Ages are shown only where the book states them.\n" +
    "- Do not invent testimonials, reviews, ratings or sales claims — the website contains none.\n" +
    "- The books are digital PDFs only; there is no printed edition and no physical shipping.\n" +
    "- llms.txt does not guarantee indexing, citation or ranking by any AI system or search engine.\n"
  );
  return parts.join("\n");
}

function jsString(s) {
  return JSON.stringify(s === null || s === undefined ? "" : String(s));
}

function renderProductsJs(DATA) {
  const site = DATA.site;
  const published = DATA.products.filter((p) => p.status === "published");
  const lines = [];
  lines.push("/* ============================================================");
  lines.push("   JoJo’s Blocks — Product data (GENERATED FILE)");
  lines.push("   ------------------------------------------------------------");
  lines.push("   DO NOT EDIT THIS FILE BY HAND.");
  lines.push("   It is generated from data/products.json by tools/generate-pages.js.");
  lines.push("   To add or change a book:");
  lines.push("     1. Edit data/products.json (one entry per book).");
  lines.push("     2. Run: node tools/generate-pages.js --all");
  lines.push("   That regenerates this file, the book pages, sitemap.xml and llms.txt");
  lines.push("   from the same data, so prices and descriptions can never drift apart.");
  lines.push("   ");
  lines.push("   Checkout notes (unchanged from the original file):");
  lines.push("   - pdfUrl holds each book's real Gumroad link, ending ?wanted=true");
  lines.push("     (Gumroad direct checkout for that one product). JOJOS10 is");
  lines.push("     auto-applied at checkout.");
  lines.push("   - Gumroad keeps a persistent cart in the visitor's browser: if a");
  lines.push("     visitor previously clicked \"I want this!\" on other products,");
  lines.push("     those stay in their cart and no link format can clear them.");
  lines.push("     A fresh visitor always sees exactly the one product clicked.");
  lines.push("   - Paid PDF files are never stored in this repository.");
  lines.push("   ============================================================ */");
  lines.push("");
  lines.push("const SITE_CONFIG = {");
  lines.push("  // Brand name — change this one line to rename the site.");
  lines.push("  // Also update <title> and the JSON-LD in index.html.");
  lines.push("  brandName: " + jsString(site.brandName) + ",");
  lines.push("  tagline: " + jsString(site.tagline) + ",");
  lines.push("  // Live domain since launch 10 Nov 2026: " + site.domain);
  lines.push("  domain: " + jsString(site.domain) + ",");
  lines.push("  contactEmail: " + (site.contactEmail === null ? "null" : jsString(site.contactEmail)) + ", // public business email — shown in the footer when set");
  lines.push("  pinterestUrl: " + jsString(site.pinterestUrl) + ", // verified Pinterest profile — shown in the footer");
  lines.push("  discountCode: " + jsString(site.discountCode) + ", // 10% off code shown with discounted prices — see data/products.json");
  lines.push("  newsletterConnected: " + site.newsletterConnected + ", // live since 9 Nov 2026: signups are saved to the \"JoJo's Blocks subscribers\" sheet via the Apps Script endpoint below — only flip back to false if the endpoint stops working");
  lines.push("  // Newsletter endpoint: the Google Apps Script web app URL that saves");
  lines.push("  // signups to the \"JoJo's Blocks subscribers\" sheet. Leave as null until");
  lines.push("  // the script is deployed — the form then keeps its honest");
  lines.push("  // \"not connected yet\" message instead of pretending to work.");
  lines.push("  newsletterEndpoint: " + jsString(site.newsletterEndpoint) + " // Apps Script web app URL — deployed 9 Nov 2026; set newsletterConnected true only after a real test signup lands in the sheet");
  lines.push("};");
  lines.push("");
  lines.push("const PRODUCTS = [");
  published.forEach((p, i) => {
    const last = i === published.length - 1;
    lines.push("  {");
    lines.push('    id: ' + jsString(p.id) + ",");
    lines.push('    slug: ' + jsString(p.slug) + ",");
    lines.push('    price: ' + jsString(p.price) + ",");
    lines.push('    salePrice: ' + jsString(p.salePrice) + ", // with JOJOS10 (10% off, auto-applied at Gumroad checkout)");
    lines.push('    slot: ' + jsString(p.slot) + ",");
    lines.push('    title: ' + jsString(p.title) + ",");
    lines.push('    shortTitle: ' + jsString(p.shortTitle) + ",");
    lines.push('    theme: ' + jsString(p.theme) + ",");
    lines.push('    age: ' + (p.age === null ? "null" : jsString(p.age)) + ",");
    lines.push('    license: ' + jsString(p.license) + ", // personal-family = Personal & Family Use (owner-approved default)");
    lines.push('    pages: ' + p.pages + ",");
    lines.push('    format: ' + jsString(p.format) + ",");
    lines.push('    description: ' + jsString(p.description) + ",");
    lines.push("    features: [");
    p.features.forEach((f, j) => {
      lines.push("      " + jsString(f) + (j === p.features.length - 1 ? "" : ","));
    });
    lines.push("    ],");
    lines.push('    cover: ' + jsString(p.cover) + ",");
    lines.push('    coverAlt: ' + jsString(p.coverAlt) + ",");
    lines.push('    pdfUrl: ' + jsString(p.gumroadUrl) + ",  // Gumroad checkout — published 10 Nov 2026");
    lines.push("    seo: {");
    lines.push('      focusKeyword: ' + jsString(p.seo.focusKeyword) + ",");
    lines.push("      secondaryKeywords: " + JSON.stringify(p.seo.secondaryKeywords) + ",");
    lines.push("      longTailKeywords: " + JSON.stringify(p.seo.longTailKeywords) + ",");
    lines.push('      metaDescription: ' + jsString(p.seo.metaDescription));
    lines.push("    }");
    lines.push("  }" + (last ? "" : ","));
  });
  lines.push(""); // blank line before the closing bracket, as in the original file
  lines.push("];");
  lines.push(""); // trailing newline
  return lines.join("\n");
}

function writeFile(file, content, checkOnly) {
  const rel = path.relative(ROOT, file);
  const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (existing === content) {
    console.log("unchanged: " + rel);
    return "unchanged";
  }
  if (checkOnly) {
    console.log("would change: " + rel);
    return "changed";
  }
  const tmp = file + ".tmp";
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(tmp, content, "utf8");
  fs.renameSync(tmp, file);
  console.log("wrote: " + rel);
  return "changed";
}

function main() {
  const args = process.argv.slice(2);
  const mode = args[0];
  const checkOnly = mode === "--check";
  const onlySlug = mode === "--only" ? args[1] : null;
  const doAll = mode === "--all" || checkOnly;
  if (!mode || (mode !== "--only" && mode !== "--all" && mode !== "--check") || (mode === "--only" && !onlySlug)) {
    fail("usage: node tools/generate-pages.js --only <slug> | --only article:<slug> | --all | --check");
  }
  if (!fs.existsSync(DATA_FILE)) fail("missing " + DATA_FILE);
  if (!fs.existsSync(NAV_FILE)) fail("missing " + NAV_FILE);
  if (!fs.existsSync(CATEGORIES_FILE)) fail("missing " + CATEGORIES_FILE);
  if (!fs.existsSync(TEMPLATE_FILE)) fail("missing " + TEMPLATE_FILE);
  const DATA = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  global.DATA = DATA;
  global.NAV = JSON.parse(fs.readFileSync(NAV_FILE, "utf8"));
  // Navigation validation: a live item must link somewhere real, a soon
  // item must not link anywhere (it has no content yet). The per-item
  // checks also run inside navItemsHTML; these catch structural errors.
  if (!NAV.top || !NAV.explore || !NAV.footer || !NAV.contact) fail("data/navigation.json: top, explore, footer and contact are required");
  if (!/^https:\/\/www\.pinterest\.com\//.test(NAV.pinterestUrl || "")) fail("data/navigation.json: pinterestUrl must be the verified Pinterest profile URL");
  if (!NAV.contactEmail || NAV.contactEmail !== DATA.site.contactEmail) fail("data/navigation.json: contactEmail must match data/products.json site.contactEmail");
  // Category taxonomy validation (data/categories.json): unique ids,
  // valid statuses, soon items never link anywhere, every navigation
  // category exists in the taxonomy, and every live category's href
  // points at a file this generator writes.
  const CATS = JSON.parse(fs.readFileSync(CATEGORIES_FILE, "utf8"));
  if (!CATS.categories || !Array.isArray(CATS.categories)) fail("data/categories.json: categories array is required");
  const catIds = new Set();
  const seenLiveHrefs = [];
  (function walkCats(list) {
    for (const c of list) {
      if (!c.id || !c.label || !c.status) fail("data/categories.json: every category needs id, label and status");
      if (catIds.has(c.id)) fail("data/categories.json: duplicate category id: " + c.id);
      catIds.add(c.id);
      if (c.status !== "live" && c.status !== "soon") fail("data/categories.json: category " + c.id + " has invalid status: " + c.status);
      if (c.status === "soon" && c.href) fail("data/categories.json: soon category must not have an href: " + c.id);
      if (c.children) walkCats(c.children);
    }
  })(CATS.categories);
  const writtenFiles = new Set(["index.html", "privacy.html", "terms.html", "404.html", "refund-policy.html", "sitemap.xml", "llms.txt", "free-printables/index.html"]);
  for (const p of (DATA.products || [])) writtenFiles.add("books/" + p.slug + ".html");
  // Part 3 section landing pages (data/sections.json): loaded early so
  // their paths are in writtenFiles before the nav href check below.
  // A live category must have a real href; a soon category must not.
  // Meta descriptions must be 120-160 characters.
  if (!fs.existsSync(SECTIONS_FILE)) fail("missing " + SECTIONS_FILE);
  if (!fs.existsSync(SECTION_TEMPLATE)) fail("missing " + SECTION_TEMPLATE);
  const SECTIONS = JSON.parse(fs.readFileSync(SECTIONS_FILE, "utf8"));
  if (!SECTIONS.sections || !Array.isArray(SECTIONS.sections)) fail("data/sections.json: sections array is required");
  const sectionIds = new Set();
  for (const s of SECTIONS.sections) {
    for (const f of ["id", "path", "title", "seoTitle", "metaDescription", "eyebrow", "heading", "intro", "lastmod"]) {
      if (s[f] === undefined || s[f] === null || s[f] === "") fail("section " + (s.id || "?") + " is missing required field: " + f);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.lastmod)) fail("section " + s.id + ": lastmod must be YYYY-MM-DD");
    if (s.metaDescription.length < 120 || s.metaDescription.length > 160) fail("section " + s.id + ": metaDescription must be 120-160 characters (got " + s.metaDescription.length + ")");
    if (!s.path.endsWith("/index.html")) fail("section " + s.id + ": path must end with /index.html (got " + s.path + ")");
    if (sectionIds.has(s.id)) fail("duplicate section id: " + s.id);
    sectionIds.add(s.id);
    if (s.featured && s.featured.type !== "products" && s.featured.type !== "resource") fail("section " + s.id + ": featured.type must be 'products' or 'resource'");
    if (s.guide) {
      if (!s.guide.title || !Array.isArray(s.guide.items) || !s.guide.items.length) fail("section " + s.id + ": guide needs a title and at least one item");
      for (const it of s.guide.items) if (!it.h || !it.text) fail("section " + s.id + ": every guide item needs h and text");
    }
    const catIds2 = new Set();
    for (const c of (s.categories || [])) {
      if (!c.id || !c.label || !c.description || !c.status) fail("section " + s.id + ": every category needs id, label, description and status");
      if (catIds2.has(c.id)) fail("section " + s.id + ": duplicate category id: " + c.id);
      catIds2.add(c.id);
      if (c.status !== "live" && c.status !== "soon") fail("section " + s.id + ": category " + c.id + " has invalid status: " + c.status);
      if (c.status === "live" && !c.href) fail("section " + s.id + ": live category '" + c.id + "' has no href");
      if (c.status === "soon" && c.href) fail("section " + s.id + ": soon category '" + c.id + "' must not have an href");
    }
    writtenFiles.add(s.path);
  }
  // Part 5 — free resources (data/resources.json): the free resources
  // library. Every file must exist under assets/free-resources/ and
  // its byte size must match the data file, or the build fails — so a
  // paid PDF can never be published as a free download by mistake.
  if (!fs.existsSync(RESOURCES_FILE)) fail("missing " + RESOURCES_FILE);
  if (!fs.existsSync(RESOURCE_TEMPLATE)) fail("missing " + RESOURCE_TEMPLATE);
  const RESOURCES_DATA = JSON.parse(fs.readFileSync(RESOURCES_FILE, "utf8"));
  const RESOURCE_CATEGORIES = RESOURCES_DATA.categories || [];
  const RESOURCES = RESOURCES_DATA.resources || [];
  if (!RESOURCES.length) fail("data/resources.json: resources array is required");
  const resourceSlugs = new Set();
  for (const r of RESOURCES) {
    for (const f of ["slug", "title", "description", "category", "file", "file_size_bytes", "preview", "preview_width", "preview_height", "page_orientation", "pages", "licence", "is_pdf", "seoTitle", "metaDescription", "lastmod"]) {
      if (r[f] === undefined || r[f] === null || r[f] === "") fail("resource " + (r.slug || "?") + " is missing required field: " + f);
    }
    if (resourceSlugs.has(r.slug)) fail("duplicate resource slug: " + r.slug);
    resourceSlugs.add(r.slug);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.slug)) fail("resource slug must be lowercase kebab-case: " + r.slug);
    if (!RESOURCE_CATEGORIES.includes(r.category)) fail("resource " + r.slug + ": category must be one of the fixed list: " + RESOURCE_CATEGORIES.join(", "));
    if (r.metaDescription.length < 120 || r.metaDescription.length > 160) fail("resource " + r.slug + ": metaDescription must be 120-160 characters (got " + r.metaDescription.length + ")");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.lastmod)) fail("resource " + r.slug + ": lastmod must be YYYY-MM-DD");
    if (r.page_orientation !== "portrait" && r.page_orientation !== "landscape") fail("resource " + r.slug + ": page_orientation must be 'portrait' or 'landscape'");
    if (typeof r.is_pdf !== "boolean") fail("resource " + r.slug + ": is_pdf must be true or false");
    if (!r.file.startsWith("assets/free-resources/")) fail("resource " + r.slug + ": file must live under assets/free-resources/ (got: " + r.file + ")");
    if (!r.preview.startsWith("assets/free-resources/")) fail("resource " + r.slug + ": preview must live under assets/free-resources/ (got: " + r.preview + ")");
    const resPath = path.join(ROOT, r.file);
    if (!fs.existsSync(resPath)) fail("resource file not found: " + r.file);
    const resSize = fs.statSync(resPath).size;
    if (resSize !== r.file_size_bytes) fail("resource file size mismatch: " + r.file + " is " + resSize + " bytes, data/resources.json says " + r.file_size_bytes);
    if (!fs.existsSync(path.join(ROOT, r.preview))) fail("resource preview not found: " + r.preview);
    writtenFiles.add("free-resources/" + r.slug + "/index.html");
  }
  function navCategoryIds() {
    const ids = [];
    for (const item of (NAV.explore || [])) ids.push(item.id);
    for (const item of (NAV.top || [])) if (item.status === "soon") ids.push(item.id);
    return ids;
  }
  for (const id of navCategoryIds()) {
    if (!catIds.has(id)) fail("data/navigation.json: category id not in data/categories.json: " + id);
  }
  for (const item of (NAV.explore || [])) {
    if (item.status === "live") {
      if (!item.href) fail("data/navigation.json: live category needs an href: " + item.id);
      const filePart = item.href.split("#")[0] || "index.html";
      if (!writtenFiles.has(filePart)) fail("data/navigation.json: live category href points at a file the generator does not write: " + item.href);
    }
  }
  const site = DATA.site;
  const products = DATA.products || [];
  if (!site || !site.domain) fail("data/products.json: site.domain is required");
  for (const p of products) {
    for (const f of ["id", "slug", "title", "shortTitle", "slot", "theme", "pages", "format", "price", "salePrice", "description", "cover", "coverAlt", "gumroadUrl", "lastmod"]) {
      if (p[f] === undefined || p[f] === null || p[f] === "") fail("product " + (p.id || "?") + " is missing required field: " + f);
    }
    if (!p.seo || !p.seo.metaDescription || !p.seo.seoTitle) fail("product " + p.id + " is missing seo.metaDescription / seo.seoTitle");
    if (!p.llmsFormat || !p.llmsSummary) fail("product " + p.id + " is missing llmsFormat / llmsSummary");
  }
  const slugs = new Set(products.map((p) => p.slug));
  if (slugs.size !== products.length) fail("duplicate slug in data/products.json");
  const published = products.filter((p) => p.status === "published");
  const drafts = products.filter((p) => p.status !== "published");
  if (drafts.length) console.log("skipping drafts (no page, no sitemap entry): " + drafts.map((d) => d.slug).join(", "));

  // Free resources (data/free-resources.json): the free sample pack.
  // The PDF must exist under assets/free-resources/ and its byte size
  // must match the data file, or the build fails — so a paid PDF can
  // never be published as a free download by mistake.
  if (!fs.existsSync(FREE_DATA_FILE)) fail("missing " + FREE_DATA_FILE);
  if (!fs.existsSync(FREE_TEMPLATE)) fail("missing " + FREE_TEMPLATE);
  const FREE = JSON.parse(fs.readFileSync(FREE_DATA_FILE, "utf8"));
  for (const f of ["slug", "title", "file", "pages", "ages", "format", "fileSize", "fileBytes", "seoTitle", "metaDescription", "heroHeading", "heroIntro", "lastmod"]) {
    if (FREE[f] === undefined || FREE[f] === null || FREE[f] === "") fail("data/free-resources.json is missing required field: " + f);
  }
  if (!FREE.file.startsWith("assets/free-resources/")) fail("data/free-resources.json: file must live under assets/free-resources/ (got: " + FREE.file + ")");
  const pdfPath = path.join(ROOT, FREE.file);
  if (!fs.existsSync(pdfPath)) fail("free PDF not found: " + FREE.file);
  const pdfSize = fs.statSync(pdfPath).size;
  if (pdfSize !== FREE.fileBytes) fail("free PDF size mismatch: " + FREE.file + " is " + pdfSize + " bytes, data/free-resources.json says " + FREE.fileBytes);
  if (!FREE.contents || FREE.contents.length < 1) fail("data/free-resources.json: contents is required");
  if (!FREE.faqs || FREE.faqs.length < 1) fail("data/free-resources.json: faqs is required");

  // Blog articles (data/articles.json): the blog's single source of truth.
  if (!fs.existsSync(ARTICLES_FILE)) fail("missing " + ARTICLES_FILE);
  if (!fs.existsSync(ARTICLE_TEMPLATE)) fail("missing " + ARTICLE_TEMPLATE);
  if (!fs.existsSync(BLOG_INDEX_TEMPLATE)) fail("missing " + BLOG_INDEX_TEMPLATE);
  const ARTICLES = JSON.parse(fs.readFileSync(ARTICLES_FILE, "utf8"));
  if (!ARTICLES.blogHome || !ARTICLES.blogHome.seoTitle || !ARTICLES.blogHome.metaDescription) fail("data/articles.json: blogHome seoTitle/metaDescription are required");
  if (ARTICLES.blogHome.metaDescription.length < 120 || ARTICLES.blogHome.metaDescription.length > 160) fail("data/articles.json: blogHome metaDescription must be 120-160 characters");
  const blogCats = (CATS.categories.find((c) => c.id === "blog") || {}).categories || [];
  if (!blogCats.length) fail("data/categories.json: blog.categories (the fixed category list) is required");
  const articleSlugs = new Set();
  for (const a of (ARTICLES.articles || [])) {
    for (const f of ["slug", "title", "seoTitle", "metaDescription", "datePublished", "category", "coverImage", "coverAlt", "excerpt", "status"]) {
      if (a[f] === undefined || a[f] === null || a[f] === "") fail("article " + (a.slug || "?") + " is missing required field: " + f);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a.datePublished)) fail("article " + a.slug + ": datePublished must be YYYY-MM-DD");
    if (a.metaDescription.length < 120 || a.metaDescription.length > 160) fail("article " + a.slug + ": metaDescription must be 120-160 characters (got " + a.metaDescription.length + ")");
    if (!blogCats.includes(a.category)) fail("article " + a.slug + ": category must be one of the fixed list: " + blogCats.join(", "));
    if (!a.tags || !a.tags.length) fail("article " + a.slug + ": tags is required");
    if (!a.coverImage.startsWith("assets/blog/")) fail("article " + a.slug + ": coverImage must live under assets/blog/");
    if (!fs.existsSync(path.join(ROOT, a.coverImage))) fail("article cover image not found: " + a.coverImage);
    if (!a.content || !a.content.length) fail("article " + a.slug + ": content is required");
    for (const b of a.content) {
      if (!["lead", "h2", "h3", "p", "ul", "cta"].includes(b.t)) fail("article " + a.slug + ": unknown content block type: " + b.t);
      if (b.t === "ul" && (!b.items || !b.items.length)) fail("article " + a.slug + ": ul block needs items");
      if (b.t === "cta" && (!b.title || !b.text || !b.links || !b.links.length)) fail("article " + a.slug + ": cta block needs title, text and links");
    }
    if (articleSlugs.has(a.slug)) fail("duplicate article slug: " + a.slug);
    articleSlugs.add(a.slug);
  }
  const publishedArticles = (ARTICLES.articles || []).filter((a) => a.status === "published");
  const draftArticles = (ARTICLES.articles || []).filter((a) => a.status !== "published");
  if (draftArticles.length) console.log("skipping draft articles (no page, no sitemap entry): " + draftArticles.map((d) => d.slug).join(", "));
  for (const a of (ARTICLES.articles || [])) {
    for (const rel of (a.relatedArticles || [])) {
      if (!articleSlugs.has(rel)) fail("article " + a.slug + ": related article does not exist: " + rel);
    }
  }
  // Inline + CTA links must point at a page this generator writes.
  const articleFiles = new Set(["blog/index.html"]);
  for (const a of publishedArticles) articleFiles.add("blog/" + a.slug + ".html");
  for (const f of articleFiles) writtenFiles.add(f);
  const linkable = new Set([...writtenFiles]);
  function checkArticleLink(a, href) {
    if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("#")) fail("article " + a.slug + ": links must be site-relative paths: " + href);
    let filePart = href.replace(/^\//, "").split("#")[0].split("?")[0];
    if (filePart === "") filePart = "index.html";
    if (filePart.endsWith("/")) filePart += "index.html";
    if (!linkable.has(filePart)) fail("article " + a.slug + ": link points at a file the generator does not write: " + href);
  }
  for (const a of (ARTICLES.articles || [])) {
    const text = JSON.stringify(a.content || []);
    for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) checkArticleLink(a, m[1]);
    for (const b of (a.content || []).filter((x) => x.t === "cta")) {
      for (const l of (b.links || [])) checkArticleLink(a, l.href);
    }
  }

  if (onlySlug) {
    if (onlySlug.startsWith("article:")) {
      const aslug = onlySlug.slice("article:".length);
      const a = ARTICLES.articles.find((x) => x.slug === aslug);
      if (!a) fail("no article with slug '" + aslug + "'");
      if (a.status !== "published") fail("article '" + aslug + "' is not published (status: " + a.status + ") — nothing generated");
      writeFile(path.join(ROOT, "blog", a.slug + ".html"), renderArticle(a, ARTICLES.articles), false);
      writeFile(path.join(ROOT, "blog", "index.html"), renderBlogIndex(publishedArticles, ARTICLES.blogHome), false);
      console.log("done. 1 article generated: blog/" + a.slug + ".html + blog/index.html (sitemap.xml and llms.txt untouched)");
      return;
    }
    const p = products.find((x) => x.slug === onlySlug);
    if (!p) fail("no product with slug '" + onlySlug + "'");
    if (p.status !== "published") fail("product '" + onlySlug + "' is not published (status: " + p.status + ") — nothing generated");
    writeFile(path.join(ROOT, "books", p.slug + ".html"), renderBook(p, products), false);
    console.log("done. 1 page generated: books/" + p.slug + ".html (sitemap.xml and llms.txt untouched)");
    return;
  }

  // --all / --check
  for (const p of published) {
    writeFile(path.join(ROOT, "books", p.slug + ".html"), renderBook(p, products), checkOnly);
  }
  // Static pages share the header/footer partials; they are generated
  // from templates/ so the chrome can never drift between pages.
  // refund-policy.html stays a draft: generated, but unlinked from the
  // footer (listed in the sitemap since Part 4) until approved + legally reviewed.
  // The homepage is rendered by renderHome (Part 3) so its "Latest from
  // the blog" section always shows the three newest articles.
  writeFile(path.join(ROOT, "index.html"), renderHome(publishedArticles), checkOnly);
  const statics = [
    ["privacy.html", "privacy.html", "", false],
    ["terms.html", "terms.html", "", false],
    ["404.html", "404.html", "", false],
    ["refund-policy.html", "refund-policy.html", "", false],
  ];
  for (const [templateName, outName, prefix, isHome] of statics) {
    writeFile(path.join(ROOT, outName), renderStaticPage(templateName, outName, prefix, isHome), checkOnly);
  }
  // Free resources page (free-printables/index.html). Its nav item and
  // category are activated by data/navigation.json + data/categories.json.
  writeFile(path.join(ROOT, "free-printables", "index.html"), renderFreePage(FREE, published), checkOnly);
  // Blog: listing page + one page per published article.
  for (const a of publishedArticles) {
    writeFile(path.join(ROOT, "blog", a.slug + ".html"), renderArticle(a, ARTICLES.articles), checkOnly);
  }
  writeFile(path.join(ROOT, "blog", "index.html"), renderBlogIndex(publishedArticles, ARTICLES.blogHome, (CATS.categories.find((c) => c.id === "blog") || {}).categories || []), checkOnly);
  // Part 3 section landing pages (data/sections.json).
  for (const s of SECTIONS.sections) {
    writeFile(path.join(ROOT, s.path), renderSectionPage(s, published, RESOURCES), checkOnly);
  }
  // Part 5 free resource detail pages (data/resources.json).
  for (const r of RESOURCES) {
    writeFile(path.join(ROOT, "free-resources", r.slug, "index.html"), renderResourcePage(r), checkOnly);
  }
  writeFile(path.join(ROOT, "sitemap.xml"), renderSitemap(published, site, publishedArticles, SECTIONS.sections, RESOURCES), checkOnly);
  writeFile(path.join(ROOT, "llms.txt"), renderLlms(published, site, FREE, publishedArticles, SECTIONS.sections, RESOURCES), checkOnly);
  writeFile(path.join(ROOT, "js", "products.js"), renderProductsJs(DATA), checkOnly);
  console.log("done. " + published.length + " book pages + index.html + " + statics.length + " static pages + free-printables/index.html + " + publishedArticles.length + " article page(s) + blog/index.html + " + SECTIONS.sections.length + " section page(s) + " + RESOURCES.length + " resource page(s) + sitemap.xml + llms.txt + js/products.js" + (checkOnly ? " (dry run — nothing written)" : ""));
}

main();
