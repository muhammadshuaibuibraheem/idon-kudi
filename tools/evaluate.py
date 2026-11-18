#!/usr/bin/env python3
"""Independent re-implementation of the note classifier's held-out evaluation.

Reads a dataset exported from the app (Teach tab -> Export data) and reports accuracy, a
confusion matrix and per-note recall. It mirrors js/notes.js (standardised features,
k=5 distance-weighted vote, whole capture sessions held out), so a result here should match
the app's "Check my accuracy". Judges can rerun it to reproduce the numbers in the write-up.

Usage:  python3 tools/evaluate.py idon-kudi-dataset.json [--json]
Needs:  numpy only.
"""
import json
import sys
from collections import defaultdict

import numpy as np

K = 5


def load(path):
    with open(path, encoding="utf-8") as f:
        obj = json.load(f)
    samples = obj["samples"]
    x = np.array([s["features"] for s in samples], dtype=float)
    y = np.array([s["label"] for s in samples])
    g = np.array([str(s["session"]) for s in samples])
    return x, y, g


def predict_all(x_train, y_train, x_test):
    mean = x_train.mean(axis=0)
    std = x_train.std(axis=0)
    std[std == 0] = 1.0
    a = (x_train - mean) / std
    b = (x_test - mean) / std
    preds = []
    for row in b:
        d = np.sqrt(((a - row) ** 2).sum(axis=1))
        idx = np.argsort(d, kind="stable")[:K]
        votes = defaultdict(float)
        for i in idx:
            votes[y_train[i]] += 1.0 / (d[i] + 1e-6)
        preds.append(max(votes.items(), key=lambda kv: kv[1])[0])
    return np.array(preds)


def held_out(x, y, g):
    labels = sorted(set(y.tolist()))
    sessions = sorted(set(g.tolist()))
    if len(labels) < 2 or len(sessions) < 2:
        return None
    confusion = {l: {m: 0 for m in labels} for l in labels}
    correct = tested = 0
    for s in sessions:
        train_mask = g != s
        test_mask = g == s
        if len(set(y[train_mask].tolist())) < 2:
            continue
        known = set(y[train_mask].tolist())
        keep = np.array([lab in known for lab in y[test_mask]])
        if not keep.any():
            continue
        xt = x[test_mask][keep]
        yt = y[test_mask][keep]
        pred = predict_all(x[train_mask], y[train_mask], xt)
        for t, p in zip(yt, pred):
            confusion[int(t)][int(p)] += 1
            tested += 1
            correct += int(t == p)
    return {"accuracy": correct / tested if tested else None, "tested": tested, "confusion": confusion, "labels": labels}


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    x, y, g = load(sys.argv[1])
    res = held_out(x, y, g)
    if res is None or res["accuracy"] is None:
        print("Not enough data: need at least 2 different notes captured in at least 2 sessions.")
        sys.exit(2)
    if "--json" in sys.argv:
        print(json.dumps({"accuracy": res["accuracy"], "tested": res["tested"]}))
        return
    print(f"samples: {len(y)}   sessions: {len(set(g.tolist()))}   tested: {res['tested']}")
    print(f"held-out accuracy: {res['accuracy'] * 100:.1f}%\n")
    labels = res["labels"]
    print("confusion matrix (rows = true note, columns = predicted)")
    print("        " + "".join(f"{l:>7}" for l in labels))
    for l in labels:
        row = res["confusion"][l]
        total = sum(row.values())
        recall = f"{row[l] / total * 100:5.1f}%" if total else "   n/a"
        print(f"{l:>7} " + "".join(f"{row[m]:>7}" for m in labels) + f"   recall {recall}")


if __name__ == "__main__":
    main()
