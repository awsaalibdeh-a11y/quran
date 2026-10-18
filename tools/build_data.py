"""Builds the app's data from the alquran.cloud downloads in data/ (Tanzil Uthmani text, Saheeh International,
transliteration, Tafsir al-Muyassar): one small file per surah for the reader, and an index for the list."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
OUT = os.path.join(ROOT, "static", "q")
BASMALA = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"


def bare(t):
    return "".join(c for c in t if not ("ً" <= c <= "ٟ" or c == "ٰ"))


def load(name):
    with open(os.path.join(DATA, name + ".json"), encoding="utf-8-sig") as f:
        return json.load(f)["data"]["surahs"]


def main():
    ar, en, tr, tf = load("quran-uthmani"), load("en.sahih"), load("en.transliteration"), load("ar.muyassar")
    os.makedirs(OUT, exist_ok=True)
    index = []
    for s, e, t, f in zip(ar, en, tr, tf):
        ayahs = []
        for a, b, c, d in zip(s["ayahs"], e["ayahs"], t["ayahs"], f["ayahs"]):
            text = a["text"].lstrip("﻿")
            if s["number"] not in (1, 9) and a["numberInSurah"] == 1:
                words = text.split(" ")
                if bare(" ".join(words[:4])) == bare(BASMALA):
                    text = " ".join(words[4:])                 # the basmala is shown once above the surah instead
            ayahs.append({"n": a["numberInSurah"], "g": a["number"], "ar": text, "en": b["text"], "tr": c["text"], "tf": d["text"],
                          "juz": a["juz"], "page": a["page"], "sajda": bool(a["sajda"])})
        info = {"n": s["number"], "name": s["name"], "en": s["englishName"], "meaning": s["englishNameTranslation"],
                "type": s["revelationType"], "count": len(ayahs), "juz": ayahs[0]["juz"], "page": ayahs[0]["page"]}
        index.append(info)
        with open(os.path.join(OUT, f"{s['number']}.json"), "w", encoding="utf-8") as fh:
            json.dump(dict(info, ayahs=ayahs), fh, ensure_ascii=False, separators=(",", ":"))
    juz = []
    for s in json.load(open(os.path.join(OUT, "..", "..", "data", "meta.json"), encoding="utf-8"))["data"]["juzs"]["references"]:
        juz.append({"s": s["surah"], "a": s["ayah"]})
    with open(os.path.join(OUT, "index.json"), "w", encoding="utf-8") as fh:
        json.dump({"surahs": index, "juz": juz}, fh, ensure_ascii=False, separators=(",", ":"))
    pages = {}
    for info in index:
        with open(os.path.join(OUT, f"{info['n']}.json"), encoding="utf-8") as fh:
            for a in json.load(fh)["ayahs"]:
                p = pages.setdefault(a["page"], [])
                if p and p[-1][0] == info["n"]:
                    p[-1][2] = a["n"]
                else:
                    p.append([info["n"], a["n"], a["n"]])
    with open(os.path.join(OUT, "pages.json"), "w", encoding="utf-8") as fh:
        json.dump([pages[i] for i in range(1, 605)], fh, separators=(",", ":"))
    print(len(index), "surahs,", sum(i["count"] for i in index), "ayahs")


if __name__ == "__main__":
    main()
