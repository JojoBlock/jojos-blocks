// Homepage render + interaction test — proves the CURRENT js/main.js
// renders the homepage identically to the Phase 1A baseline, and that
// the product modal genuinely opens and closes.
//
// Runs the real js/main.js in Node with a minimal DOM stub, twice:
// once with the Phase 1A products.js (tests/fixtures/products-phase1a.js,
// extracted from commit 95ec7f2), once with the generated one.
// NOTE (14 Nov 2026): the fixture's three null ages were updated to the
// owner-approved ranges (Animal Explorer 3–6, Community Helpers 4–7,
// Bundle 2–7) — the only difference from the Phase 1A extract. The
// tagline and discountCode in the fixture are still the Phase 1A values;
// main.js falls back to "JOJOS10" when SITE_CONFIG.discountCode is
// absent, so the price rendering is unaffected.
// Compares: product-grid HTML, book-count text, modal HTML for every
// book (via simulated View Details click), and the #book-<slug> deep link.
//
// CORRECTION (14 Nov 2026, Phase 1C): the old harness used the hash
// "#book-03" for the deep-link test. That never matched a product —
// slugs are full names like "my-first-animal-explorer" — so the modal
// stayed empty in both runs and the check passed vacuously. It had
// nothing to do with DOMContentLoaded: main.js does not use that event
// at all, it runs immediately (the script sits at the end of <body>)
// and calls openFromHash() directly. This version uses a real slug,
// asserts the modal actually opens with content, and adds close +
// hashchange tests. A test that cannot execute is reported as such;
// nothing here is allowed to pass by comparing two empty values.
//
// Usage: node tests/homepage-render-test.js
"use strict";
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const REPO = path.resolve(__dirname, "..");
const BASELINE = path.resolve(__dirname, "fixtures", "products-phase1a.js");

function makeClassList() {
  const s = new Set();
  return {
    add: (c) => s.add(c),
    remove: (c) => s.delete(c),
    toggle: (c, force) => {
      const want = force === undefined ? !s.has(c) : !!force;
      if (want) s.add(c); else s.delete(c);
      return want;
    },
    contains: (c) => s.has(c),
  };
}

function makeEl(id) {
  const el = {
    id: id || "",
    classList: makeClassList(),
    style: {},
    attributes: {},
    innerHTML: "",
    textContent: "",
    value: "",
    disabled: false,
    listeners: {},
    addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); },
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k] || null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    closest() { return null; },
    focus() {},
    reset() {},
    scrollIntoView() {},
  };
  return el;
}

function run(productsFile, hash) {
  const els = {};
  const docListeners = {};
  const winListeners = {};
  const replaceCalls = [];
  const documentStub = {
    documentElement: makeEl("html"),
    activeElement: null,
    body: makeEl("body"),
    getElementById(id) { return (els[id] = els[id] || makeEl(id)); },
    querySelectorAll() { return []; },
    addEventListener(type, fn) { (docListeners[type] = docListeners[type] || []).push(fn); },
  };
  const windowStub = {
    location: { hash: hash || "" },
    scrollY: 0,
    addEventListener(type, fn) { (winListeners[type] = winListeners[type] || []).push(fn); },
  };
  const sandbox = {
    document: documentStub,
    window: windowStub,
    history: { replaceState() { replaceCalls.push(Array.from(arguments)); } },
    setTimeout, clearTimeout,
    console,
  };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(productsFile, "utf8"), sandbox);
  vm.runInContext(fs.readFileSync(path.join(REPO, "js", "main.js"), "utf8"), sandbox);
  return { els, docListeners, winListeners, windowStub, replaceCalls, sandbox };
}

function clickDetails(runResult, bookId) {
  const fakeEvent = {
    target: {
      closest(sel) {
        if (sel === "[data-details]") return { getAttribute: () => bookId };
        return null;
      },
    },
  };
  for (const fn of runResult.docListeners.click || []) fn(fakeEvent);
  return runResult.els["modal-body"].innerHTML;
}

function fireKeydown(runResult, key) {
  const e = { key, shiftKey: false, preventDefault() {} };
  for (const fn of runResult.docListeners.keydown || []) fn(e);
}

function fireHashchange(runResult) {
  for (const fn of runResult.winListeners.hashchange || []) fn({});
}

const results = {};
for (const [label, file] of [
  ["baseline", BASELINE],
  ["generated", path.join(REPO, "js", "products.js")],
]) {
  const r = run(file, "");
  const modals = {};
  for (const id of ["book-01", "book-02", "book-03", "book-04", "book-05"]) {
    modals[id] = clickDetails(r, id);
  }
  // Deep link with a REAL slug: the modal must open with content.
  const deep = run(file, "#book-my-first-animal-explorer");
  results[label] = {
    grid: r.els["product-grid"].innerHTML,
    bookCount: r.els["book-count"].textContent,
    // NOTE: the footer year is set by js/site.js, not main.js — it is
    // covered by tests/site-chrome-test.js, not here.
    modals,
    deepLinkModal: deep.els["modal-body"].innerHTML,
    deepLinkModalOpen: deep.els["product-modal"].classList.contains("open"),
  };
}

