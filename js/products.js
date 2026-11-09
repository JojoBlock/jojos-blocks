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
  tagline: "Children's Coloring Books",
  // Replace with your real domain when you buy one, e.g.
  // "https://www.jojosblocksbooks.com"
  // Then update the same placeholder in index.html, sitemap.xml
  // and robots.txt.
  domain: "https://www.example.com",
  contactEmail: null, // e.g. "hello@example.com" — null = the footer contact line stays hidden
  newsletterConnected: false // true only after an email service is wired up
};

const PRODUCTS = [
  {
    id: "book-01",
    slot: "Book 1",
    title: "Book 1 — Coming soon",
    shortTitle: "Book 1",
    theme: "Details coming soon",
    age: null,            // e.g. "Ages 4–8" — only when the PDF states/supports it
    pages: null,          // e.g. 50 — count the PDF pages, do not guess
    format: "Digital PDF coloring book",
    description: "A new JoJo's Blocks coloring book is on its way. Its title, theme, age guidance and page count will appear here once the book is ready.",
    features: [
      "Digital PDF coloring book",
      "Print at home, again and again",
      "Screen-free creative play"
    ],
    cover: "assets/covers/book-01.svg",
    coverAlt: "JoJo's Blocks coloring book cover — details coming soon",
    pdfUrl: null,  // real PDF purchase link — add later, when you are ready to sell
    seo: {
      focusKeyword: "To be added — from the real book title/theme",
      secondaryKeywords: [],
      longTailKeywords: [],
      metaDescription: "To be added — write this from the real book. See README.md."
    }
  },
  {
    id: "book-02",
    slot: "Book 2",
    title: "Book 2 — Coming soon",
    shortTitle: "Book 2",
    theme: "Details coming soon",
    age: null,
    pages: null,
    format: "Digital PDF coloring book",
    description: "A new JoJo's Blocks coloring book is on its way. Its title, theme, age guidance and page count will appear here once the book is ready.",
    features: [
      "Digital PDF coloring book",
      "Print at home, again and again",
      "Screen-free creative play"
    ],
    cover: "assets/covers/book-02.svg",
    coverAlt: "JoJo's Blocks coloring book cover — details coming soon",
    pdfUrl: null,  // real PDF purchase link — add later, when you are ready to sell
    seo: {
      focusKeyword: "To be added — from the real book title/theme",
      secondaryKeywords: [],
      longTailKeywords: [],
      metaDescription: "To be added — write this from the real book. See README.md."
    }
  },
  {
    id: "book-03",
    slot: "Book 3",
    title: "Book 3 — Coming soon",
    shortTitle: "Book 3",
    theme: "Details coming soon",
    age: null,
    pages: null,
    format: "Digital PDF coloring book",
    description: "A new JoJo's Blocks coloring book is on its way. Its title, theme, age guidance and page count will appear here once the book is ready.",
    features: [
      "Digital PDF coloring book",
      "Print at home, again and again",
      "Screen-free creative play"
    ],
    cover: "assets/covers/book-03.svg",
    coverAlt: "JoJo's Blocks coloring book cover — details coming soon",
    pdfUrl: null,  // real PDF purchase link — add later, when you are ready to sell
    seo: {
      focusKeyword: "To be added — from the real book title/theme",
      secondaryKeywords: [],
      longTailKeywords: [],
      metaDescription: "To be added — write this from the real book. See README.md."
    }
  },
  {
    id: "book-04",
    slot: "Book 4",
    title: "Book 4 — Coming soon",
    shortTitle: "Book 4",
    theme: "Details coming soon",
    age: null,
    pages: null,
    format: "Digital PDF coloring book",
    description: "A new JoJo's Blocks coloring book is on its way. Its title, theme, age guidance and page count will appear here once the book is ready.",
    features: [
      "Digital PDF coloring book",
      "Print at home, again and again",
      "Screen-free creative play"
    ],
    cover: "assets/covers/book-04.svg",
    coverAlt: "JoJo's Blocks coloring book cover — details coming soon",
    pdfUrl: null,  // real PDF purchase link — add later, when you are ready to sell
    seo: {
      focusKeyword: "To be added — from the real book title/theme",
      secondaryKeywords: [],
      longTailKeywords: [],
      metaDescription: "To be added — write this from the real book. See README.md."
    }
  }
];
