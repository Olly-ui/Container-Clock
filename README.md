# Container Clock website

Plain HTML, CSS and JavaScript. No build step, no frameworks, no tracking. Pages are 4 to 10 KB each, plus one shared stylesheet and one shared script.

## Pages

index.html (home and the clock), how-it-works.html, tariffs.html, for-agents.html, for-importers.html, roadmap.html, faq.html, join.html, privacy.html

## The clock and the tariffs

The calculator on the home page runs two clocks: terminal storage and line demurrage. Their rates are in the first half of app.js, in the `TERMINALS` and `LINES` lists. Each rate was copied from the tariff files you supplied:

- APM Terminals Apapa (16 Feb 2026)
- TICT Tin Can (16 Feb 2026)
- Lekki Freeport Terminal (16 Feb 2026)
- PTML Tin Can (handbook 16 May 2026)
- Grimaldi Agency Nigeria (effective 16 Nov 2026)
- Combined demurrage and detention schedule (15 Nov 2023, carrier not named)

To add a terminal or line, copy one entry and change the name, date and rates. Each size lists the free band first (0), then the daily rate for each later band. The tariffs.html tables are generated from the same data when the site is built, so if you edit the rates, edit tariffs.html too.

The engine reproduces the PTML handbook worked invoice (40 ft dry, 15 days: storage 549,600 and demurrage 140,600).

## Contact details

Your email, WhatsApp number and name are already filled in (footer on every page, join.html and privacy.html). To change them, search the files for `oshomodelakure@gmail.com`, `08168460256`, `2348168460256` (the WhatsApp link) and `Olaoluwa Osho`.

## Connect the pilot form

Open app.js and find:

    var CONFIG = { formEndpoint: '' };

Create a form on a form service (Formspree, Netlify Forms or similar), paste its URL between the quotes, and the join form will send each submission there as JSON. While it stays empty, the form sends nothing. It shows the visitor a copy of their answers and asks them to send those to you. Test one submission yourself before sharing the link.

## Put it online

Drag the whole folder onto Netlify Drop or Cloudflare Pages, or push it to a GitHub repository and turn on GitHub Pages. No settings needed.

## Sample values

- The dates, terminal, line and container type shown when the clock opens are samples. The dates start from today.
- Container numbers (TSTU 100001 1 and so on), "Line B", "Terminal 2" and the container list on for-agents.html are sample data.
- The "What we heard" quote comes from one interview with a freight forwarder. Confirm it matches what he said, and add more when you have more interviews.

## Check before launch

- The tariffs can change. Check the date on each terminal's and line's own page.
- The Grimaldi and PTML import reports say 16 Nov 2026, the PTML handbook says 16 May 2026. Storage and demurrage rates match, other charges differ. Confirm which applies to your containers.
- The combined demurrage schedule is from 2023 and does not name its carrier. Confirm it is still current before you rely on it.
- Working days: the clock counts Monday to Friday by default, or Monday to Saturday if you choose it. It does not know public holidays, so real working days can be fewer. Confirm your terminal's and Customs' working days.
- The clear-order tool ranks by the cost of one more day (the sum of tomorrow's storage and demurrage rates) and covers dry containers only.
- The clock does not add reefer power, handling, examination or documentation charges.
- Extra free days move the whole rate schedule back by that many days. Confirm that this is how your agreed free time works.
- Have the privacy page reviewed against the Nigeria Data Protection Act 2023 before you collect real details.
- Confirm the BEAP hackathon rules allow an AI-built website before you submit it.
