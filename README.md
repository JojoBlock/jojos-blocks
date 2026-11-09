# JoJo’s Blocks — Children's Coloring Book Storefront

Brand name: **JoJo’s Blocks** (renamed from the working name “Rainbow Pages” on 8 Nov 2026. To change it again, update `js/products.js` → `SITE_CONFIG.brandName`, plus the `<title>` and JSON-LD in `index.html`).

This website is **unpublished**. Do not share it publicly until you have filled in your real books and checked the launch checklist below.

## What was built
Complete landing page / storefront in vanilla HTML5, CSS3 and JavaScript — no framework, no internal checkout, no marketplace or payment integration yet. Business focus: digital PDF coloring books only, for parents and children.
- Header + responsive mobile menu, hero, featured collection, Why Parents Love Our Books, About, How to Buy, FAQ accordion, newsletter (front-end only), footer, product-detail modal.
- Product cards are rendered from `js/products.js`, so adding a book needs no HTML redesign.
- SEO: semantic HTML, unique title/meta description, Open Graph + Twitter cards, canonical placeholder, favicon, `robots.txt`, `sitemap.xml`, Schema.org WebSite JSON-LD.
- Accessibility: skip link, aria labels, keyboard-friendly FAQ/modal, Escape closes modal, focus styles, reduced-motion support.

## The books — real books, added 9 Nov 2026
The four books below were read from Aarif's own PDFs (kept privately in `~/workspace/user/jojos-blocks-books/` — the PDFs themselves are **not** in this repo or on GitHub). Titles, themes, ages and page counts come from the books themselves; ages appear only where the book states them.

| Book | Title | Pages | Age | Cover |
|---|---|---|---|---|
| 1 | My First ABC Book | 28 | Ages 2–4 | `assets/covers/book-01.jpg` |
| 2 | My First Animal Explorer | 30 | — (not stated in the book) | `assets/covers/book-02.jpg` |
| 3 | My Little Community Helpers | 54 | — (not stated in the book) | `assets/covers/book-03.jpg` |
| 4 | My Little Space Adventure | 42 | Ages 3–5 | `assets/covers/book-04.jpg` |

More books can be added at any time — the collection is not fixed at four. Covers are the books' real cover pages, rendered from the PDFs at 600px wide. The old placeholder SVG covers (`book-01.svg` … `book-04.svg`) are still in `assets/covers/` but are no longer used by any page.

## Beginner's guide: edit a book in 5 minutes
You only need to edit **one file: `js/products.js`**. Open it in any text editor. You do not need to touch `index.html`, `css/styles.css` or `js/main.js`.

Each book is one block that starts with `id: "book-01"` and ends with `}`. Change only the text inside the quotation marks, and keep the quotation marks and commas exactly as they are.

### Worked example — filling in Book 1
Change this (Book 1 as it stands now):
```js
title: "My First ABC Book",
theme: "Alphabet • Letters A–Z",
age: "Ages 2–4",
pages: 28,
description: "Meet the alphabet one letter at a time. Each page pairs a big letter with a picture word — A is for Apple, B is for Ball, C is for Cat — with a colour guide and tracing practice, so little ones learn, colour and write their first letters.",
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
Search the project for `www.example.com` and replace it with your real domain in: `index.html` (canonical, Open Graph/Twitter, JSON-LD), `js/products.js` (`SITE_CONFIG.domain`), `sitemap.xml`, `robots.txt`. Also update `SITE_CONFIG.contactEmail` in `js/products.js` when you have a contact email — until then the footer contact line is hidden.

## Audit — 9 Nov 2026
A full audit found and fixed these genuine problems (design and colours unchanged):
- **Product cards were invisible.** The cards were rendered by JavaScript *after* the scroll-reveal setup, so they were never observed and stayed at opacity 0. Cards are now rendered before the reveal setup, so they appear normally.
- **Visitors could see owner instructions.** Product titles, descriptions, the collection note, the modal note, the purchase-link message, the newsletter note and the footer all mentioned `js/products.js` / `README.md` or "Email address to be added". All visitor-facing copy is now written for visitors; the editing instructions live only in this README and in code comments.
- **Confusing copy fixed:** the second hero button said "Discover Our Collection" but linked to About (now "Browse the Collection", links to the books); a hero badge implied a choice of formats (now "Digital PDF — Print at home, again & again"); How to Buy steps 2 and 3 said almost the same thing (step 3 is now "Get your PDF", step 4 "Print & colour"); the About section carried a defensive "We do not claim awards…" line (removed); "Activity Books" wording was removed from the title and metadata — the brand is coloring books only.
- **Small technical fixes:** the purchase-link `rel` no longer claims `sponsored`; the newsletter message no longer says your email was "noted in this browser" (it is not stored anywhere); FAQ answers can now expand to 480px instead of 320px; Privacy Policy and Terms pages now have meta descriptions.
- **Unpublished site kept out of search:** the page meta robots tag was `index, follow` and `robots.txt` allowed all crawlers, even though the site is unpublished. Both are now set to block indexing/crawling until launch (see the launch checklist for how to flip them back).
- Still needed from you before launch: real book details, a contact email, a real domain, and legal review of Privacy/Terms. The GitHub repository was also found showing as **Public** on 9 Nov 2026 even though it was set to Private on 8 Nov — check its visibility in GitHub Settings before sharing anything.

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
- [x] All books in the collection have real titles, descriptions and covers (added 9 Nov 2026 from the real PDFs).
- [ ] Age and page count are filled in, or left as `null` where unknown.
- [ ] Real PDF purchase links are in place (or `null` where a book is not for sale yet).
- [ ] Contact email added.
- [ ] Real domain replaces `www.example.com` everywhere.
- [ ] `robots.txt` changed from `Disallow: /` to `Allow: /` and the `index.html` meta robots tag changed from `noindex, nofollow` to `index, follow` (both are set to keep the unpublished site out of search results until launch).
- [ ] Privacy Policy and Terms reviewed by a qualified adviser.
- [ ] Newsletter connected, or the form's honest “not connected” note kept.
- [ ] No placeholder text (“To be added”, “Book 1”, “link coming soon”) remains on any live book.
