# Quiz Ladder

A 100-rung trivia site. Free to play. Skip is locked until Climber Pass.

## Play locally

Open `index.html` in a browser, or from this folder:

```bash
python3 -m http.server 8080
```

Then visit http://localhost:8080

Owner preview code for skips before Stripe is connected: `LADDER-PREVIEW`

## Publish so search can find “Quiz Ladder”

1. Create a new GitHub repository named `quiz-ladder`.
2. From this folder:

```bash
git init
git add .
git commit -m "Start Quiz Ladder"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/quiz-ladder.git
git push -u origin main
```

3. Import the repo on Vercel or Netlify. It is a static site. No build command.
4. Buy a domain today if you can: `quizladder.com`, or `playquizladder.com` if the first is taken. Point it at the host.
5. Replace `https://quizladder.com/` in `index.html`, `robots.txt`, and `sitemap.xml` with your real domain.
6. In Google Search Console, add the domain and submit `sitemap.xml`.
7. Search will not rank it on day one. Indexing needs the live URL, the sitemap, and a few outside links. Share the exact name “Quiz Ladder” on social profiles and a short launch post.

## Take real money

1. Open a Stripe account in your own name or business.
2. Create a recurring Payment Link: Climber Pass, $4.99 per month.
3. Set the success URL to `https://YOUR_DOMAIN/play.html?pass=1`
4. Paste the Payment Link into `STRIPE_CLIMBER_LINK` in `js/game.js`.
5. Optional second link: Summit year at $29.99.
6. Add a privacy contact email before you apply for Google AdSense. Ads belong on the free climb only.

The `?pass=1` flag is fine for a first launch and easy to fake. When payments are real, verify them with a Stripe webhook so a pass cannot be copied from the URL.

## Game rules

- Summit is rung 100.
- Wrong answer or timeout: lose a life, drop 4 rungs.
- Five-correct streak: climb 2 instead of 1.
- Free: 3 lives, no skips, death returns you to rung 1.
- Pass: 4 lives, 4 skips a day, checkpoint every 20 rungs.
