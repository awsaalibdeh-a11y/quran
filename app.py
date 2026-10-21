"""Noor: a Quran reader. The text, translations and tafsir ship with the app (static/q, built by tools/build_data.py),
so reading works offline once the app has saved them. Recitations stream from the Islamic Network CDN."""
import json
import os
import re
import time
from collections import defaultdict, deque

import requests

from flask import Flask, Response, jsonify, render_template, request, send_from_directory

ROOT = os.path.dirname(os.path.abspath(__file__))
Q = os.path.join(ROOT, "static", "q")
VERSION = "2.8"
HOMEBASE_URL = os.environ.get("HOMEBASE_URL", "https://homebase-family.onrender.com").rstrip("/")

app = Flask(__name__)
app.config["JSON_AS_ASCII"] = False
import hubguard  # noqa: E402  (the owner's universal switches, kept in Cramly)
hubguard.install(app, "noor")
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
    return render_template("index.html", version=VERSION, homebase=os.environ.get("HOMEBASE_URL", HOMEBASE_URL).rstrip("/"), apk=os.path.exists(os.path.join(ROOT, "static", "noor.apk")) and "AwsaaApp" not in request.headers.get("User-Agent", ""))


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
                "ar.abdurrahmaansudais": 64, "ar.saoodshuraym": 64, "ar.hudhaify": 128, "ar.muhammadayyoub": 128, "ar.shaatree": 128, "ar.ahmedajamy": 128, "ar.muhammadjibreel": 128, "ar.husarymujawwad": 128, "ar.minshawimujawwad": 64, "ar.abdulsamad": 64, "ar.abdullahbasfar": 64, "ar.hanirifai": 64, "ar.aymanswoaid": 64, "ar.ibrahimakhbar": 32, "ar.parhizgar": 48}


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


CHAT_MODEL = os.environ.get("OPENAI_MODEL", "gpt-5")
CHAT_EFFORT = os.environ.get("OPENAI_REASONING_EFFORT", "low")
CHAT_DAILY = int(os.environ.get("SHEIKH_DAILY_LIMIT", "800"))
_chat_hits = defaultdict(deque)
_chat_day = {"d": "", "n": 0}
SHEIKH = """You are "Sheikh Aws", the AI helper inside Noor, a Quran app. You are an AI assistant, not a human scholar or mufti, and you say so if asked.
You help with Islamic practice (prayer, wudu, ghusl, fasting, zakat, hajj and umrah), duas and adhkar, the Quran and its meaning, the life of the Prophet (peace be upon him), and good character.

How you answer:
- Warm, clear and short: a direct answer first, then a few short points. Use the user's language (Arabic if they write in Arabic, otherwise English).
- Base answers on the Quran and authentic hadith. Cite the Quran ONLY as [surah:ayah] or [surah:ayah-ayah], e.g. [2:255] or [112:1-4]. Never write Quran verses out in Arabic from memory: the app shows the exact text for each reference.
- For hadith, name the collection (Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa'i, Ibn Majah). Quote a dua's wording only when it is well known and you are sure of it; never invent a hadith, a reference or a ruling. If you are not sure, say so.
- Where the four schools (Hanafi, Maliki, Shafi'i, Hanbali) differ, give the main views briefly and fairly, without attacking anyone. Where there is consensus, say so.
- For personal rulings with real consequences (divorce, inheritance shares, oaths, contracts, medical choices), give the general guidance and advise asking a qualified local scholar. For health or legal emergencies, tell them to contact the right professional. If someone sounds in danger or in crisis, gently urge them to contact local emergency services or a trusted person right away.
- Stay respectful to all Muslims and all people. No takfir, no sectarian attacks, no politics, nothing that encourages harm.
- Stay on Islamic topics and everyday questions a Muslim might ask; politely steer other requests back."""


@app.post("/api/sheikh")
def sheikh():
    """Sheikh Aws: an AI helper for Islamic questions, answered as a stream of text."""
    if not OPENAI_KEY:
        return jsonify(error="Sheikh Aws is not set up yet."), 503
    ip = request.headers.get("X-Forwarded-For", request.remote_addr or "").split(",")[0].strip()
    now = time.time()
    q = _chat_hits[ip]
    while q and q[0] < now - 3600:
        q.popleft()
    if len(q) >= 40:
        return jsonify(error="You have asked a lot this hour. Please rest a little and try again."), 429
    today = time.strftime("%Y-%m-%d")
    if _chat_day["d"] != today:
        _chat_day.update(d=today, n=0)
    if _chat_day["n"] >= CHAT_DAILY:
        return jsonify(error="Sheikh Aws is resting for today. Try again tomorrow."), 429
    data = request.get_json(silent=True) or {}
    msgs = [m for m in (data.get("messages") or [])[-12:] if isinstance(m, dict) and m.get("role") in ("user", "assistant") and isinstance(m.get("content"), str)]
    if not msgs or msgs[-1]["role"] != "user" or not msgs[-1]["content"].strip():
        return jsonify(error="Ask a question."), 400
    msgs = [{"role": m["role"], "content": m["content"][:2000]} for m in msgs]
    q.append(now)
    _chat_day["n"] += 1
    body = {"model": CHAT_MODEL, "messages": [{"role": "system", "content": SHEIKH}] + msgs, "stream": True, "max_completion_tokens": 1800}
    if re.match(r"^(gpt-5|o\d)", CHAT_MODEL):
        body["reasoning_effort"] = CHAT_EFFORT

    def gen():
        try:
            r = requests.post("https://api.openai.com/v1/chat/completions", headers={"Authorization": f"Bearer {OPENAI_KEY}"}, json=body, timeout=(6, 60), stream=True)
        except requests.RequestException:
            yield "I couldn't connect right now. Please try again in a moment."
            return
        if not r.ok:
            app.logger.error("OpenAI %s %s", r.status_code, r.text[:300])
            yield "Something went wrong on my side. Please try again in a moment."
            return
        said = False
        try:
            for raw in r.iter_lines():
                line = raw.decode("utf-8", "replace")
                if not line.startswith("data:"):
                    continue
                chunk = line[5:].strip()
                if chunk == "[DONE]":
                    break
                try:
                    piece = json.loads(chunk)["choices"][0]["delta"].get("content")
                except (ValueError, KeyError, IndexError, TypeError):
                    continue
                if piece:
                    said = True
                    yield piece
        except requests.RequestException:
            yield "\n\n(The answer was cut off. Please ask again.)"
        finally:
            r.close()
        if not said:
            yield "I couldn't find an answer this time. Please ask in another way."

    return Response(gen(), content_type="text/plain; charset=utf-8", headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"})


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
