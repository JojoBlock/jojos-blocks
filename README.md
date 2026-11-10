# JoJo’s Blocks — Children's Coloring Book Storefront

Brand name: **JoJo’s Blocks** (renamed from the working name “Rainbow Pages” on 8 Nov 2026. To change it again, update `js/products.js` → `SITE_CONFIG.brandName`, plus the `<title>` and JSON-LD in `index.html`).

This website is **unpublished**. Do not share it publicly until you have filled in your real books and checked the launch checklist below.

## What was built
Complete landing page / storefront in vanilla HTML5, CSS3 and JavaScript — no framework, no internal checkout. Purchase buttons link out to Gumroad checkout (connected 9 Nov 2026). Business focus: digital PDF coloring books only, for parents and children.
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

### Gumroad purchase links — connected 9 Nov 2026
Gumroad checkout is now connected. In `js/products.js` each book's `pdfUrl` holds its real Gumroad product link, and the detail popup uses the same link. The five links (all verified, products still unpublished drafts on Gumroad — their pages say "not currently for sale" until published):
- My First ABC Book — https://jojosblocks.gumroad.com/l/my-first-abc-book
- My First Animal Explorer — https://jojosblocks.gumroad.com/l/my-first-animal-explorer
- My Little Community Helpers — https://jojosblocks.gumroad.com/l/my-little-community-helpers
- My Little Space Adventure — https://jojosblocks.gumroad.com/l/my-little-space-adventure
- Complete 4-Book Bundle (book-05, 154 pages, cover `assets/covers/bundle-cover.jpg`) — https://jojosblocks.gumroad.com/l/jojos-blocks-coloring-bundle
The bundle link slug is `jojos-blocks-coloring-bundle` — the spelling `jojosblocks-coloring-bundle` (no hyphen) returns a Gumroad 404, so do not use it. To change a link, edit only that book's `pdfUrl` in `js/products.js`. Leave it as `null` if a book should not be for sale — the button will then read “buy link unavailable”.

### Add a fifth or sixth book
Copy one whole product block in `js/products.js`, paste it after the last one, and give it a new `id` (e.g. `book-05`) and a new `slot` (e.g. `"Book 5"`). Fill in its fields the same way. The card, detail modal and book count update automatically. Add a comma after the previous book's closing `}` if there was not one already.

### If something breaks after editing
- Check you did not delete a quotation mark, comma or closing `}` — that is the most common cause.
- Undo your last change, save, and refresh the page.
- If a card disappears, open the browser console (F12) — a JavaScript error there usually names the line in `js/products.js`.

## Replace the domain placeholder
Live domain is https://jojosblocks.online (set at launch, 10 Nov 2026) in: `index.html` (canonical, Open Graph/Twitter, JSON-LD), `js/products.js` (`SITE_CONFIG.domain`), `sitemap.xml`, `robots.txt`, plus a `CNAME` file. Also update `SITE_CONFIG.contactEmail` in `js/products.js` when you have a contact email — until then no contact line is shown in the footer.

## Audit — 9 Nov 2026
A full audit found and fixed these genuine problems (design and colours unchanged):
- **Product cards were invisible.** The cards were rendered by JavaScript *after* the scroll-reveal setup, so they were never observed and stayed at opacity 0. Cards are now rendered before the reveal setup, so they appear normally.
- **Visitors could see owner instructions.** Product titles, descriptions, the collection note, the modal note, the purchase-link message, the newsletter note and the footer all mentioned `js/products.js` / `README.md` or "Email address to be added". All visitor-facing copy is now written for visitors; the editing instructions live only in this README and in code comments.
- **Confusing copy fixed:** the second hero button said "Discover Our Collection" but linked to About (now "Browse the Collection", links to the books); a hero badge implied a choice of formats (now "Digital PDF — Print at home, again & again"); How to Buy steps 2 and 3 said almost the same thing (step 3 is now "Get your PDF", step 4 "Print & colour"); the About section carried a defensive "We do not claim awards…" line (removed); "Activity Books" wording was removed from the title and metadata — the brand is coloring books only.
- **Small technical fixes:** the purchase-link `rel` no longer claims `sponsored`; the newsletter message no longer says your email was "noted in this browser" (it is not stored anywhere); FAQ answers can now expand to 480px instead of 320px; Privacy Policy and Terms pages now have meta descriptions.
- **Unpublished site kept out of search:** the page meta robots tag was `index, follow` and `robots.txt` allowed all crawlers, even though the site is unpublished. Both are now set to block indexing/crawling until launch (see the launch checklist for how to flip them back).
- Still needed from you before launch: real book details, a contact email, a real domain, and legal review of Privacy/Terms. The GitHub repository was also found showing as **Public** on 9 Nov 2026 even though it was set to Private on 8 Nov — check its visibility in GitHub Settings before sharing anything.

## Preview ↔ GitHub reconciliation — 9 Nov 2026
The hosted preview had picked up extra improvements that were not in the GitHub source. They are now all in this source (and on GitHub): book-detail modal is focus-trapped, titled by the book name and returns focus when closed; FAQ buttons use `aria-controls`/ids and the answers stay visible if JavaScript is off; light/dark `theme-color` tags; FAQ structured data (JSON-LD) matches the visible FAQ word for word; hero second button reads “See How Buying Works” and links to How to Buy; footer book links show the real titles; footer contact line removed at launch (10 Nov 2026) until a real email is set; Books 3–4 covers and the About photo load eagerly with their 600×849 shape reserved; collection intro and the yellow parents' note rewritten; newsletter note shortened. Design, colours and typography unchanged. The full-cover fix (`object-fit: contain`, 600×849) was already on GitHub before this — see commit `1db03655`.

