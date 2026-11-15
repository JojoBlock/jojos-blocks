# Level 7 Phase 1 — Section D Inspirational Pins: Copy + Publishing Schedule

**Status: PREPARED ONLY — nothing published.** This is a complete publishing
pack for the publisher (or the browser route). 10 Pins, all to the
**SKETCH / DRAWING** board only, **at most one Pin per day**.

- Source plan: `growth/JoJos_Blocks_Level_7_Phase_1_Content_and_Organic_Growth_Plan.md`
  §D (inspirational Pins, 10). Titles and descriptions are the plan's §D copy,
  used verbatim.
- Builder: `pinterest-phase3/build-pins-level7-d.py` (same 1000×1500 layout and
  palette as Phase 3 Batches 1–2 and the §C pack; rebuild with
  `python3 build-pins-level7-d.py`).
- Images: `pinterest-phase3/images/pin-d01-*.jpg` … `pin-d10-*.jpg`
  (all 1000×1500, visually verified — contact sheets + full-size band crops).
  Source illustrations:
  `media-generation-pin-dN-*-illustration-0-*.webp` in the same folder
  (filenames are truncated mid-stem by the media pipeline; the builder finds
  them by glob).
- Prices on the images are the live sale prices (ABC $3.59 / was $3.99;
  Animal $4.49 / was $4.99; bundle $11.69 / was $12.99,
  **SAVE $5.97** — NOT $6.97).
- Pins D03, D05 and D10 are FREE pins: no price, no book cover — a coral FREE
  badge, "4 free pages · Ages 2–7 · No sign-up needed", CTA "Download Free".
- Pins D01, D02 and D09 are article pins: a small blog-cover thumbnail in the
  bottom band, "Read the Article" CTA, no price.
