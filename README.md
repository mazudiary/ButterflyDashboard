# 🦋 Butterfly Dashboard — Our Forever

A digital love timeline: hero with a "we've been us for" timer, story cards, a memory timeline of
(locked/unlocked) links, favourites, light/dark theme, background music and floating butterflies.

* Back to the diary: <https://mazudiary.github.io/DreamyDiaries/diary.html>

## Adding memories (`links.json`)

```json
{
  "id": "memory-017",
  "title": "My new page 💖",
  "description": "Short sweet text",
  "url": "https://mazudiary.github.io/MyNewPage/",
  "date": "2026-12-25",
  "availableAt": "2026-12-25T09:30",
  "category": "Surprise"
}
```

* `id` must be unique. `availableAt` is optional — without it the memory opens at 00:00 on `date`.
* All times are **Bangladesh time (UTC+6)**, the same real moment for every visitor.
* Cards are always shown oldest → newest (JSON order is kept for equal times).
* A locked card unlocks by itself when its time arrives — no page reload needed.

## Settings

`CONFIG` at the top of `script.js` (relationship start date, name, typing phrases, butterfly count).
