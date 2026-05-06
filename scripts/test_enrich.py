"""
Enrich words.json using the Messages API (sequential, incremental saves).
Usage: python scripts/test_enrich.py [--count N]
       N defaults to all words needing enrichment.
       Progress is saved every 50 words — safe to interrupt and restart.
"""
import argparse
import json
import os
import sys
from pathlib import Path

WORDS_PATH = Path("public/data/words.json")
MODEL = "claude-haiku-4-5-20251001"
SAVE_EVERY = 50


def load_words():
    with open(WORDS_PATH, encoding="utf-8") as f:
        return json.load(f)


def save_words(words):
    with open(WORDS_PATH, "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False, indent=2)


def needs_enrichment(word):
    missing_examples = not word.get("examples") or len(word["examples"]) == 0
    missing_detail = not word.get("meaning_vi_detail")
    return missing_examples or missing_detail


def build_prompt(word):
    pos = word.get("pos", [""])[0] if word.get("pos") else ""
    level = word.get("level", "")
    current_vi = word.get("meaning_vi", "")

    return f"""English word: "{word['word']}" ({pos}, CEFR {level})
Current Vietnamese gloss: "{current_vi}"

Return a JSON object with exactly these fields:

- "meaning_vi": SHORT Vietnamese meaning. 2-5 words only. Comma-separated key concepts or synonyms. No full sentences. Example for "abandon": "bỏ cuộc, từ bỏ, rời bỏ"
- "meaning_vi_detail": Full Vietnamese translation as a natural complete sentence (or 2 sentences max). This is the detailed explanation in Vietnamese.
- "meaning_en": Clear English definition, 1-2 sentences, appropriate for {level} learners.
- "phonetic": IPA transcription with stress marks, e.g. "/əˈbændən/".
- "examples": Array of exactly 2 objects with "en" (natural example sentence) and "vi" (accurate Vietnamese translation).

Return ONLY valid JSON, no markdown, no extra text. Example format:
{{"meaning_vi": "bỏ cuộc, từ bỏ", "meaning_vi_detail": "Từ bỏ hoặc buông bỏ quyền kiểm soát; đầu hàng hoặc khuất phục.", "meaning_en": "To give up completely.", "phonetic": "/əˈbændən/", "examples": [{{"en": "She abandoned her car.", "vi": "Cô ấy bỏ lại xe."}}]}}"""


def strip_json(raw):
    raw = raw.strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        inner = []
        for i, line in enumerate(lines):
            if i == 0:
                continue
            if line.strip() == "```" and i == len(lines) - 1:
                continue
            inner.append(line)
        raw = "\n".join(inner).strip()
    return raw


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=0,
                        help="Max words to process (0 = all)")
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY not set.")
        sys.exit(1)

    try:
        import anthropic
    except ImportError:
        print("ERROR: pip install anthropic")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)
    words = load_words()
    words_by_word = {w["word"]: w for w in words}

    targets = [w for w in words if needs_enrichment(w)]
    if args.count > 0:
        targets = targets[:args.count]

    total_needed = sum(1 for w in words if needs_enrichment(w))
    already_done = len(words) - total_needed
    print(f"Total words: {len(words)} | Already enriched: {already_done} | To process: {len(targets)}")
    print(f"Saving every {SAVE_EVERY} words. Safe to Ctrl+C and restart.\n")

    updated = 0
    errors = 0
    since_last_save = 0

    for i, word in enumerate(targets, 1):
        sys.stdout.write(f"  [{i}/{len(targets)}] {word['word']} ... ")
        sys.stdout.flush()
        try:
            msg = client.messages.create(
                model=MODEL,
                max_tokens=1024,
                messages=[{"role": "user", "content": build_prompt(word)}],
            )
            raw = strip_json(msg.content[0].text)
            data = json.loads(raw)

            w = words_by_word[word["word"]]
            if data.get("meaning_vi"):
                w["meaning_vi"] = data["meaning_vi"]
            if data.get("meaning_vi_detail"):
                w["meaning_vi_detail"] = data["meaning_vi_detail"]
            if data.get("meaning_en"):
                w["meaning_en"] = data["meaning_en"]
            if data.get("phonetic"):
                w["phonetic"] = data["phonetic"]
            if data.get("examples") and isinstance(data["examples"], list):
                valid = [e for e in data["examples"] if isinstance(e, dict) and e.get("en") and e.get("vi")]
                if valid:
                    w["examples"] = valid[:2]

            updated += 1
            since_last_save += 1
            print("OK")

        except Exception as e:
            errors += 1
            print(f"ERROR: {e}")

        # Incremental save
        if since_last_save >= SAVE_EVERY:
            save_words(words)
            since_last_save = 0
            remaining = sum(1 for w in words if needs_enrichment(w))
            print(f"  [checkpoint] saved — {updated} updated, {remaining} remaining\n")

    # Final save
    save_words(words)
    remaining = sum(1 for w in words if needs_enrichment(w))
    print(f"\nDone. Updated: {updated} | Errors: {errors} | Still remaining: {remaining}")
    if remaining > 0:
        print("Run again to continue from where it left off.")


if __name__ == "__main__":
    main()
