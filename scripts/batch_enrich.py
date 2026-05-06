"""
Batch-enrich words.json using the Anthropic Message Batches API.

Usage:
    # Install deps first (one time):
    pip install anthropic

    # Set your API key:
    set ANTHROPIC_API_KEY=sk-ant-...   (Windows CMD)
    $env:ANTHROPIC_API_KEY="sk-ant-..." (PowerShell)

    # Run (processes up to --count words per batch submission):
    python scripts/batch_enrich.py                     # submit a new batch (default 1000 words)
    python scripts/batch_enrich.py --count 2000        # larger chunk
    python scripts/batch_enrich.py --resume            # poll + apply a previously submitted batch
    python scripts/batch_enrich.py --status            # check status without applying

Cost estimate (Haiku 4.5 at Batch API 50% discount):
    ~$0.0005/1M input tokens, ~$0.0025/1M output tokens
    Full 4868 words ≈ $0.30-0.60 total across all runs
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

WORDS_PATH = Path("public/data/words.json")
STATE_PATH = Path("scripts/.batch_state.json")
MODEL = "claude-haiku-4-5"
MAX_PER_BATCH = 1000  # stay well under the 100K limit; adjust with --count


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
    with open(STATE_PATH, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)


def clear_state():
    STATE_PATH.unlink(missing_ok=True)


def needs_enrichment(word):
    return not word.get("examples") or len(word["examples"]) == 0


def build_prompt(word):
    pos = word.get("pos", [""])[0] if word.get("pos") else ""
    level = word.get("level", "")
    meaning_vi = word.get("meaning_vi", "")

    return f"""Given the English word "{word['word']}" ({pos}, CEFR level {level}), Vietnamese meaning: "{meaning_vi}".

Provide a JSON object with these fields:
- "meaning_en": A clear 1-2 sentence English definition appropriate for {level} level learners.
- "phonetic": IPA transcription (e.g. "/ˈwɜːrd/"). Include stress marks.
- "examples": Array of exactly 2 objects, each with:
  - "en": A natural English example sentence using the word in context.
  - "vi": Accurate, natural Vietnamese translation of that sentence.

Return ONLY valid JSON, no markdown, no extra text."""


def submit_batch(words, count):
    try:
        import anthropic
    except ImportError:
        print("ERROR: anthropic package not installed. Run: pip install anthropic")
        sys.exit(1)

    client = anthropic.Anthropic()

    # Select words that need enrichment
    targets = [w for w in words if needs_enrichment(w)]
    total_missing = len(targets)
    targets = targets[:count]

    if not targets:
        print("All words already have examples. Nothing to do.")
        return

    print(f"Words missing examples: {total_missing}")
    print(f"Submitting batch for {len(targets)} words (model: {MODEL})...")

    import re

    def safe_id(word, idx):
        # custom_id must match ^[a-zA-Z0-9_-]{1,64}$
        sanitized = re.sub(r"[^a-zA-Z0-9_-]", "_", word)[:60]
        return f"{sanitized}_{idx}"

    requests = [
        {
            "custom_id": safe_id(w["word"], i),
            "params": {
                "model": MODEL,
                "max_tokens": 512,
                "messages": [{"role": "user", "content": build_prompt(w)}],
            },
        }
        for i, w in enumerate(targets)
    ]

    # Map sanitized ID → original word for result parsing
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
    print(f"Saved state to {STATE_PATH}")
    print(f"\nRun again with --resume to poll and apply results.")


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
            f"processing={counts.processing} | "
            f"succeeded={counts.succeeded} | "
            f"errored={counts.errored} | "
            f"expired={counts.expired}"
        )

        if batch.processing_status == "ended":
            break

        if not apply:
            print("Batch still running. Check again later with --resume.")
            return

        print("  Still running — waiting 30 seconds...")
        time.sleep(30)

    if not apply:
        return

    # Build lookup for quick update
    words_by_word = {w["word"]: w for w in words}
    id_to_word = state.get("id_to_word", {})

    updated = 0
    errors = 0

    print(f"\nApplying results...")
    for result in client.messages.batches.results(batch_id):
        # Resolve original word text from the sanitized custom_id
        word_text = id_to_word.get(result.custom_id, result.custom_id)

        if result.result.type == "errored":
            errors += 1
            print(f"  ERROR [{word_text}]: {result.result.error.type}")
            continue

        if result.result.type == "expired":
            errors += 1
            continue

        # Parse the JSON response
        try:
            raw = result.result.message.content[0].text.strip()
            # Strip markdown code fences if present
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            data = json.loads(raw)
        except (json.JSONDecodeError, IndexError, AttributeError) as e:
            errors += 1
            print(f"  PARSE ERROR [{word_text}]: {e}")
            continue

        word_obj = words_by_word.get(word_text)
        if not word_obj:
            continue

        if data.get("meaning_en"):
            word_obj["meaning_en"] = data["meaning_en"]
        if data.get("phonetic"):
            word_obj["phonetic"] = data["phonetic"]
        if data.get("examples") and isinstance(data["examples"], list):
            # Validate structure
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
    print(f"Saved to {WORDS_PATH}")

    # Show remaining count
    remaining = sum(1 for w in words if needs_enrichment(w))
    print(f"Words still missing examples: {remaining}")
    if remaining > 0:
        print(f"Run again (without --resume) to process the next batch.")


def main():
    parser = argparse.ArgumentParser(description="Batch enrich words.json via Claude API")
    parser.add_argument("--count", type=int, default=MAX_PER_BATCH,
                        help=f"Number of words to process per batch (default: {MAX_PER_BATCH})")
    parser.add_argument("--resume", action="store_true",
                        help="Poll an existing batch and apply results")
    parser.add_argument("--status", action="store_true",
                        help="Check batch status without applying results")
    args = parser.parse_args()

    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("ERROR: ANTHROPIC_API_KEY environment variable not set.")
        print("Set it with: set ANTHROPIC_API_KEY=sk-ant-...")
        sys.exit(1)

    words = load_words()
    print(f"Loaded {len(words)} words from {WORDS_PATH}")

    if args.status:
        poll_and_apply(words, apply=False)
    elif args.resume:
        poll_and_apply(words, apply=True)
    else:
        if load_state():
            print("WARNING: A pending batch already exists.")
            print("Use --resume to apply it, or delete scripts/.batch_state.json to start fresh.")
            sys.exit(1)
        submit_batch(words, args.count)


if __name__ == "__main__":
    main()
