/* ============================================================
   JoJo’s Blocks — Product data
   ------------------------------------------------------------
   HOW TO UPDATE A BOOK — BEGINNER GUIDE
   You only need to edit this file. Do not touch index.html.
   1. Find one book block below (it starts with id: "book-01").
   2. Change only the text inside the quotation marks.
      Keep the quotation marks and commas exactly as they are.
      Example: title: "My Real Book Title",
   3. age: put "Ages 4-8" (in quotes) or leave it as null if unknown.
      pages: put a number, e.g. 50, or leave it as null if unknown.
   4. When you are ready to sell a book, paste its real PDF
      purchase link in pdfUrl. Leave it as null until then —
      the button will show an honest "link coming soon" note
      instead of sending visitors to a wrong page.
      Never paste a guessed link. No marketplace or payment
      system is connected yet.
   Business focus: digital PDF coloring books only.
   5. Replace cover with your own image in assets/covers/
      and update the cover field, e.g. "assets/covers/my-book.jpg"
      Full step-by-step guide, with a worked example, is in README.md.

   HOW TO ADD A BOOK
   Copy one whole { ... } object, paste it after the last one,
   give it a new id (e.g. "book-05"), and the site renders it
   automatically — card, modal, sitemap entry and SEO fields.

   IMPORTANT — PLACEHOLDERS, NOT REAL BOOKS
   No real titles, page counts, ages or themes have been entered
   here. Every field below marked "To be added" is a genuine
   placeholder. Fill each one in yourself from your own books —
   only write what is true of that book. Do NOT publish the site
   as final until those objects are filled in.
   See README.md for the beginner's step-by-step guide.
   ============================================================ */

const SITE_CONFIG = {
  // Brand name — change this one line to rename the site.
  // Also update <title> and the JSON-LD in index.html.
  brandName: "JoJo’s Blocks",
  tagline: "Children's Coloring & Activity Books",
  // Replace with your real domain when you buy one, e.g.
  // "https://www.jojosblocksbooks.com"
  // Then update the same placeholder in index.html, sitemap.xml
  // and robots.txt.
  domain: "https://www.example.com",
  contactEmail: null, // e.g. "hello@example.com" — null = shown as "to be added"
  newsletterConnected: false // true only after an email service is wired up
};

const PRODUCTS = [
  {
    id: "book-01",
    slot: "Book 1",
    title: "Book 1 — Title to be added — edit in js/products.js",
    shortTitle: "Book 1",
    theme: "To be added — edit in js/products.js",
    age: null,            // e.g. "Ages 4–8" — only when the PDF states/supports it
    pages: null,          // e.g. 50 — count the PDF pages, do not guess
    format: "Digital PDF coloring book",
    description: "Placeholder for your first book. Replace this text yourself in js/products.js with a short description of the real book — see README.md for the step-by-step guide. Nothing here is invented from the book.",
    features: [
      "Digital PDF coloring book",
      "Print at home, again and again",
      "Screen-free creative play"
    ],
    cover: "assets/covers/book-01.svg",
    coverAlt: "Placeholder cover for Book 1 — real cover to be added by you in js/products.js",
    pdfUrl: null,  // real PDF purchase link — add later, when you are ready to sell
    seo: {
      focusKeyword: "TO BE ADDED — from the real book title/theme",
      secondaryKeywords: [],
      longTailKeywords: [],
      metaDescription: "TO BE ADDED — write this yourself from the real book. See README.md."
    }
  },
  {
    id: "book-02",
    slot: "Book 2",
    title: "Book 2 — Title to be added — edit in js/products.js",
    shortTitle: "Book 2",
    theme: "To be added — edit in js/products.js",
    age: null,
    pages: null,
    format: "Digital PDF coloring book",
    description: "Placeholder for your second book. Replace this text yourself in js/products.js with a short description of the real book — see README.md for the step-by-step guide. Nothing here is invented from the book.",
    features: [
      "Digital PDF coloring book",
      "Print at home, again and again",
      "Screen-free creative play"
    ],
    cover: "assets/covers/book-02.svg",
    coverAlt: "Placeholder cover for Book 2 — real cover to be added by you in js/products.js",
    pdfUrl: null,  // real PDF purchase link — add later, when you are ready to sell
    seo: {
      focusKeyword: "TO BE ADDED — from the real book title/theme",
      secondaryKeywords: [],
      longTailKeywords: [],
      metaDescription: "TO BE ADDED — write this yourself from the real book. See README.md."
    }
  },
  {
    id: "book-03",
    slot: "Book 3",
    title: "Book 3 — Title to be added — edit in js/products.js",
    shortTitle: "Book 3",
    theme: "To be added — edit in js/products.js",
    age: null,
    pages: null,
    format: "Digital PDF coloring book",
    description: "Placeholder for your third book. Replace this text yourself in js/products.js with a short description of the real book — see README.md for the step-by-step guide. Nothing here is invented from the book.",
    features: [
      "Digital PDF coloring book",
      "Print at home, again and again",
      "Screen-free creative play"
    ],
    cover: "assets/covers/book-03.svg",
    coverAlt: "Placeholder cover for Book 3 — real cover to be added by you in js/products.js",
    pdfUrl: null,  // real PDF purchase link — add later, when you are ready to sell
    seo: {
      focusKeyword: "TO BE ADDED — from the real book title/theme",
      secondaryKeywords: [],
      longTailKeywords: [],
      metaDescription: "TO BE ADDED — write this yourself from the real book. See README.md."
    }
  },
  {
    id: "book-04",
    slot: "Book 4",
    title: "Book 4 — Title to be added — edit in js/products.js",
    shortTitle: "Book 4",
    theme: "To be added — edit in js/products.js",
    age: null,
    pages: null,
    format: "Digital PDF coloring book",
    description: "Placeholder for your fourth book. Replace this text yourself in js/products.js with a short description of the real book — see README.md for the step-by-step guide. Nothing here is invented from the book.",
    features: [
      "Digital PDF coloring book",
      "Print at home, again and again",
      "Screen-free creative play"
    ],
    cover: "assets/covers/book-04.svg",
    coverAlt: "Placeholder cover for Book 4 — real cover to be added by you in js/products.js",
    pdfUrl: null,  // real PDF purchase link — add later, when you are ready to sell
    seo: {
      focusKeyword: "TO BE ADDED — from the real book title/theme",
      secondaryKeywords: [],
      longTailKeywords: [],
      metaDescription: "TO BE ADDED — write this yourself from the real book. See README.md."
    }
  }
];
