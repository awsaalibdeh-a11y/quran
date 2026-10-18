"""Noor: a Quran reader. The text, translations and tafsir ship with the app (static/q, built by tools/build_data.py),
so reading works offline once the app has saved them. Recitations stream from the Islamic Network CDN."""
import json
import os
import re

from flask import Flask, jsonify, render_template, request, send_from_directory

ROOT = os.path.dirname(os.path.abspath(__file__))
Q = os.path.join(ROOT, "static", "q")
VERSION = "1.0"

app = Flask(__name__)
app.config["JSON_AS_ASCII"] = False

MARKS = re.compile("[ؐ-ًؚ-ٰٟۖ-ۭـ]")   # harakat, small letters, Quranic marks, tatweel
FOLD = str.maketrans({"ٱ": "ا", "أ": "ا", "إ": "ا", "آ": "ا", "ى": "ي", "ة": "ه", "ؤ": "و", "ئ": "ي"})


def plain_ar(t, dagger=""):
    """Arabic without diacritics and with the alif/ya/ta-marbuta forms folded, so people can type it the usual way.
    The Uthmani text writes some long a's as a small alif (رَحْمَٰن, كِتَٰب) that people type either way, so the text is kept
    both with that alif dropped and spelled out."""
    t = MARKS.sub("", t.replace("ٰ", dagger))
    t = t.translate(FOLD).replace("ءا", "ا")
    return re.sub(r"\s+", " ", t).strip()


def plain_en(t):
    return re.sub(r"[^a-z0-9' ]+", " ", t.lower())


def load():
    with open(os.path.join(Q, "index.json"), encoding="utf-8") as f:
        index = json.load(f)
    rows = []
    for s in index["surahs"]:
        with open(os.path.join(Q, f"{s['n']}.json"), encoding="utf-8") as f:
            for a in json.load(f)["ayahs"]:
                rows.append({"s": s["n"], "a": a["n"], "ar": a["ar"], "en": a["en"], "par": plain_ar(a["ar"]) + "|" + plain_ar(a["ar"], "ا"), "pen": plain_en(a["en"])})
    return index, rows


INDEX, AYAHS = load()
ARABIC = re.compile("[؀-ۿ]")


def search(q, limit=60):
    q = q.strip()
    if len(q) < 2:
        return [], 0
    if ARABIC.search(q):
        needle, field = plain_ar(q), "par"
    else:
        needle, field = plain_en(q).strip(), "pen"
        needle = re.sub(r"\s+", " ", needle)
    if not needle:
        return [], 0
    hits = [r for r in AYAHS if needle in r[field]]
    names = {s["n"]: s for s in INDEX["surahs"]}
    out = [{"s": r["s"], "a": r["a"], "ar": r["ar"], "en": r["en"], "surah": names[r["s"]]["en"], "name": names[r["s"]]["name"]} for r in hits[:limit]]
    return out, len(hits)


@app.get("/")
def home():
    return render_template("index.html", version=VERSION, apk=os.path.exists(os.path.join(ROOT, "static", "noor.apk")))


@app.get("/api/search")
def api_search():
    results, total = search(request.args.get("q", "")[:80])
    return jsonify(results=results, total=total)


@app.get("/sw.js")
def sw():
    r = send_from_directory(os.path.join(ROOT, "static"), "sw.js", mimetype="application/javascript")
    r.headers["Cache-Control"] = "no-cache"
    return r


@app.get("/manifest.webmanifest")
def manifest():
    return send_from_directory(os.path.join(ROOT, "static"), "manifest.webmanifest", mimetype="application/manifest+json")


@app.get("/noor.apk")
def apk():
    return send_from_directory(os.path.join(ROOT, "static"), "noor.apk", mimetype="application/vnd.android.package-archive", as_attachment=True)


@app.get("/healthz")
def health():
    return {"ok": True, "version": VERSION, "ayahs": len(AYAHS)}


@app.after_request
def headers(r):
    r.headers["X-Content-Type-Options"] = "nosniff"
    if request.path.startswith("/static/q/"):
        r.headers["Cache-Control"] = "public, max-age=86400"
    return r


if __name__ == "__main__":
    app.run(port=int(os.environ.get("PORT", 5185)), debug=False)
