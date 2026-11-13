# Essay Jar

Recall practice for essay exams where you know the questions in advance and one is drawn from a box.
Made by Ibad Siddiqui.

## Put it online (GitHub Pages)

1. Create a new repository, for example `essay-jar`.
2. Upload `index.html`, `style.css`, `app.js`, `essays.js` (and an `img` folder if you add drawings).
3. Settings → Pages → Deploy from a branch → `main` / root → Save.
4. Open `https://<your-username>.github.io/essay-jar/`.

You can also just double-click `index.html` to use it offline.

## Daily use

- **Today** shows new essays from the plan (study them, then recall) and reviews that are due (recall straight away).
- **Recall:** you see only the question. Type everything, pick how sure you feel, check.
- **Second go:** if you missed pass points, you’re told which sections they were in and get one more try before the checklist appears.
- **Checklist:** points are ticked from your words. Tap a line to fix a wrong tick.
- An essay is **exam-ready** after 3 clean recalls (90%+ of pass points, no skeleton hint) on 3 different days.
- **Mock exam:** one random question from all 20, 90 minutes, no hints.

Progress is stored in your browser. Use **Settings → Export progress** to back it up or move it to your phone.

## Editing essays

Everything is in `essays.js`.

- `P(text, keywords, source)` is a pass point; `B(...)` is a boost point.
- Keywords: groups separated by `;`, alternatives by `|`. Every group must appear in your answer.
  `"pepsinogen; chief|autocatalysis"` needs *pepsinogen* and either *chief* or *autocatalysis*.
- Words of 4+ letters also match longer forms and small typos; words of 3 letters or fewer must match exactly.
- To show your professor’s drawing, put it in `img/` and add `img: "img/q01.jpg",` to that essay.
- `day` is the plan day an essay is introduced; `examDate` sets the default exam date.

## A new exam

Copy `essays.js`, change `id`, `title`, `examDate` and the essays. Changing `id` gives the new exam its own separate progress.
