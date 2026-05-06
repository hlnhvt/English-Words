import json
import os
import time
import urllib.request
import urllib.parse

print("Loading words.json...")
words_path = "public/data/words.json"
with open(words_path, "r", encoding="utf-8") as f:
    words = json.load(f)

print("Loading English Dictionary...")
try:
    with open("dictionary.json", "r", encoding="utf-8") as f:
        en_dict = json.load(f)
except Exception as e:
    print("Could not load dictionary.json:", e)
    en_dict = {}

def translate_batch(text):
    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q={urllib.parse.quote(text)}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    response = urllib.request.urlopen(req)
    data = json.loads(response.read())
    return "".join([part[0] for part in data[0]])

CHUNK_SIZE = 50
total_chunks = (len(words) + CHUNK_SIZE - 1) // CHUNK_SIZE

print(f"Translating {len(words)} words in {total_chunks} chunks...")

for i in range(total_chunks):
    start = i * CHUNK_SIZE
    end = min(start + CHUNK_SIZE, len(words))
    chunk = words[start:end]
    
    to_translate = []
    for w in chunk:
        if not w.get("meaning_vi"):
            to_translate.append(w["word"])
            
        if not w.get("meaning_en") and w["word"] in en_dict:
            mean = en_dict[w["word"]].split(";")[0].strip()
            w["meaning_en"] = mean
            
    if not to_translate:
        continue
        
    text_to_translate = "\n".join(to_translate)
    
    try:
        translated_text = translate_batch(text_to_translate)
        translated_lines = [line.strip() for line in translated_text.split("\n") if line.strip()]
        
        if len(translated_lines) == len(to_translate):
            idx = 0
            for w in chunk:
                if not w.get("meaning_vi"):
                    w["meaning_vi"] = translated_lines[idx].lower()
                    idx += 1
        else:
            for w in chunk:
                if not w.get("meaning_vi"):
                    try:
                        res = translate_batch(w["word"])
                        w["meaning_vi"] = res.lower().strip()
                    except Exception:
                        pass
    except Exception as e:
        print(f"Error translating chunk {i}: {e}")
        time.sleep(2)
        continue
        
    print(f"Processed chunk {i+1}/{total_chunks} ({end}/{len(words)})")
    
    with open(words_path, "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False)
        
    time.sleep(0.5)

print("Done! Saved updated words.json")
