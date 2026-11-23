"""Exercise live-table error recovery with the production script in real Chrome."""

import json
import os
import shutil
import subprocess
import tempfile
import unittest
from html import unescape
from pathlib import Path
from random import Random

from footsteps.record import read
from footsteps.table import Table

ROOT = Path(__file__).resolve().parents[1]
CHROME = shutil.which("google-chrome") or shutil.which("chromium") or shutil.which("chrome")
if not CHROME and os.name == "nt":
    installed = Path(os.environ.get("PROGRAMFILES", "")) / "Google/Chrome/Application/chrome.exe"
    CHROME = str(installed) if installed.is_file() else None


@unittest.skipUnless(CHROME, "install Chrome or Chromium for the live table interaction test")
class LiveTableErrors(unittest.TestCase):
    def test_poll_recovery_preserves_distinct_choice_errors(self):
        table = Table(read(ROOT / "examples/crossing.json")["setup"], Random(1))
        table.join(0, 0)
        snapshot = json.dumps(table.view(0, 0))
        setup = """
const replies = [];
window.fetch = async () => {
  const reply = replies.shift();
  if (reply instanceof Error) throw reply;
  return {ok: !reply.error, json: async () => reply};
};
window.setTimeout = () => 0;
"""
        observe = """
(async () => {
  const seen = {}, alert = () => document.getElementById("error").textContent;
  replies.push(Error("offline")); await poll(); seen.firstFailure = alert();
  replies.push(Error("still offline")); await poll(); seen.ongoingFailure = alert();
  replies.push(snapshot); await poll(); seen.recovered = alert();
  seen.seat = document.getElementById("seat").textContent;
  replies.push({error: "invalid choice"}); await send("/choice", {});
  replies.push(snapshot); await poll(); seen.choiceAfterRefresh = alert();
  replies.push(Error("offline again")); await poll(); seen.both = alert();
  posting = true; await poll(); seen.skippedPoll = alert(); posting = false;
  replies.push(snapshot); await poll(); seen.choiceAfterRecovery = alert();
  replies.push(snapshot); await send("/choice", {}); seen.successfulChoice = alert();
  const result = document.createElement("pre"); result.id = "observations";
  result.textContent = JSON.stringify(seen); document.body.replaceChildren(result);
})().catch(error => {
  document.body.textContent = "observation failed: " + error.message;
});
"""
        document = (ROOT / "footsteps/web/table.html").read_text(encoding="utf-8")
        document = document.replace('<script defer src="/table.js"></script>', "")
        document = document.replace('<link rel="stylesheet" href="/table.css">', "")
        script = (ROOT / "footsteps/web/table.js").read_text(encoding="utf-8")
        scripts = setup + "\nconst snapshot = " + snapshot + ";\n" + script + "\n" + observe
        document = document.replace("</body>", "<script>" + scripts + "</script></body>")
        with tempfile.TemporaryDirectory() as tmp:
            page = Path(tmp) / "table.html"
            page.write_text(document, encoding="utf-8")
            proc = subprocess.run(
                [
                    CHROME,
                    "--headless",
                    "--disable-background-networking",
                    "--no-first-run",
                    f"--user-data-dir={Path(tmp) / 'profile'}",
                    "--dump-dom",
                    page.as_uri(),
                ],
                capture_output=True,
                text=True,
                encoding="utf-8",
                timeout=30,
                check=True,
            )
        _, found, text = proc.stdout.partition('<pre id="observations">')
        self.assertTrue(found, "the production script did not finish: " + proc.stdout[-500:])
        seen = json.loads(unescape(text.split("</pre>", 1)[0]))
        for key, expected in {
            "firstFailure": "offline",
            "ongoingFailure": "still offline",
            "recovered": "",
            "seat": "P0",
            "choiceAfterRefresh": "invalid choice",
            "choiceAfterRecovery": "invalid choice",
            "successfulChoice": "",
        }.items():
            with self.subTest(observation=key):
                self.assertEqual(seen[key], expected)
        self.assertIn("invalid choice", seen["both"])
        self.assertIn("offline again", seen["both"])
        self.assertEqual(seen["skippedPoll"], seen["both"])