let failures = 0;
function check(name, ok, detail) {
  if (!ok) failures++;
  console.log((ok ? "PASS" : "FAIL") + "  " + name + (ok || !detail ? "" : "\n  " + detail));
}
function checkEq(name, a, b) {
  const ok = a === b;
  if (!ok) failures++;
  console.log((ok ? "PASS" : "FAIL") + "  " + name);
  if (!ok) {
    console.log("  baseline : " + String(a).slice(0, 200));
    console.log("  generated: " + String(b).slice(0, 200));
  }
}
checkEq("product-grid HTML (5 cards)", results.baseline.grid, results.generated.grid);
checkEq("book-count text", results.baseline.bookCount, results.generated.bookCount);
for (const id of ["book-01", "book-02", "book-03", "book-04", "book-05"]) {
  checkEq("modal HTML for " + id, results.baseline.modals[id], results.generated.modals[id]);
}
// Price presentation: every card and every modal shows the
// crossed-out original, a 10% OFF badge, the large final price and
// the code line. Percentages are computed from the data, so these
// checks pin the exact rendered values.
const gridHTML = results.generated.grid;
check("cards: 5 crossed-out original prices",
  (gridHTML.match(/class="price-was"/g) || []).length === 5,
  "expected 5 price-was spans in the grid");
check("cards: 5 10% OFF badges",
  (gridHTML.match(/10% OFF/g) || []).length === 5,
  "expected 5 10% OFF badges in the grid");
check("cards: 5 JOJOS10 code lines",
  (gridHTML.match(/JOJOS10 applied at checkout/g) || []).length === 5,
  "expected 5 JOJOS10 code lines in the grid");
for (const [id, was, now] of [
  ["book-01", "$3.99", "$3.59"],
  ["book-02", "$4.99", "$4.49"],
  ["book-03", "$4.99", "$4.49"],
  ["book-04", "$4.99", "$4.49"],
  ["book-05", "$12.99", "$11.69"]]) {
  const m = results.generated.modals[id];
  check("modal " + id + " price: " + was + " crossed out, " + now + " final",
    m.includes('<span class="price-was">' + was + "</span>") &&
    m.includes('<span class="price-now">' + now + "</span>") &&
    m.includes("10% OFF") &&
    m.includes("JOJOS10 applied at checkout"),
    "modal price block missing or wrong for " + id);
}
// Deep link: must genuinely open with the right product's content.
check("deep-link #book-my-first-animal-explorer opens modal",
  results.generated.deepLinkModalOpen === true,
  "modal did not open on a real-slug deep link");
check("deep-link modal contains the product title",
  results.generated.deepLinkModal.includes("My First Animal Explorer"),
  "modal body has no product title — the deep link did not render");
// Escape closes the modal and returns the URL to #books.
const esc = run(path.join(REPO, "js", "products.js"), "#book-my-first-animal-explorer");
check("deep-link modal starts open (Escape test setup)",
  esc.els["product-modal"].classList.contains("open"), "modal was not open before Escape");
fireKeydown(esc, "Escape");
check("Escape closes the modal",
  !esc.els["product-modal"].classList.contains("open") && esc.els["product-modal"].getAttribute("aria-hidden") === "true",
  "modal still open after Escape");
check("closing the modal returns the URL to #books",
  esc.replaceCalls.some((c) => c[2] === "#books"),
  "history.replaceState was never called with #books — got: " + JSON.stringify(esc.replaceCalls));
// hashchange: navigating to a product hash opens it; leaving closes it.
const hc = run(path.join(REPO, "js", "products.js"), "");
check("no modal open on plain load", !hc.els["product-modal"].classList.contains("open"));
hc.windowStub.location.hash = "#book-my-little-space-adventure";
fireHashchange(hc);
check("hashchange to #book-my-little-space-adventure opens its modal",
  hc.els["product-modal"].classList.contains("open") && hc.els["modal-body"].innerHTML.includes("My Little Space Adventure"),
  "modal did not open on hashchange");
hc.windowStub.location.hash = "#books";
fireHashchange(hc);
check("hashchange away from a product closes the modal",
  !hc.els["product-modal"].classList.contains("open"),
  "modal stayed open after hashchange to #books");
console.log("grid length:", results.generated.grid.length, "chars;",
  "cards:", (results.generated.grid.match(/class="card reveal"/g) || []).length);
console.log("buy links in grid:", [...results.generated.grid.matchAll(/href="(https:\/\/jojosblocks\.gumroad\.com[^"]+)"/g)].map(m => m[1]));
console.log(failures === 0 ? "ALL HOMEPAGE RENDER + INTERACTION TESTS PASSED" : failures + " TEST(S) FAILED");
process.exit(failures === 0 ? 0 : 1);
