"""
Batch-enrich words.json using the Anthropic Message Batches API.

Usage:
    pip install anthropic

    set ANTHROPIC_API_KEY=sk-ant-...   (Windows CMD)
    $env:ANTHROPIC_API_KEY="sk-ant-..." (PowerShell)

    python scripts/batch_enrich.py                     # submit + wait + apply (default 1000 words)
    python scripts/batch_enrich.py --count 2000
    python scripts/batch_enrich.py --submit-only       # submit and exit (async)
    python scripts/batch_enrich.py --resume            # poll + apply an existing batch
    python scripts/batch_enrich.py --status            # check status only
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

WORDS_PATH = Path("public/data/words.json")
STATE_PATH = Path("scripts/.batch_state.json")
MODEL = "claude-haiku-4-5-20251001"
MAX_TOKENS = 1024
MAX_PER_BATCH = 1000


def load_words():
    with open(WORDS_PATH, encoding="utf-8") as f:
        return json.load(f)


def save_words(words):
    with open(WORDS_PATH, "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False, indent=2)


def load_state():
    if STATE_PATH.exists():
        with open(STATE_PATH, encoding="utf-8") as f:
            return json.load(f)
    return None


def save_state(state):
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(STATE_PATH, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)


def clear_state():
    STATE_PATH.unlink(missing_ok=True)


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


def safe_id(word, idx):
    import re
    sanitized = re.sub(r"[^a-zA-Z0-9_-]", "_", word)[:58]
    return f"{sanitized}_{idx}"


def submit_batch(words, count):
    try:
        import anthropic
    except ImportError:
        print("ERROR: anthropic package not installed. Run: pip install anthropic")
        sys.exit(1)

    client = anthropic.Anthropic()

    targets = [w for w in words if needs_enrichment(w)]
    total_missing = len(targets)
    targets = targets[:count]

    if not targets:
        print("All words are fully enriched. Nothing to do.")
        return None

    print(f"Words needing enrichment: {total_missing}")
    print(f"Submitting batch for {len(targets)} words (model: {MODEL})...")

    requests = [
        {
            "custom_id": safe_id(w["word"], i),
            "params": {
                "model": MODEL,
                "max_tokens": MAX_TOKENS,
                "messages": [{"role": "user", "content": build_prompt(w)}],
            },
        }
        for i, w in enumerate(targets)
    ]

    id_to_word = {safe_id(w["word"], i): w["word"] for i, w in enumerate(targets)}

    batch = client.messages.batches.create(requests=requests)

    state = {
        "batch_id": batch.id,
        "word_count": len(targets),
        "submitted_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "processing_status": batch.processing_status,
        "id_to_word": id_to_word,
    }
    save_state(state)

    print(f"Batch submitted: {batch.id}")
    print(f"Status: {batch.processing_status}")
    return batch.id


def poll_and_apply(words, apply=True):
    try:
        import anthropic
    except ImportError:
        print("ERROR: anthropic package not installed. Run: pip install anthropic")
        sys.exit(1)

    state = load_state()
    if not state:
        print("No pending batch found. Run without --resume to submit a new batch.")
        sys.exit(1)

    client = anthropic.Anthropic()
    batch_id = state["batch_id"]

    print(f"Checking batch: {batch_id}")

    while True:
        batch = client.messages.batches.retrieve(batch_id)
        counts = batch.request_counts
        print(
            f"  Status: {batch.processing_status} | "
            f"processing={counts.processing} succeeded={counts.succeeded} "
            f"errored={counts.errored} expired={counts.expired}"
        )

        if batch.processing_status == "ended":
            break

        if not apply:
            print("Batch still running. Check again later with --resume.")
            return

        print("  Waiting 30 seconds...")
        time.sleep(30)

    if not apply:
        return

    words_by_word = {w["word"]: w for w in words}
    id_to_word = state.get("id_to_word", {})

    updated = 0
    errors = 0
    parse_errors = []

    print(f"\nApplying results...")
    for result in client.messages.batches.results(batch_id):
        word_text = id_to_word.get(result.custom_id, result.custom_id)

        if result.result.type == "errored":
            errors += 1
            print(f"  API ERROR [{word_text}]: {result.result.error.type}")
            continue

        if result.result.type == "expired":
            errors += 1
            continue

        try:
            raw = result.result.message.content[0].text
            raw = strip_json(raw)
            data = json.loads(raw)
        except (json.JSONDecodeError, IndexError, AttributeError) as e:
            errors += 1
            parse_errors.append(word_text)
            if len(parse_errors) <= 5:
                print(f"  PARSE ERROR [{word_text}]: {e}")
            continue

        word_obj = words_by_word.get(word_text)
        if not word_obj:
            continue

        if data.get("meaning_vi"):
            word_obj["meaning_vi"] = data["meaning_vi"]
        if data.get("meaning_vi_detail"):
            word_obj["meaning_vi_detail"] = data["meaning_vi_detail"]
        if data.get("meaning_en"):
            word_obj["meaning_en"] = data["meaning_en"]
        if data.get("phonetic"):
            word_obj["phonetic"] = data["phonetic"]
        if data.get("examples") and isinstance(data["examples"], list):
            valid_examples = [
                ex for ex in data["examples"]
                if isinstance(ex, dict) and ex.get("en") and ex.get("vi")
            ]
            if valid_examples:
                word_obj["examples"] = valid_examples[:2]
                updated += 1

    save_words(words)
    clear_state()

    print(f"\nDone. Updated: {updated} words | Errors: {errors}")
    if parse_errors and len(parse_errors) > 5:
        print(f"  ({len(parse_errors)} total parse errors — first 5 shown above)")

    # Show a sample of enriched words
    enriched = [w for w in words if w.get("meaning_vi_detail")]
    sample = enriched[-3:] if len(enriched) >= 3 else enriched
    if sample:
        print(f"\nSample enriched words:")
        for w in sample:
            print(f"  {w['word']}")
            print(f"    Short:  {w.get('meaning_vi', '')}")
            print(f"    Detail: {w.get('meaning_vi_detail', '')[:80]}")

    remaining = sum(1 for w in words if needs_enrichment(w))
    print(f"\nWords still needing enrichment: {remaining}")
    if remaining > 0:
        print(f"Run again (without --resume) to process the next batch.")


def main():
    parser = argparse.ArgumentParser(description="Batch enrich words.json via Claude API")
    parser.add_argument("--count", type=int, default=MAX_PER_BATCH,
                        help=f"Number of words to process per batch (default: {MAX_PER_BATCH})")
    parser.add_argument("--submit-only", action="store_true",
                        help="Submit batch and exit immediately (don't wait for results)")
    parser.add_argument("--resume", action="store_true",
                        help="Poll an existing batch and apply results")
    parser.add_argument("--status", action="store_true",
                        help="Check batch status without applying results")
    args = parser.parse_args()

    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("ERROR: ANTHROPIC_API_KEY environment variable not set.")
        print("  Windows CMD:   set ANTHROPIC_API_KEY=sk-ant-...")
        print("  PowerShell:    $env:ANTHROPIC_API_KEY=\"sk-ant-...\"")
        sys.exit(1)

    words = load_words()
    print(f"Loaded {len(words)} words from {WORDS_PATH}")

    if args.status:
        poll_and_apply(words, apply=False)
    elif args.resume:
        poll_and_apply(words, apply=True)
    elif args.submit_only:
        if load_state():
            print("WARNING: A pending batch already exists.")
            print("Use --resume to apply it, or delete scripts/.batch_state.json to start fresh.")
            sys.exit(1)
        submit_batch(words, args.count)
        print(f"\nRun with --resume to poll and apply results when ready.")
    else:
        # Default: auto-detect — resume pending batch or submit new one
        if load_state():
            print("Found pending batch — resuming it...")
            poll_and_apply(words, apply=True)
        else:
            batch_id = submit_batch(words, args.count)
            if batch_id:
                print(f"\nWaiting for batch to complete...")
                poll_and_apply(words, apply=True)


if __name__ == "__main__":
    main()
