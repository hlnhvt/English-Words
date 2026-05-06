import json
import time
import urllib.request
import urllib.parse
import urllib.error

print("Loading words.json...")
words_path = "public/data/words.json"
with open(words_path, "r", encoding="utf-8") as f:
    words = json.load(f)

def fetch_dictionary_data(word_text):
    url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{urllib.parse.quote(word_text)}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req)
        data = json.loads(response.read())
        
        # Extract first meaning and examples
        if not data or not isinstance(data, list):
            return None
            
        entry = data[0]
        if not entry.get("meanings"):
            return None
            
        meaning_en = ""
        examples = []
        
        # Try to find the first definition that has an example, or just use the first definition
        for meaning in entry["meanings"]:
            for definition in meaning.get("definitions", []):
                if not meaning_en:
                    meaning_en = definition.get("definition", "")
                
                if definition.get("example"):
                    examples.append({"en": definition["example"]})
                    
        # If we got more than 3 examples, limit to 3
        if len(examples) > 3:
            examples = examples[:3]
            
        return {
            "meaning_en": meaning_en,
            "examples": examples
        }
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        print(f"HTTP Error for {word_text}: {e.code}")
        return None
    except Exception as e:
        print(f"Error for {word_text}: {e}")
        return None

def translate_text(text):
    if not text:
        return ""
    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q={urllib.parse.quote(text)}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req)
        data = json.loads(response.read())
        return "".join([part[0] for part in data[0]])
    except Exception as e:
        print(f"Translation error: {e}")
        return ""

def process_word(word_obj):
    word_text = word_obj["word"]
    print(f"Processing: {word_text}")
    
    # Fetch from dictionary
    dict_data = fetch_dictionary_data(word_text)
    if not dict_data:
        print(f"  -> No dict data found.")
        return False
        
    meaning_en = dict_data["meaning_en"]
    examples = dict_data["examples"]
    
    if not meaning_en:
        print(f"  -> No meaning_en found.")
        return False
        
    word_obj["meaning_en"] = meaning_en
    
    # Translate meaning
    meaning_vi = translate_text(meaning_en)
    word_obj["meaning_vi"] = meaning_vi.lower() if meaning_vi else ""
    
    # Translate examples
    for ex in examples:
        vi_trans = translate_text(ex["en"])
        ex["vi"] = vi_trans if vi_trans else ""
        
    word_obj["examples"] = examples
    print(f"  -> Success. Added meaning and {len(examples)} examples.")
    return True

# Process target words (e.g., 'attach' and the first 50 words that don't have examples)
targets = ["attach", "hello", "book", "computer", "world"]
count = 0
MAX_WORDS = 50

for w in words:
    # process if it's in our explicit targets, or if it doesn't have examples yet
    if w["word"] in targets or (not w.get("examples") and count < MAX_WORDS):
        success = process_word(w)
        if success:
            count += 1
        time.sleep(1) # Sleep to avoid rate limiting
        
    if count >= MAX_WORDS:
        break

with open(words_path, "w", encoding="utf-8") as f:
    json.dump(words, f, ensure_ascii=False, indent=2)

print(f"Done! Updated {count} words.")
