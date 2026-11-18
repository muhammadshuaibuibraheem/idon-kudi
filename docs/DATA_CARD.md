# Data card: naira note samples

Fill the `[ ]` fields from your real collection. Judges score data quality and reproducibility.

**What it is.** Feature vectors (62 numbers each) computed on-device from camera frames of Nigerian naira notes.
A vector is a 6x3 grid of colour measurements (chromaticity and relative brightness per cell, 54 numbers) plus an 8-bin hue histogram.
No images are stored. The features cannot be turned back into a photo.

**Labels.** Denomination: 5, 10, 20, 50, 100, 200, 500, 1000. Front and back are both labelled with the denomination.

**Collection protocol.** 10 frames per capture, ~0.3 s apart, while tilting the note. Each press of *Capture* is one *session* with its own id.
Dark frames (mean brightness < 35 of 255) are skipped automatically.

**Coverage targets (record what you actually did).**

| Denomination | Sessions | Frames | Front/back | New/worn | Lighting conditions | Locations |
|---|---|---|---|---|---|---|
| ₦100 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| ₦200 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| ₦500 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| ₦1000 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

(Add rows for 5, 10, 20, 50 if supported.)

**Evaluation.** Held-out by capture session: when a sample is tested, every sample from the same session is removed from training,
so near-duplicate consecutive frames cannot inflate the score. Reproduce with `python3 tools/evaluate.py <exported-dataset.json>`.
Result: accuracy [ ]% on [ ] samples; weakest note [ ]; confusion matrix attached [ ].

**Known biases and limits.**
- Notes from one region, one printing series, a few phones and lighting conditions will not generalise automatically. State yours: [ ].
- Folded, taped, very worn or partly covered notes are likely to be misclassified. Tested? [ ]
- Colour-based features can confuse denominations whose colours are similar under warm or dim light. Observed pairs: [ ].
- Counterfeit detection is **not** attempted. The app identifies value only.

**Privacy.** Collected only from the team's own notes. No people, faces or documents are captured; keep fingers and background out of frame where possible.
Dataset file: [ ] (where it is stored, who can access it).

**Licence of the dataset.** [ ]