- D01 carries the five phrases as small PIL text under the illustration
  (the plan's visual direction); the phrases are also listed in the D01
  description below.
- **Destination changes vs the plan (article #12 does not exist yet):**
  the plan links D01 and D04 to "Blog article #12 (after Phase 2)".
  That article has not been written, so D01 now links to the Benefits of
  Coloring article (live) and D04 to My First ABC Book (live). Re-point
  them to article #12 if/when it is published.
- **D09 links to the Homeschool Preschool Daily Routine article**, which is
  on `restructure/dev` and goes live with the 7-article batch deploy.
  Publish D09 only after that article is confirmed live on production;
  if it is not live on its scheduled day, move it to the end of the run.
- Do NOT publish a Pin whose destination is not yet live on production.
- No Pin links to a page that is not live or about to go live with the
  approved batch deploy. No interior pages from paid PDFs are used
  anywhere; all illustrations are new and original, and book covers appear
  only as small supporting elements in the bottom band.

## Schedule — one Pin per day, §D order, Tue 1 Dec – Thu 10 Dec 2026

Follows the §C run (Mon 16 Nov – Mon 30 Nov 2026) with no overlap.

| Day | Date | Pin | Destination |
|-----|------|-----|-------------|
| 1 | Tue 1 Dec 2026 | D01 5 Things to Say When Your Child Shows You Art | /blog/benefits-of-coloring-for-preschoolers.html |
| 2 | Wed 2 Dec 2026 | D02 Learning Through Play: Why Coloring Counts | /blog/benefits-of-coloring-for-preschoolers.html |
| 3 | Thu 3 Dec 2026 | D03 Screen-Free Saturday | /free-printables/ |
| 4 | Fri 4 Dec 2026 | D04 Let Them Color Outside the Lines | /books/my-first-abc-book.html |
| 5 | Sat 5 Dec 2026 | D05 A Quiet 20 Minutes: Calm Mornings | /free-printables/ |
| 6 | Sun 6 Dec 2026 | D06 Every Artist Starts With One Crayon | /books/my-first-abc-book.html |
| 7 | Mon 7 Dec 2026 | D07 Learn Together: 10 Minutes a Day | /books/complete-coloring-book-bundle.html |
| 8 | Tue 8 Dec 2026 | D08 Imagination Grows When Children Draw | /books/my-first-animal-explorer.html |
| 9 | Wed 9 Dec 2026 | D09 The Best Learning Happens at the Kitchen Table ⚠️ homeschool article must be live | /blog/homeschool-preschool-daily-routine-with-printables.html |
| 10 | Thu 10 Dec 2026 | D10 Proud of Every Page: Celebrate Their Art | /free-printables/ |

Base URL: `https://jojosblocks.online` — full destination is the base URL +
the path above.

## Pin copy

### D01 — 5 Things to Say When Your Child Shows You Their Drawing
- **Image:** `images/pin-d01-drawing.jpg`
- **Title:** 5 Things to Say When Your Child Shows You Their Drawing
- **Description:** What you say when a child shows you their art matters more than the art. Five simple responses that build confidence — and why "what is it?" can wait. Try these: Tell me about your picture! I love the colors you chose. You worked so hard on this. What was your favorite part? Let's put it on the fridge!
- **Alt text:** 5 things to say when your child shows you their drawing — a proud child holding up a colorful drawing of a sun and a house, with five encouraging phrases listed. Parenting tip for ages 2–7.
- **On-image facts:** Five phrases on the Pin · Read the Article · Free to read
- **Keywords:** what to say when child shows drawing, encourage kids art, praise children's drawings, build confidence in kids, parenting tips, preschool art, coloring benefits, kids creativity, ages 2-7, screen-free parenting
- **Hashtags:** #ParentingTips #KidsArt #EncourageKids #PreschoolLearning #ColoringPages
- **Destination:** https://jojosblocks.online/blog/benefits-of-coloring-for-preschoolers.html

### D02 — Learning Through Play: Why Coloring Counts as Learning
- **Image:** `images/pin-d02-learning.jpg`
- **Title:** Learning Through Play: Why Coloring Counts as Learning
- **Description:** Coloring builds fine motor skills, focus, letter recognition and patience. Here is what your child is actually learning while they color.
- **Alt text:** Learning through play — a calm child coloring a giant letter A with a chunky crayon. Why coloring counts as learning, ages 2–7.
- **On-image facts:** Fine motor skills, focus & patience · Ages 2–7 · Read the Article
- **Keywords:** learning through play, coloring counts as learning, fine motor skills, coloring benefits, preschool learning, letter recognition, focus for kids, screen-free learning, coloring for preschoolers, ages 2-7
- **Hashtags:** #LearningThroughPlay #ColoringBenefits #PreschoolLearning #FineMotorSkills #ColoringPages
- **Destination:** https://jojosblocks.online/blog/benefits-of-coloring-for-preschoolers.html

### D03 — Screen-Free Saturday: One Simple Idea for the Whole Family
- **Image:** `images/pin-d03-saturday.jpg`
- **Title:** Screen-Free Saturday: One Simple Idea for the Whole Family
- **Description:** One Saturday, no screens: print four coloring pages, set out the crayons, and color together for 20 minutes. Free pages included.
- **Alt text:** Screen-free Saturday — a family coloring together at a kitchen table, crayons and coloring pages spread out. Free printable coloring pages, no sign-up needed.
- **On-image facts:** FREE · 4 free pages · Ages 2–7 · No sign-up needed · Download Free
- **Keywords:** screen-free Saturday, screen-free family activities, family coloring, no screens weekend, free printable coloring pages, kids activities at home, coloring together, screen-free kids, ages 2-7, free printables
- **Hashtags:** #ScreenFreeSaturday #ScreenFreeKids #FamilyColoring #FreePrintable #KidsActivities
- **Destination:** https://jojosblocks.online/free-printables/

### D04 — Let Them Color Outside the Lines
- **Image:** `images/pin-d04-outside-lines.jpg`
- **Title:** Let Them Color Outside the Lines — Messy Coloring Is Learning
- **Description:** Perfect coloring is not the goal. Messy, creative, outside-the-lines coloring is how children learn confidence and imagination.
- **Alt text:** Let them color outside the lines — a joyful, messy colored page with scribbles going outside the lines and crayons scattered around. Messy coloring builds confidence, ages 2–5.
- **On-image facts:** Ages 2–4 · 28 pages · Printable PDF · $3.59 (was $3.99) · Explore the Book
- **Keywords:** color outside the lines, messy coloring, creative coloring for kids, coloring confidence, kids imagination, bold and easy coloring, toddler coloring, preschool art, printable PDF, ages 2-4
- **Hashtags:** #ColorOutsideTheLines #KidsCreativity #PreschoolArt #ToddlerActivities #ColoringPages
- **Destination:** https://jojosblocks.online/books/my-first-abc-book.html

### D05 — A Quiet 20 Minutes: Printable Activities for Calm Mornings
- **Image:** `images/pin-d05-calm-morning.jpg`
- **Title:** A Quiet 20 Minutes: Printable Activities for Calm Mornings
- **Description:** Mornings are easier with something calm to do. Print these four pages the night before and start the day with coloring, not screens.
- **Alt text:** A quiet 20 minutes — a calm morning scene with coloring pages and crayons laid out ready beside a mug. Free printable activities for calm mornings, ages 2–7.
- **On-image facts:** FREE · 4 free pages · Ages 2–7 · No sign-up needed · Download Free
- **Keywords:** calm mornings for kids, quiet activities for kids, morning routine kids, printable activities, coloring for calm mornings, screen-free mornings, free printable coloring pages, preschool printables, ages 2-7, print at home
- **Hashtags:** #CalmMornings #QuietActivities #MorningRoutine #FreePrintable #KidsActivities
- **Destination:** https://jojosblocks.online/free-printables/

### D06 — Every Artist Starts With One Crayon
- **Image:** `images/pin-d06-first-crayon.jpg`
- **Title:** Every Artist Starts With One Crayon — Bold Easy Coloring Ages 2–4
- **Description:** Your child's first scribbles are the start of something. Simple, bold and easy coloring pages made for little hands.
- **Alt text:** Every artist starts with one crayon — a toddler's first crayon scribble drawing beside a bold, easy coloring page with a big apple. Printable ABC coloring book, ages 2–4.
- **On-image facts:** Ages 2–4 · 28 pages · Printable PDF · $3.59 (was $3.99) · Explore the Book
- **Keywords:** first crayon drawing, toddler first scribbles, bold and easy coloring, coloring for toddlers, easy coloring pages, little hands coloring, ABC coloring book, preschool art, printable PDF, ages 2-4
- **Hashtags:** #FirstCrayon #ToddlerArt #BoldAndEasy #PreschoolLearning #ColoringPages
- **Destination:** https://jojosblocks.online/books/my-first-abc-book.html

### D07 — Learn Together: 10 Minutes of Coloring a Day
- **Image:** `images/pin-d07-together.jpg`
- **Title:** Learn Together: 10 Minutes of Coloring a Day
- **Description:** Ten minutes a day is enough. Sit with your child, color one page, and talk about what you see — letters, animals, jobs, planets.
- **Alt text:** Learn together — a parent and a young child coloring side by side at a table, each with a page and crayons. Ten minutes of coloring a day, ages 2–7.
- **On-image facts:** 4 books · 154 pages · Ages 2–7 · Save $5.97 · $11.69 (was $12.99) · Explore the Bundle
- **Keywords:** color together, 10 minutes a day, parent child coloring, learn together, coloring routine, daily coloring for kids, coloring book bundle, alphabet animals helpers space, printable PDF, ages 2-7
- **Hashtags:** #LearnTogether #ColorTogether #DailyColoring #KidsActivityBundle #ColoringPages
- **Destination:** https://jojosblocks.online/books/complete-coloring-book-bundle.html

### D08 — Imagination Grows When Children Draw
- **Image:** `images/pin-d08-imagination.jpg`
- **Title:** Imagination Grows When Children Draw — Purple Lions Welcome
- **Description:** Drawing is how children practise imagination. Give them big, simple pages and let them decide what color a lion should be.
- **Alt text:** Imagination grows when children draw — a purple lion and a green elephant, a child's wonderfully wrong colors, celebrated. Printable animal coloring book, ages 3–6.
- **On-image facts:** Ages 3–6 · 30 pages · Printable PDF · $4.49 (was $4.99) · Explore the Book
- **Keywords:** imagination for kids, kids drawing, purple lion, creative kids, let kids choose colors, animal coloring pages, preschool imagination, drawing for kids, printable PDF, ages 3-6
- **Hashtags:** #KidsImagination #KidsDrawing #AnimalColoring #PreschoolLearning #ColoringPages
- **Destination:** https://jojosblocks.online/books/my-first-animal-explorer.html

### D09 — The Best Learning Happens at the Kitchen Table ⚠️ homeschool article must be live
- **Image:** `images/pin-d09-kitchen-table.jpg`
- **Title:** The Best Learning Happens at the Kitchen Table
- **Description:** You do not need a classroom to teach your child. A kitchen table, some crayons and four printable pages are enough to start.
- **Alt text:** The best learning happens at the kitchen table — a kitchen table with coloring pages, chunky crayons and a mug. Homeschool preschool daily routine with printables.
- **On-image facts:** A calm daily routine with printables · Ages 2–7 · Read the Article
- **Keywords:** kitchen table learning, homeschool preschool, teach child at home, homeschool routine, preschool at home, coloring at the kitchen table, homeschool printables, screen-free homeschool, ages 2-7, home learning
- **Hashtags:** #HomeschoolPreschool #KitchenTableLearning #HomeLearning #PreschoolRoutine #ColoringPages
- **Destination:** https://jojosblocks.online/blog/homeschool-preschool-daily-routine-with-printables.html

### D10 — Proud of Every Page: Celebrate Your Child's Art
- **Image:** `images/pin-d10-fridge-art.jpg`
- **Title:** Proud of Every Page: Celebrate Your Child's Art
- **Description:** Put their coloring on the fridge. Date it. Tell them what you like about it. Small celebrations build a child who loves to learn.
- **Alt text:** Proud of every page — a fridge covered in children's colored pages held up by magnets. Celebrate your child's art, ages 2–7.
- **On-image facts:** FREE · 4 free pages · Ages 2–7 · No sign-up needed · Download Free
- **Keywords:** celebrate kids art, proud of kids drawings, fridge art display, kids art display, encourage young artists, coloring on the fridge, free printable coloring pages, preschool art, ages 2-7, screen-free kids
- **Hashtags:** #ProudOfEveryPage #KidsArt #FridgeArt #EncourageKids #FreePrintable
- **Destination:** https://jojosblocks.online/free-printables/

## Publishing checklist (per Pin)
1. Confirm the destination URL returns 200 on production before publishing.
2. Upload the Pin image to the SKETCH / DRAWING board only.
3. Paste the title, description, alt text and destination link exactly as above.
4. Add the hashtags at the end of the description.
5. One Pin per day, in the schedule order above; never two in one day.
6. After publishing, record the live Pin URL here (or in the daily report) and
   verify it opens on the board.
