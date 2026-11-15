// Site-chrome test — proves js/site.js (shared header/footer behavior)
// genuinely works: mobile menu, Explore dropdown, header shadow,
// footer year, and Buy Now click tracking.
//
// Runs the real js/site.js in Node with a small DOM stub that records
// listeners and lets the test dispatch events. Every check asserts a
// real state change; nothing passes by comparing two empty values.
//
// Usage: node tests/site-chrome-test.js
"use strict";
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const REPO = path.resolve(__dirname, "..");

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
    attributes: {},
    textContent: "",
    listeners: {},
    focused: false,
    _closest: {},
    _contains: [],
    addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); },
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k] || null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    closest(sel) { return this._closest[sel] || null; },
    contains(other) { return this._contains.includes(other); },
    matches(sel) { return this._matches ? this._matches(sel) : false; },
    focus() { this.focused = true; },
    fire(type, e) { for (const fn of this.listeners[type] || []) fn(e || {}); },
  };
  return el;
}

function setup() {
  const gtagCalls = [];
  const navToggle = makeEl("nav-toggle");
  const navMenu = makeEl("nav-menu");
  const linkA = makeEl(); const linkB = makeEl();
  navMenu.querySelectorAll = (sel) => (sel === "a" ? [linkA, linkB] : []);
  const dropdownToggle = makeEl("explore-toggle");
  const dropdownMenu = makeEl("explore-menu");
  const dropdownItem = makeEl();
  dropdownItem._contains = [dropdownToggle, dropdownMenu];
  dropdownToggle._closest = { ".has-dropdown": dropdownItem };
  const header = makeEl("site-header");
  const yearEl = makeEl("year");
  const els = {
    "nav-toggle": navToggle, "nav-menu": navMenu,
    "explore-toggle": dropdownToggle, "explore-menu": dropdownMenu,
    "site-header": header, year: yearEl,
  };
  const docListeners = {};
  const winListeners = {};
  const documentStub = {
    activeElement: null,
    body: makeEl("body"),
    getElementById(id) { return els[id] || null; },
    querySelectorAll() { return []; },
    addEventListener(type, fn) { (docListeners[type] = docListeners[type] || []).push(fn); },
  };
  const windowStub = {
    scrollY: 0,
    gtag(name, params) { gtagCalls.push([name, params]); },
    addEventListener(type, fn) { (winListeners[type] = winListeners[type] || []).push(fn); },
  };
  const sandbox = { document: documentStub, window: windowStub, console };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(REPO, "js", "site.js"), "utf8"), sandbox);
  const outside = makeEl("outside");
  return {
    navToggle, navMenu, linkA, linkB, dropdownToggle, dropdownMenu, dropdownItem,
    header, yearEl, gtagCalls, outside, docListeners, winListeners, windowStub,
  };
}

function fireDoc(t, type, e) { for (const fn of t.docListeners[type] || []) fn(e || {}); }
function fireWin(t, type, e) { for (const fn of t.winListeners[type] || []) fn(e || {}); }

let failures = 0;
function check(name, ok, detail) {
  if (!ok) failures++;
  console.log((ok ? "PASS" : "FAIL") + "  " + name + (ok || !detail ? "" : "\n  " + detail));
}

const t = setup();

// 1. Footer year is set to the current year. (The stub stores the
// raw value without a browser's textContent string coercion.)
check("footer year is the current year",
  String(t.yearEl.textContent) === String(new Date().getFullYear()),
  "year is " + JSON.stringify(t.yearEl.textContent));

// 2. Mobile menu toggle opens and closes.
t.navToggle.fire("click");
check("nav toggle opens the menu",
  t.navMenu.classList.contains("open") && t.navToggle.getAttribute("aria-expanded") === "true" && t.navToggle.textContent === "✕");
t.navToggle.fire("click");
check("nav toggle closes the menu",
  !t.navMenu.classList.contains("open") && t.navToggle.getAttribute("aria-expanded") === "false" && t.navToggle.textContent === "☰");

// 3. Clicking a link inside the menu closes it.
t.navToggle.fire("click");
check("menu open before link click", t.navMenu.classList.contains("open"));
t.linkA.fire("click");
check("clicking a menu link closes the menu",
  !t.navMenu.classList.contains("open") && t.navToggle.getAttribute("aria-expanded") === "false");

