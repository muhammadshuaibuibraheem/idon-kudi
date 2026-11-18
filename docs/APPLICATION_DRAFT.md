# Application draft (paste-ready; adjust to the real form fields)

I could not see the form's exact questions (it is at bit.ly/AIVHackathon), so these are reusable answers. Replace every `[ ]`.
Do not claim testing or a team you do not have.

## Track
Accessible Financial Services

## Project name
Idon Kudi ("eye for money")

## One-sentence summary
An offline, Hausa-first phone app that tells blind and low-vision Nigerians the value of a naira note, flags scam bank alerts, and reads transfers back before they send money.

## The problem
Cash and mobile banking are the main ways many Nigerians transact, and both are visual. A blind trader cannot confirm the note in their hand, cannot judge whether a "credit alert" is real before handing over goods, and cannot easily catch a mistyped amount or account number. Existing assistive apps are mostly built for other markets: no Nigerian languages, weak naira support, and they assume a data connection.

## The solution
Three tools in one installable web app that works with no data connection:
1. **Notes**: camera identifies the note, speaks it, and gives a vibration code.
2. **Alerts**: a bank SMS is pasted or shared into the app and checked for scam signs; credit alerts always get a "check your balance first" reminder.
3. **Transfer guard**: amount in words, account number in digit groups, second confirmation for large amounts, new-recipient warning. It does not move money.

Hausa and English from day one. A screen-reader mode avoids talking over TalkBack. Results are spoken, written and felt (vibration).

## Why it fits Nigerian reality
- Offline-first PWA; installs from a link; no app store, no account, no server.
- Runs on low-end Android phones (no deep-learning runtime; training takes seconds on the phone).
- Privacy: only colour-pattern numbers are stored locally; no photos kept; nothing leaves the phone.
- Hausa first, because Northern Nigeria is under-served by assistive technology. Yoruba and Igbo are planned.

## Applying as an individual (team placement requested)
I am applying on my own and will join the team the organisers place me in.
I am Shuaibu Ibrahim Danjummai, a Level 100 Automotive Engineering student at Bayero University Kano, based in Kano. I build software projects and have taken part in hackathons.
I have already built a working prototype of this project (code, 28 automated tests, a reproducible evaluation script and documentation), so I can start contributing on day one and am happy to lead the build with teammates who bring complementary skills.
Skills I would most like in my team: computer vision/ML (to replace my simple note classifier with a small neural network if data supports it), Android development, and a blind or low-vision co-designer.

**Lived experience:** I do not have lived experience of blindness. I am involving: [ ] (name or organisation, e.g. a Kano association or school for the blind), and I will ask the organisers to connect me with validators if I cannot reach one.

## How we will involve blind and low-vision users
Before building: [ ] (interviews with [ ])
During: [ ] (weekly test sessions on the Notes and Alerts flows)
Final testing: [ ] (tasks, results and changes recorded in the accessibility note)

## Checkable skills
GitHub: [ ] (repository link for Idon Kudi) · Kaggle/Zindi: [ ] · Shipped projects: [ ] (add any real ones, e.g. hackathon builds)
Working prototype repository: [ ] (the code in this folder runs today; the note model needs real data)

## What we will deliver by 15 January
Working installable prototype, 5-minute demo video, documentation, accessibility note, reproducible evaluation (`tools/evaluate.py`), dataset card.

## Pilot idea (from February)
Pilot with [ ] (a school for the blind, an association chapter, or market traders) in Kano: measure note-identification accuracy in real use and how often the alert check changes a decision.

## Risks and honesty
Colour-based note recognition will struggle with worn, folded or dimly lit notes; we will report measured accuracy and the failure cases, and upgrade to a small CNN if the data supports it. Alert Guard is a heuristic and cannot prove an alert is genuine; the app says so every time.
