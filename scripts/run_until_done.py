"""
Watchdog: keeps restarting test_enrich.py until all words are enriched.
Usage: python scripts/run_until_done.py
"""
import json
import os
import subprocess
import sys
import time
from pathlib import Path

WORDS_PATH = Path("public/data/words.json")
LOG_PATH = Path("scripts/enrich_log.txt")
SCRIPT = Path("scripts/test_enrich.py")


def count_remaining():
    with open(WORDS_PATH, encoding="utf-8") as f:
        words = json.load(f)
    return sum(
        1 for w in words
        if not w.get("meaning_vi_detail") or not w.get("examples") or len(w.get("examples", [])) == 0
    )


def count_done():
    with open(WORDS_PATH, encoding="utf-8") as f:
        words = json.load(f)
    return sum(1 for w in words if w.get("meaning_vi_detail")), len(words)


def ts():
    return time.strftime("%H:%M:%S")


def main():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY not set.")
        sys.exit(1)

    run = 1
    with open(LOG_PATH, "a", encoding="utf-8") as log:
        while True:
            remaining = count_remaining()
            done, total = count_done()
            msg = f"\n[{ts()}] === Run #{run} | Done: {done}/{total} | Remaining: {remaining} ===\n"
            print(msg.strip())
            log.write(msg)
            log.flush()

            if remaining == 0:
                finish = f"[{ts()}] ALL WORDS ENRICHED! Total: {total}\n"
                print(finish.strip())
                log.write(finish)
                break

            env = os.environ.copy()
            env["ANTHROPIC_API_KEY"] = api_key

            result = subprocess.run(
                [sys.executable, str(SCRIPT)],
                env=env,
                stdout=log,
                stderr=log,
            )

            done2, _ = count_done()
            exit_msg = f"[{ts()}] Run #{run} ended (exit={result.returncode}). Enriched: {done2}/{total}\n"
            print(exit_msg.strip())
            log.write(exit_msg)
            log.flush()

            run += 1
            if remaining == count_remaining():
                # No progress made — wait longer before retry
                time.sleep(30)
            else:
                time.sleep(3)


if __name__ == "__main__":
    main()
