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

   REAL BOOKS — ADDED 9 NOV 2026
   These four books were read from Aarif's own PDFs (kept privately
   in ~/workspace/user/jojos-blocks-books/, never in this repo).
   Titles, themes, ages and page counts below come from the books
   themselves: ages only where the book states them (ABC: Ages 2-4
   on the cover; Space: Ages 3-5 on the cover). Covers are the books'
   real cover pages, saved as assets/covers/book-01.jpg … book-04.jpg.
   To add a fifth book, copy one block and fill it in the same way.
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
    title: "My First ABC Book",
    shortTitle: "My First ABC Book",
    theme: "Alphabet • Letters A–Z",
    age: "Ages 2–4",
    pages: 28,
    format: "Digital PDF coloring book",
    description: "Meet the alphabet one letter at a time. Each page pairs a big letter with a picture word — A is for Apple, B is for Ball, C is for Cat — with a colour guide and tracing practice, so little ones learn, colour and write their first letters.",
    features: [
      "26 letters from A to Z, each with a picture word",
      "Colour guide and letter-tracing practice on every page",
      "Phonics hints such as “A is for Apple”"
    ],
    cover: "assets/covers/book-01.jpg",
    coverAlt: "My First ABC Book cover — colourful ABC letters with an apple, a beach ball and a kitten",
    pdfUrl: null,  // real PDF purchase link — add later, when you are ready to sell
    seo: {
      focusKeyword: "abc coloring book for toddlers ages 2-4",
      secondaryKeywords: [],
      longTailKeywords: [],
      metaDescription: "My First ABC Book: a 28-page digital PDF coloring book for ages 2–4 — learn, colour and trace the alphabet A to Z."
    }
  },
  {
    id: "book-02",
    slot: "Book 2",
    title: "My First Animal Explorer",
    shortTitle: "My First Animal Explorer",
    theme: "Animals • Learn, trace, colour, discover",
    age: null,
    pages: 30,
    format: "Digital PDF coloring book",
    description: "Hello, little explorer! Meet lions, elephants, giraffes, pandas, monkeys and more — learn each animal's name, trace the word, count, match and colour. A certificate of achievement waits at the end for every super animal explorer.",
    features: [
      "Meet lions, elephants, giraffes, pandas and more",
      "Trace animal names, count, match and find shadows",
      "Certificate of Achievement at the end"
    ],
    cover: "assets/covers/book-02.jpg",
    coverAlt: "My First Animal Explorer cover — a lion, elephant, giraffe, monkey, rabbit and panda",
    pdfUrl: null,  // real PDF purchase link — add later, when you are ready to sell
    seo: {
      focusKeyword: "animal coloring book for kids",
      secondaryKeywords: [],
      longTailKeywords: [],
      metaDescription: "My First Animal Explorer: a 30-page digital PDF coloring and activity book — meet the animals, trace their names, count, match and colour."
    }
  },
  {
    id: "book-03",
    slot: "Book 3",
    title: "My Little Community Helpers",
    shortTitle: "My Little Community Helpers",
    theme: "Community helpers • The people who help us every day",
    age: null,
    pages: 54,
    format: "Digital PDF coloring book",
    description: "Meet the people who help us every day! 24 community helpers — doctors, nurses, firefighters, police officers, teachers, veterinarians, electricians, mail carriers and more — with simple job descriptions, big colouring illustrations and a fun matching activity.",
    features: [
      "24 community helpers to meet and colour",
      "Simple job descriptions children can understand",
      "Matching activity and a thank-you page"
    ],
    cover: "assets/covers/book-03.jpg",
    coverAlt: "My Little Community Helpers cover — a firefighter, mail carrier, teacher, nurse, police officer and builder",
    pdfUrl: null,  // real PDF purchase link — add later, when you are ready to sell
    seo: {
      focusKeyword: "community helpers coloring book for kids",
      secondaryKeywords: [],
      longTailKeywords: [],
      metaDescription: "My Little Community Helpers: a 54-page digital PDF coloring book — meet 24 community helpers, learn their jobs and colour big illustrations."
    }
  },
  {
    id: "book-04",
    slot: "Book 4",
    title: "My Little Space Adventure",
    shortTitle: "My Little Space Adventure",
    theme: "Space • Planets, aliens and rockets",
    age: "Ages 3–5",
    pages: 42,
    format: "Digital PDF coloring book",
    description: "Join Nova, Zippy the alien and Rocket-7 on a mission to find the missing Cosmic Crystal. Colour planets and alien worlds, solve mazes and puzzles, decode alien messages and take the Space Explorer Quiz — with a Junior Space Explorer certificate at the end.",
    features: [
      "A story mission with Nova, Zippy and Rocket-7",
      "Mazes, puzzles, counting, matching and alien-language codes",
      "Creative colouring pages and a certificate"
    ],
    cover: "assets/covers/book-04.jpg",
    coverAlt: "My Little Space Adventure cover — a young astronaut, a friendly green alien and Rocket-7 under a smiling moon",
    pdfUrl: null,  // real PDF purchase link — add later, when you are ready to sell
    seo: {
      focusKeyword: "space coloring book for kids ages 3-5",
      secondaryKeywords: [],
      longTailKeywords: [],
      metaDescription: "My Little Space Adventure: a 42-page digital PDF coloring and activity book for ages 3–5 — explore planets, solve puzzles and find the Cosmic Crystal."
    }
  }
];