## Final audit — 9 Nov 2026
A final visual and functional audit of the preview passed: all four covers display complete and uncropped; cards and descriptions match the real books; desktop and mobile layouts have no sideways scrolling; navigation, mobile menu, FAQ, book popup and newsletter form all work; the newsletter was tested live against the sheet (valid signup saved, duplicate blocked, invalid rejected — test rows removed afterwards). The audit's fixes, now also in this source: the Privacy Policy and Terms pages no longer carry "placeholder" labels (replaced with plain closing sentences — the pages still need a qualified adviser's review before launch, see the checklist below). The audit noted one capture quirk, not a page fault: in its own full-page screenshots, below-fold covers occasionally painted blank even though every image loaded — the covers use eager loading with their shape reserved to paint promptly.

## Newsletter
The form is live since 9 Nov 2026 (`SITE_CONFIG.newsletterConnected: true`). When a visitor subscribes, the form sends their email address to a small Google Apps Script web app, which appends it to the “JoJo's Blocks subscribers” Google Sheet (columns: Email, Date subscribed). The script's URL lives in `SITE_CONFIG.newsletterEndpoint` in `js/products.js`; the code and deployment steps are in `workspace/goals/jojo-s-blocks-website/newsletter-apps-script.md`. No promotional emails are sent automatically — emails only go out when there is a new book or freebie to share. If the endpoint ever stops working, set `newsletterConnected: false` and the form will show its honest “not connected yet” message again instead of pretending to work.

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
├── assets/favicon.svg      # old favicon (kept, no longer referenced)
├── assets/profile-logo.jpg # brand logo — the exact file used as the Gumroad profile picture (800x800 coral logo, SHA-256 bfeb971a97a94eadca759e9052424f9ce031febc06d0d27651e7bdce590a08b5); also the site favicon and header/footer logo
├── assets/covers/book-01.svg … book-04.svg   # placeholder covers
├── robots.txt
├── sitemap.xml
└── README.md           # this file
```

## Before you publish — checklist
- [x] All books in the collection have real titles, descriptions and covers (added 9 Nov 2026 from the real PDFs).
- [x] Age and page count are filled in, or left as `null` where unknown.
- [x] Real PDF purchase links are in place — all five Gumroad links in `js/products.js` (9 Nov 2026).
- [ ] Contact email added.
- [x] Real domain replaces `www.example.com` everywhere — live domain is https://jojosblocks.online (10 Nov 2026).
- [x] `robots.txt` changed from `Disallow: /` to `Allow: /` and the `index.html` meta robots tag changed from `noindex, nofollow` to `index, follow` (10 Nov 2026, launch).
- [ ] Privacy Policy and Terms reviewed by a qualified adviser.
- [x] Newsletter connected — live since 9 Nov 2026 (Google Sheets + Apps Script).
- [x] No placeholder text (“To be added”, “Book 1”, “link coming soon”) remains on any live book.

## Launch — 10 Nov 2026
- All five Gumroad products PUBLISHED 10 Nov 2026 (ABC $3.99, Animal $4.99, Community Helpers $4.99, Space $4.99, bundle $12.99; JOJOS10 10% off auto-applied on all five). Prices and settings as agreed; nothing published before Aarif's explicit approval that day.
- Website live at https://jojosblocks.online (GitHub Pages, custom domain, `CNAME` file in repo). Repository stays PUBLIC by Aarif's decision 10 Nov 2026 — he cannot afford paid hosting or GitHub plans right now. Do not make it private.
- Buttons read "Buy Now on Gumroad" and link to the published Gumroad products.
- Buy links use Gumroad's direct-checkout format (`?wanted=true` on each product URL), fixed 10 Nov 2026 after customers saw several products together in checkout. Cause: Gumroad keeps a persistent cart in the visitor's browser — clicking "I want this!" on other products leaves them in the cart, and no link format clears a saved cart (verified live: plain link, `?wanted=true` and the buy-now checkout URL all open the same saved cart). A fresh visitor always sees exactly the one product they clicked; returning visitors remove older cart items once. Do not "fix" this by changing product URLs again without re-testing in a fresh private session.

## Per-product deep links — 10 Nov 2026
Each product has its own shareable URL that opens its details modal directly (used as Pinterest Pin destinations):
- My First ABC Book — https://jojosblocks.online/#book-my-first-abc-book
- My First Animal Explorer — https://jojosblocks.online/#book-my-first-animal-explorer
- My Little Community Helpers — https://jojosblocks.online/#book-my-little-community-helpers
- My Little Space Adventure — https://jojosblocks.online/#book-my-little-space-adventure
- Complete Coloring Book Bundle — https://jojosblocks.online/#book-complete-coloring-book-bundle
Implemented in `js/main.js` (`productFromHash` / `openFromHash`; opening a modal sets the hash via `replaceState`, closing it returns to `#books`). Prices are now shown on cards and in the modal from the `price` / `salePrice` fields in `js/products.js` (sale price = with JOJOS10, auto-applied at Gumroad checkout). Cache note: after the 10 Nov 2026 deploy, one CDN edge kept serving the old JS files for over 40 minutes even though the live files were byte-identical to the new version — fixed by versioning the asset URLs in `index.html` (`?v=2` on styles.css, products.js, main.js). Bump the version number whenever these files change again.