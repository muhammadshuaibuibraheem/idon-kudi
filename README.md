# Idon Kudi ("eye for money")

An offline-first, Hausa-and-English money assistant for blind and low-vision Nigerians.
Built for the **AI for the Visually Impaired Hackathon 2026**, track **Accessible Financial Services**.

It runs as a web app (PWA) in the phone's browser. No account, no server, no data connection needed after the first load.

| Feature | What it does |
|---|---|
| **Notes** | Point the camera at a naira note and hear its value. Also gives a vibration code. |
| **Alerts** | Paste or *share* a bank SMS to the app. It checks for scam signs (links, requests for OTP/PIN, urgency, "wrongly sent, refund me" stories, personal-number senders) and always reminds the user to confirm the balance before handing over goods. |
| **Transfer** | Before sending money in the bank app, the user types or says the amount and account number. The app reads them back in words and digit groups, asks for a second confirmation on large amounts, and warns about first-time recipients. **It never moves money.** |
| **Teach** | The user (or a helper) takes photos of real notes to teach the app, checks honest accuracy, and exports/imports datasets. |

## Run it

```bash
python3 -m http.server 8080        # then open http://localhost:8080 on the same machine
```

The camera and offline mode need **HTTPS or localhost**. To use it on a phone, put the folder on any static HTTPS host
(GitHub Pages, Netlify, Cloudflare Pages). Open it once online, then use *Add to Home screen*; after that it works offline.
Sharing an SMS into the app (Android Chrome) works once the app is installed to the home screen.

## Test it

```bash
node tests/run.mjs                                   # 28 unit tests, no dependencies
python3 tools/evaluate.py idon-kudi-dataset.json     # independent accuracy report (numpy only)
```

`tools/evaluate.py` re-implements the classifier evaluation separately from the JavaScript, and agrees with it exactly
on the test datasets, so anyone can reproduce the accuracy figure you report.

## First-time setup for the note identifier (required)

The app ships **without** a trained note model, because it must be trained on real photos of real notes.

1. Open the **Teach** tab, press *Start camera*.
2. Pick a note (e.g. ₦500), hold it in front of the camera, press *Capture 10 photos* while slowly tilting it.
3. Repeat in **different places and light**, **front and back**, **new and worn** notes. Aim for at least 3 captures per note, 5+ is better.
4. Press *Check my accuracy*. It hides each whole capture session while testing it, so the number is not inflated by near-identical frames.
   It also names the weakest note so you know what to capture more of.
5. Go to **Notes** and scan.

Everything is stored on the phone as numbers describing colour patterns (62 numbers per frame). **No photos are stored or sent anywhere.**
Teammates can pool data with *Export data* / *Import data*.

## Vibration codes (Notes tab)

Small notes: **1, 2, 3, 4 short pulses** for ₦5, ₦10, ₦20, ₦50.
Big notes: **1, 2, 3, 4 long pulses** for ₦100, ₦200, ₦500, ₦1000.
Three long, repeated warning pulses on a suspicious alert.

## Honest status and limits

- **Note identifier**: colour-pattern + k-nearest-neighbour, chosen because it trains on the phone in seconds, needs no ML runtime and is fully inspectable.
  It will be weaker than a CNN on worn/folded notes and unusual lighting. The classifier is isolated behind `train()` / `predict()` in `js/notes.js`,
  so a TFLite or ONNX model can replace it without touching the UI. **Report only the accuracy you measure on real notes.**
  The unit tests use synthetic images; they prove the code works, not that real-world accuracy is high.
- **Alert Guard** is heuristic and cannot prove a message is real. Forged alerts can look perfect, which is why the app always says to check the balance.
  A website cannot read SMS directly, so the user pastes the text or uses *Share to Idon Kudi*.
- **Transfer Guard** is a read-back check only. It does not integrate with any bank.
- **Hausa**: strings were written without a native-speaker review. Have a Hausa speaker (ideally a blind user) review `js/i18n.js` before any deployment.
  Many phones have no Hausa text-to-speech voice; the app tells the user, and *screen reader mode* lets TalkBack/VoiceOver read the on-screen text instead.
- Browser speech recognition (the microphone buttons) often needs an internet connection; typing always works.
- Yoruba and Igbo are not included yet. Add a language by copying the `en` block in `js/i18n.js` and adding an `<option>` in `index.html`.
- Tested in headless Chrome (page loads, shared-text alert flow works). Not yet tested on physical Android phones, nor with TalkBack, nor with blind users. See `docs/ACCESSIBILITY_NOTE.md`.

## Accessibility design

- Every control is a real HTML button/input with a label; tabs use arrow keys; one polite live region announces results.
- *Screen reader mode* stops the app speaking so it does not talk over TalkBack/VoiceOver. Without it the app speaks results itself (for low-vision users who do not run a screen reader).
- 18px base text that follows the user's font size, 56px+ touch targets, high-contrast light and dark themes, focus rings, reduced-motion respected.
- Results are given three ways: spoken, written, and vibration.
- Scanning needs 4 of the last 6 frames to agree before announcing, says "too dark" instead of guessing, and rejects patterns it was never taught.

## Project map

```
index.html, styles.css, manifest.webmanifest, sw.js   PWA shell and offline cache
js/app.js           wiring: tabs, camera loop, speech, storage
js/notes.js         features + k-NN + held-out evaluation
js/alertguard.js    SMS parsing and scam-sign rules
js/transferguard.js amount/account parsing and read-back
js/i18n.js          English and Hausa strings and message builders
js/speech.js, camera.js, store.js
tests/run.mjs       unit tests        tools/evaluate.py   reproducible evaluation
docs/               accessibility note template, data card, application draft, demo script
```

## How this maps to the judging criteria

Relevance (financial services track) · Accessibility (screen-reader mode, 3 output channels, co-design plan in `docs/`) · Usability (3 big buttons per screen) ·
Performance (measured held-out accuracy, reproducible) · Understandability (small readable modules, this README) · Value-sensitivity (on-device, no photos kept, no money moved, honest limits) ·
Data quality (`docs/DATA_CARD.md`, session-held-out evaluation) · Reproducibility (`tools/evaluate.py`, no build step) · Testability (28 tests) · Changeability (swappable classifier, language file) · Documentation (this folder).

## Licence

MIT.
