# JoJo’s Blocks — Children's Coloring Book Storefront

Brand name: **JoJo’s Blocks** (renamed from the working name “Rainbow Pages” on 8 Nov 2026. To change it again, update `js/products.js` → `SITE_CONFIG.brandName`, plus the `<title>` and JSON-LD in `index.html`).

This website is **unpublished**. Do not share it publicly until you have filled in your real books and checked the launch checklist below.

## What was built
Complete landing page / storefront in vanilla HTML5, CSS3 and JavaScript — no framework, no internal checkout, no marketplace or payment integration yet. Business focus: digital PDF coloring books only, for parents and children.
- Header + responsive mobile menu, hero, featured collection, Why Parents Love Our Books, About, How to Buy, FAQ accordion, newsletter (front-end only), footer, product-detail modal.
- Product cards are rendered from `js/products.js`, so adding a book needs no HTML redesign.
- SEO: semantic HTML, unique title/meta description, Open Graph + Twitter cards, canonical placeholder, favicon, `robots.txt`, `sitemap.xml`, Schema.org WebSite JSON-LD.
- Accessibility: skip link, aria labels, keyboard-friendly FAQ/modal, Escape closes modal, focus styles, reduced-motion support.

## The books — placeholders, ready for you to fill in yourself
The product cards are placeholders (`Book 1`–`Book 4` to start with). More books can be added at any time — the collection is not fixed at four. No titles, themes, ages, page counts, descriptions or purchase links have been invented — every field marked “To be added” is genuinely empty. You will add the real information yourself, using your own books. **Do not publish as final until you have filled them in.**

## Beginner's guide: edit a book in 5 minutes
You only need to edit **one file: `js/products.js`**. Open it in any text editor. You do not need to touch `index.html`, `css/styles.css` or `js/main.js`.

Each book is one block that starts with `id: "book-01"` and ends with `}`. Change only the text inside the quotation marks, and keep the quotation marks and commas exactly as they are.

### Worked example — filling in Book 1
Change this:
```js
title: "Book 1 — Title to be added — edit in js/products.js",
theme: "To be added — edit in js/products.js",
age: null,
pages: null,
description: "This product card is waiting for your first PDF...",
```
To this (using *your* book's real details only):
```js
title: "My Real Book Title",
theme: "Animals",
age: "Ages 4–8",
pages: 50,
description: "A short description in your own words, based on the actual book.",
```

### Every field you can change, in plain English
| Field | What to put | Example |
|---|---|---|
| `title` | The book's real title, exactly as on the book | `"Dinosaur Colouring Fun"` |
| `theme` | Its subject, in a few words | `"Dinosaurs"` |
| `age` | Age guidance from the book, or leave `null` if unknown | `"Ages 4–8"` or `null` |
| `pages` | The real page count, or leave `null` if unknown | `50` or `null` |
| `format` | The product format | `"Digital PDF coloring book"` |
| `description` | 1–3 sentences about the real book | Your own words |
| `features` | 3 short bullet points, each in `"quotes"`, separated by commas | `"50 colouring pages"` |
| `cover` | Path to the cover image (see below) | `"assets/covers/book-01.jpg"` |
| `coverAlt` | Short description of the cover, for screen readers and SEO | `"Dinosaur colouring book cover"` |
| `pdfUrl` | The real PDF purchase link, when you have one, or `null` | `"https://example.com/your-pdf-link"` or `null` |

| `seo.focusKeyword` | Main search phrase for this book | `"dinosaur colouring book for kids"` |
| `seo.metaDescription` | 1–2 sentences for search results (under about 155 characters) | Your own words |

**Rules that keep the site honest:**
- Only write what is true of that book. If you do not know the age or page count, leave it as `null` — the site will simply not show it.
- Never paste a guessed purchase link. Leave the field as `null` until you have the real one — the button will then read “link coming soon” instead of sending visitors to a wrong page.
- Do not copy text, images or characters from other people's books.

### Add a cover image
1. Save your cover as a JPG or PNG, e.g. `my-book-cover.jpg`.
2. Put the file in the `assets/covers/` folder.
3. In `js/products.js`, change that book's `cover` line to `"assets/covers/my-book-cover.jpg"`.
4. Update `coverAlt` to describe the cover.

The four placeholder covers in `assets/covers/` are simple original SVG drawings. Replace them with your real covers when you are ready.

### Add a PDF purchase link later
No marketplace or payment system is connected yet. When you are ready to sell a book, in `js/products.js` set its `pdfUrl` to the real purchase link for that PDF:
```js
pdfUrl: "https://example.com/your-real-pdf-link",
```
Leave it as `null` until then — the button will read “link coming soon”.

### Add a fifth or sixth book
Copy one whole product block in `js/products.js`, paste it after the last one, and give it a new `id` (e.g. `book-05`) and a new `slot` (e.g. `"Book 5"`). Fill in its fields the same way. The card, detail modal and book count update automatically. Add a comma after the previous book's closing `}` if there was not one already.

### If something breaks after editing
- Check you did not delete a quotation mark, comma or closing `}` — that is the most common cause.
- Undo your last change, save, and refresh the page.
- If a card disappears, open the browser console (F12) — a JavaScript error there usually names the line in `js/products.js`.

## Replace the domain placeholder
Search the project for `www.example.com` and replace it with your real domain in: `index.html` (canonical, Open Graph/Twitter, JSON-LD), `js/products.js` (`SITE_CONFIG.domain`), `sitemap.xml`, `robots.txt`. Also update `SITE_CONFIG.contactEmail` in `js/products.js` when you have a contact email — until then the footer says “Email address to be added”.

## Newsletter
The form is front-end only (`SITE_CONFIG.newsletterConnected: false`). To make it live, connect an email service (e.g. Mailchimp / ConvertKit / Buttondown), point the form at its endpoint, then set `newsletterConnected: true`.

## Run locally / deploy
```bash
cd ~/workspace/coloring-book-store
python3 -m http.server 8000
# open http://localhost:8000
```
Deploy: upload the whole folder (index.html, css/, js/, assets/, robots.txt, sitemap.xml, privacy.html, terms.html) to any static host — Netlify, Vercel, GitHub Pages, or your web host's public folder. No build step, no server code, no database.

## Project structure
```
coloring-book-store/
├── index.html          # homepage + all sections
├── privacy.html        # placeholder policy — get legal review before launch
├── terms.html          # placeholder terms — get legal review before launch
├── css/styles.css
├── js/products.js      # ★ EDIT BOOKS, LINKS, BRAND, DOMAIN HERE
├── js/main.js          # rendering, modal, FAQ, menu, newsletter — no need to edit
├── assets/favicon.svg
├── assets/covers/book-01.svg … book-04.svg   # placeholder covers
├── robots.txt
├── sitemap.xml
└── README.md           # this file
```

## Before you publish — checklist
- [ ] All books in the collection have real titles, descriptions and covers.
- [ ] Age and page count are filled in, or left as `null` where unknown.
- [ ] Real PDF purchase links are in place (or `null` where a book is not for sale yet).
- [ ] Contact email added.
- [ ] Real domain replaces `www.example.com` everywhere.
- [ ] Privacy Policy and Terms reviewed by a qualified adviser.
- [ ] Newsletter connected, or the form's honest “not connected” note kept.
- [ ] No placeholder text (“To be added”, “Book 1”, “link coming soon”) remains on any live book.
