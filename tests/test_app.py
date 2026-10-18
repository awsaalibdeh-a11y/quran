import json
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import app as server  # noqa: E402


class Data(unittest.TestCase):
    def test_every_surah_and_ayah_is_there(self):
        self.assertEqual(len(server.INDEX["surahs"]), 114)
        self.assertEqual(len(server.AYAHS), 6236)
        self.assertEqual(len(server.INDEX["juz"]), 30)

    def test_basmala_is_shown_once_not_inside_the_first_ayah(self):
        q = os.path.join(server.Q, "2.json")
        first = json.load(open(q, encoding="utf-8"))["ayahs"][0]["ar"]
        self.assertFalse(first.startswith("بِسْمِ"))
        fatiha = json.load(open(os.path.join(server.Q, "1.json"), encoding="utf-8"))["ayahs"][0]["ar"]
        self.assertTrue(fatiha.startswith("بِسْمِ"))                 # in Al-Fatihah it is the first ayah


class Search(unittest.TestCase):
    def setUp(self):
        self.c = server.app.test_client()

    def find(self, q):
        return self.c.get("/api/search", query_string={"q": q}).get_json()

    def test_arabic_typed_without_harakat(self):
        r = self.find("قل هو الله احد")
        self.assertEqual([(x["s"], x["a"]) for x in r["results"]], [(112, 1)])

    def test_small_alif_and_hamza_spellings(self):
        self.assertIn((55, 2), [(x["s"], x["a"]) for x in self.find("علم القرآن")["results"]])
        self.assertGreater(self.find("الرحمن")["total"], 40)
        self.assertGreater(self.find("الكتاب")["total"], 100)

    def test_english(self):
        r = self.find("Ayat")
        self.assertEqual(r["total"], 0)
        self.assertGreater(self.find("mercy")["total"], 100)

    def test_too_short(self):
        self.assertEqual(self.find("a")["total"], 0)


class Pages(unittest.TestCase):
    def test_home_and_offline_files(self):
        c = server.app.test_client()
        self.assertEqual(c.get("/").status_code, 200)
        self.assertEqual(c.get("/sw.js").status_code, 200)
        self.assertEqual(c.get("/manifest.webmanifest").status_code, 200)
        self.assertEqual(c.get("/static/q/114.json").status_code, 200)


class Audio(unittest.TestCase):
    def test_only_known_reciters_and_ayahs(self):
        c = server.app.test_client()
        self.assertEqual(c.get("/audio/evil/1.mp3").status_code, 404)
        self.assertEqual(c.get("/audio/ar.mahermuaiqly/9999.mp3").status_code, 404)

    def test_new_pages_ship(self):
        c = server.app.test_client()
        for f in ("app.js", "extras.js", "recite.js", "more.js", "game.js", "sheikh.js", "account.js", "app.css"):
            self.assertEqual(c.get("/static/" + f).status_code, 200)
        self.assertIn(b"extras.js", c.get("/").data)


class Sheikh(unittest.TestCase):
    def test_needs_a_question(self):
        c = server.app.test_client()
        if not server.OPENAI_KEY:
            self.assertEqual(c.post("/api/sheikh", json={"messages": [{"role": "user", "content": "hi"}]}).status_code, 503)
        else:
            self.assertEqual(c.post("/api/sheikh", json={"messages": []}).status_code, 400)
            self.assertEqual(c.post("/api/sheikh", json={"messages": [{"role": "assistant", "content": "x"}]}).status_code, 400)


if __name__ == "__main__":
    unittest.main()
