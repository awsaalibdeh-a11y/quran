"""Noor: a Quran reader. The text, translations and tafsir ship with the app (static/q, built by tools/build_data.py),
so reading works offline once the app has saved them. Recitations stream from the Islamic Network CDN."""
import json
import os
import re
import time
from collections import defaultdict, deque

import requests

from flask import Flask, jsonify, render_template, request, send_from_directory

ROOT = os.path.dirname(os.path.abspath(__file__))
Q = os.path.join(ROOT, "static", "q")
VERSION = "2.0"

app = Flask(__name__)
app.config["JSON_AS_ASCII"] = False
app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024


def read_env():
    """A local .env (never committed) for running on this PC; on Render the same names are set in its Environment page."""
    path = os.path.join(ROOT, ".env")
    if os.path.exists(path):
        for line in open(path, encoding="utf-8"):
            if "=" in line and not line.lstrip().startswith("#"):
                k, v = line.strip().split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"'))


read_env()
OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "")
TRANSCRIBE_MODEL = os.environ.get("OPENAI_TRANSCRIBE_MODEL", "gpt-4o-transcribe")
DAILY_LIMIT = int(os.environ.get("TRANSCRIBE_DAILY_LIMIT", "3000"))
_hits = defaultdict(deque)
_day = {"d": "", "n": 0}

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
    return render_template("index.html", version=VERSION, apk=os.path.exists(os.path.join(ROOT, "static", "noor.apk")) and "AwsaaApp" not in request.headers.get("User-Agent", ""))


@app.get("/api/search")
def api_search():
    results, total = search(request.args.get("q", "")[:80])
    return jsonify(results=results, total=total)


@app.post("/api/transcribe")
def transcribe():
    """Speech to text for reciting where the browser has no speech recognition of its own (the Android app).
    The audio goes to the model and is not kept."""
    if not OPENAI_KEY:
        return jsonify(error="Reciting in the app is not set up yet."), 503
    ip = request.headers.get("X-Forwarded-For", request.remote_addr or "").split(",")[0].strip()
    now = time.time()
    q = _hits[ip]
    while q and q[0] < now - 60:
        q.popleft()
    if len(q) >= 30:                                                     # about one request every 2 seconds per person
        return jsonify(error="Slow down a little."), 429
    today = time.strftime("%Y-%m-%d")
    if _day["d"] != today:
        _day.update(d=today, n=0)
    if _day["n"] >= DAILY_LIMIT:
        return jsonify(error="Reciting is resting for today. Try again tomorrow."), 429
    f = request.files.get("audio")
    if not f:
        return jsonify(error="No audio."), 400
    q.append(now)
    _day["n"] += 1
    hint = request.form.get("hint", "")[:600]
    try:
        r = requests.post("https://api.openai.com/v1/audio/transcriptions", headers={"Authorization": f"Bearer {OPENAI_KEY}"},
                          data={"model": TRANSCRIBE_MODEL, "language": "ar", "response_format": "json",
                                "prompt": "Quran recitation in Arabic. The reader is reciting: " + hint},
                          files={"file": (f.filename or "a.webm", f.read(), f.mimetype or "audio/webm")}, timeout=25)
    except requests.RequestException:
        return jsonify(error="Could not reach the listener."), 502
    if r.status_code != 200:
        return jsonify(error="The listener had a problem."), 502
    return jsonify(text=r.json().get("text", ""))


RECITER_KBPS = {"ar.mahermuaiqly": 128, "ar.alafasy": 128, "ar.abdulbasitmurattal": 64, "ar.husary": 128, "ar.minshawi": 128,
                "ar.abdurrahmaansudais": 64, "ar.saoodshuraym": 64, "ar.hudhaify": 128, "ar.muhammadayyoub": 128}


@app.get("/audio/<reciter>/<int:g>.mp3")
def audio(reciter, g):
    """The same recitation files as the CDN, from this site, so the app can save them for listening offline
    (the CDN does not allow pages to save its files)."""
    if reciter not in RECITER_KBPS or not 1 <= g <= 6236:
        return "", 404
    try:
        r = requests.get(f"https://cdn.islamic.network/quran/audio/{RECITER_KBPS[reciter]}/{reciter}/{g}.mp3", timeout=20)
    except requests.RequestException:
        return "", 502
    if r.status_code != 200:
        return "", 502
    resp = app.response_class(r.content, mimetype="audio/mpeg")
    resp.headers["Cache-Control"] = "public, max-age=604800"
    return resp


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