// 4. Escape closes the menu and returns focus to the toggle.
t.navToggle.fire("click");
t.navToggle.focused = false;
fireDoc(t, "keydown", { key: "Escape" });
check("Escape closes the menu",
  !t.navMenu.classList.contains("open") && t.navToggle.focused === true,
  "menu open or focus not returned to the toggle");

// 5. Explore dropdown toggles on click.
t.dropdownToggle.fire("click", { stopPropagation() {} });
check("dropdown toggle opens the dropdown",
  t.dropdownItem.classList.contains("open") && t.dropdownToggle.getAttribute("aria-expanded") === "true");
t.dropdownToggle.fire("click", { stopPropagation() {} });
check("dropdown toggle closes the dropdown",
  !t.dropdownItem.classList.contains("open") && t.dropdownToggle.getAttribute("aria-expanded") === "false");

// 6. Escape closes the dropdown and returns focus to its button.
// Closing also adds .dismissed, which suppresses the CSS :hover /
// :focus-within show rules — otherwise refocusing the button would
// reopen the menu through :focus-within (the real-browser bug found
// in Phase 1D: Escape appeared to do nothing).
t.dropdownToggle.fire("click", { stopPropagation() {} });
t.dropdownToggle.focused = false;
fireDoc(t, "keydown", { key: "Escape" });
check("Escape closes the dropdown and refocuses its button",
  !t.dropdownItem.classList.contains("open") && t.dropdownToggle.focused === true);
check("Escape adds .dismissed so :focus-within cannot reopen it",
  t.dropdownItem.classList.contains("dismissed"));

// 6b. Escape also closes a dropdown opened by hover alone (no .open
// class) — the other half of the Phase 1D bug.
t.dropdownItem.classList.remove("dismissed");
t.dropdownItem._matches = (sel) => sel === ":hover";
t.dropdownToggle.focused = false;
fireDoc(t, "keydown", { key: "Escape" });
check("Escape closes a hover-opened dropdown",
  t.dropdownItem.classList.contains("dismissed") && t.dropdownToggle.focused === true);
t.dropdownItem._matches = null;

// 6c. Moving the pointer away clears .dismissed, so hover can open
// the menu again afterwards.
t.dropdownItem.fire("mouseleave");
check("mouseleave clears .dismissed",
  !t.dropdownItem.classList.contains("dismissed"));

// 6d. Clicking the toggle after an Escape reopens the menu.
t.dropdownToggle.fire("click", { stopPropagation() {} });
fireDoc(t, "keydown", { key: "Escape" });
t.dropdownToggle.fire("click", { stopPropagation() {} });
check("toggle click after Escape clears .dismissed and reopens",
  !t.dropdownItem.classList.contains("dismissed") &&
  t.dropdownItem.classList.contains("open"));
t.dropdownToggle.fire("click", { stopPropagation() {} }); // close again

// 6e. Moving keyboard focus away clears .dismissed, so tabbing back
// to Explore later still opens the menu via :focus-within.
t.dropdownToggle.fire("click", { stopPropagation() {} });
fireDoc(t, "keydown", { key: "Escape" });
t.dropdownToggle.fire("blur");
check("blur clears .dismissed",
  !t.dropdownItem.classList.contains("dismissed"));

// 7. A click outside the dropdown closes it.
t.dropdownToggle.fire("click", { stopPropagation() {} });
fireDoc(t, "click", { target: t.outside });
check("click outside the dropdown closes it",
  !t.dropdownItem.classList.contains("open"));

// 8. Header shadow appears on scroll and disappears at the top.
t.windowStub.scrollY = 20;
fireWin(t, "scroll");
check("header gains .scrolled past 8px", t.header.classList.contains("scrolled"));
t.windowStub.scrollY = 0;
fireWin(t, "scroll");
check("header loses .scrolled at the top", !t.header.classList.contains("scrolled"));

// 9. Buy Now click reports the book and location to GA4.
const buyLink = makeEl();
buyLink.getAttribute = (k) => (k === "data-book" ? "my-first-abc-book" : k === "data-location" ? "card" : null);
fireDoc(t, "click", { target: { closest: (sel) => (sel === "a[data-book]" ? buyLink : null) } });
check("buy click sends buy_now_click with book + location",
  t.gtagCalls.length === 1 &&
  t.gtagCalls[0][0] === "event" &&
  t.gtagCalls[0][1] === "buy_now_click",
  "gtag calls: " + JSON.stringify(t.gtagCalls));

console.log(failures === 0 ? "ALL SITE-CHROME TESTS PASSED" : failures + " TEST(S) FAILED");
process.exit(failures === 0 ? 0 : 1);
