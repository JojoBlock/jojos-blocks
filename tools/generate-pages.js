#!/usr/bin/env node
/* JoJo's Blocks — page generator (dependency-free, Node.js only).
 *
 * Reads data/products.json (the ONE central product data source) and
 * data/navigation.json (navigation + category registry) and renders
 * the website's generated files from templates:
 *   - index.html          (homepage, from templates/index.html)
 *   - books/<slug>.html   (one per published product, from templates/book.html)
 *   - privacy.html, terms.html, 404.html, refund-policy.html
 *                         (from templates/<name>.html)
 *   - sitemap.xml         (static pages + published products)
 *   - llms.txt            (product list for AI systems)
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
 *     footer, not in the sitemap) until the owner approves it and it gets
 *     qualified legal review. 404.html is never in the sitemap.
 *   - Free resources are NOT in this file: they live in data/free-resources.json
 *     (created when the first free resource exists) and are generated separately,
 *     so a paid PDF can never be published as a free download by mistake.
 *   - Paid PDF files are never stored in this repository. The only purchase
 *     link is each product's gumroadUrl.
 *   - Existing URLs are preserved: a product page is always books/<slug>.html
 *     and its canonical URL is always <domain>/books/<slug>.html. If a slug
 *     ever has to change, add a redirect and update the canonical by hand —
 *     this script will not do it silently.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_FILE = path.join(ROOT, "data", "products.json");
const NAV_FILE = path.join(ROOT, "data", "navigation.json");
const CATEGORIES_FILE = path.join(ROOT, "data", "categories.json");
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

function navItemsHTML(prefix, isHome) {
  const nav = NAV;
  const lines = [];
  for (const item of nav.top) {
    if (item.status === "menu") {
      // Explore dropdown: live children link out, soon children are text.
      const kids = nav.explore.map((c) => {
        if (c.status === "live") {
          if (!c.href) fail("navigation.json: live category '" + c.id + "' has no href");
          return '        <li><a href="' + escAttr(hrefFor(c.href, prefix, isHome)) + '"><strong>' + escText(c.label) + '</strong><small>' + escText(c.description || "") + '</small></a></li>';
        }
        if (c.href) fail("navigation.json: soon category '" + c.id + "' must not have an href (it has no content yet)");
        return '        <li class="dropdown-soon"><strong>' + escText(c.label) + ' <span class="soon-pill">Soon</span></strong><small>' + escText(c.description || "") + '</small></li>';
      }).join("\n");
      lines.push('        <li class="has-dropdown">');
      lines.push('          <button class="dropdown-toggle" id="explore-toggle" aria-expanded="false" aria-haspopup="true" aria-controls="explore-menu">Explore <span class="chev" aria-hidden="true">⌄</span></button>');
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
    lines.push('        <li><a href="' + escAttr(hrefFor(item.href, prefix, isHome)) + '">' + escText(item.label) + '</a></li>');
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

function chromeFor(prefix, isHome) {
  const headerTpl = fs.readFileSync(path.join(PARTIALS_DIR, "header.html"), "utf8");
  const footerTpl = fs.readFileSync(path.join(PARTIALS_DIR, "footer.html"), "utf8");
  const homeHref = isHome ? "#top" : prefix + "index.html";
  const header = headerTpl
    .replaceAll("{{PREFIX}}", prefix)
    .replaceAll("{{HOME_HREF}}", homeHref)
    .replaceAll("{{NAV_ITEMS}}", navItemsHTML(prefix, isHome));
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

function renderSitemap(published, site) {
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
  const url = (loc, lastmod, changefreq, priority) =>
    `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
  for (const sp of DATA.staticPages) {
    lines.push(url(site.domain + sp.path, sp.lastmod, sp.changefreq, sp.priority));
  }
  // Original order: homepage, then the 5 book pages in data order, then privacy/terms.
  // staticPages holds "/" first; insert the book pages right after it.
  const home = lines.splice(2, 1)[0];
  const bookLines = published.map((p) =>
    url(site.domain + "/books/" + p.slug + ".html", p.lastmod, "monthly", "0.8")
  );
  lines.splice(2, 0, home, ...bookLines);
  lines.push("</urlset>", "");
  return lines.join("\n");
}

function renderLlms(published, site) {
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
    fail("usage: node tools/generate-pages.js --only <slug> | --all | --check");
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
  const writtenFiles = new Set(["index.html", "privacy.html", "terms.html", "404.html", "refund-policy.html", "sitemap.xml", "llms.txt"]);
  for (const p of (DATA.products || [])) writtenFiles.add("books/" + p.slug + ".html");
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

  if (onlySlug) {
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
  // footer and absent from the sitemap until approved + legally reviewed.
  const statics = [
    ["index.html", "index.html", "", true],
    ["privacy.html", "privacy.html", "", false],
    ["terms.html", "terms.html", "", false],
    ["404.html", "404.html", "", false],
    ["refund-policy.html", "refund-policy.html", "", false],
  ];
  for (const [templateName, outName, prefix, isHome] of statics) {
    writeFile(path.join(ROOT, outName), renderStaticPage(templateName, outName, prefix, isHome), checkOnly);
  }
  writeFile(path.join(ROOT, "sitemap.xml"), renderSitemap(published, site), checkOnly);
  writeFile(path.join(ROOT, "llms.txt"), renderLlms(published, site), checkOnly);
  writeFile(path.join(ROOT, "js", "products.js"), renderProductsJs(DATA), checkOnly);
  console.log("done. " + published.length + " book pages + " + statics.length + " static pages + sitemap.xml + llms.txt + js/products.js" + (checkOnly ? " (dry run — nothing written)" : ""));
}

main();
