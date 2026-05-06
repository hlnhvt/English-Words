import fitz, json, re

# Extract PDFs
doc = fitz.open('American_Oxford_3000.pdf')
txt3k = ''.join([page.get_text() for page in doc])
doc2 = fitz.open('The_Oxford_5000_by_CEFR_level.pdf')
txt5k = ''.join([page.get_text() for page in doc2])

# Save raw files
with open('oxford_3000_raw.txt','w',encoding='utf-8') as f: f.write(txt3k)
with open('oxford_5000_raw.txt','w',encoding='utf-8') as f: f.write(txt5k)

def parse_pos(s):
    s = re.sub(r'\b[ABC][12]\b', '', s).strip()
    tags = re.findall(r'(?:n\.|v\.|adj\.|adv\.|prep\.|conj\.|pron\.|det\.|exclam\.|modal v\.|auxiliary v\.|number|indefinite article|det\./pron\.|adj\./adv\.)', s)
    return list(dict.fromkeys([t.strip().rstrip(',') for t in tags if t.strip()])) or ['n.']

lo = {'A1':1,'A2':2,'B1':3,'B2':4,'C1':5}

# Parse 3000
words = {}
for line in txt3k.split('\n'):
    line = line.strip()
    if not line or line.startswith('\u00a9') or 'The Oxford' in line or re.match(r'^\d+ / \d+$', line): continue
    levels = re.findall(r'\b(A1|A2|B1|B2)\b', line)
    if not levels: continue
    primary = min(levels, key=lambda x: lo.get(x,99))
    m = re.match(r"^([a-zA-Z\s,'-]+?)(?:\s*\(.*?\))?\s+(?:indefinite article|det\./pron\.|adj\./adv\.|n\.|v\.|adj\.|adv\.|prep\.|conj\.|pron\.|det\.|exclam\.|modal v\.|auxiliary v\.|number)", line)
    if not m: m = re.match(r"^([a-zA-Z\s,'-]+?)\s+(?:A1|A2|B1|B2)", line)
    if not m: continue
    w = re.sub(r'\d+$','',m.group(1).strip().split(',')[0].strip()).lower()
    if not w: continue
    pos = parse_pos(line[len(m.group(1)):])
    if w in words:
        if lo.get(primary,99) < lo.get(words[w]['level'],99): words[w]['level'] = primary
        for p in pos:
            if p not in words[w]['pos']: words[w]['pos'].append(p)
    else:
        words[w] = {'word':w,'pos':pos,'level':primary}
print(f'3000: {len(words)}')

# Parse 5000 extra
w5 = {}
lvl = 'B2'
for line in txt5k.split('\n'):
    line = line.strip()
    if not line or line.startswith('\u00a9') or 'The Oxford' in line or re.match(r'^\d+ / \d+$', line): continue
    if line == 'B2': lvl='B2'; continue
    if line == 'C1': lvl='C1'; continue
    m = re.match(r"^([a-zA-Z\s'-]+?)(?:\s*\(.*?\))?\s+((?:n\.|v\.|adj\.|adv\.|prep\.|conj\.|pron\.|det\.|exclam\.|number|adj\./adv\.|det\./pron\.).*?)$", line)
    if not m: continue
    w = re.sub(r'\d+$','',m.group(1).strip()).lower()
    if not w: continue
    pos = parse_pos(m.group(2))
    if w in w5:
        for p in pos:
            if p not in w5[w]['pos']: w5[w]['pos'].append(p)
    else:
        w5[w] = {'word':w,'pos':pos,'level':lvl}
print(f'5000 extra: {len(w5)}')

# Merge
for w,d in w5.items():
    if w not in words:
        words[w] = d
    else:
        if lo.get(d['level'],99) < lo.get(words[w]['level'],99): words[w]['level'] = d['level']
        for p in d['pos']:
            if p not in words[w]['pos']: words[w]['pos'].append(p)

result = sorted([{
    'word':d['word'],
    'pos':d['pos'],
    'level':d['level'],
    'meaning_en':'',
    'meaning_vi':'',
    'examples':[],
    'phonetic':''
} for d in words.values()], key=lambda x:x['word'])

with open('public/data/words.json','w',encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False)

print(f'Total: {len(result)}')
for l in ['A1','A2','B1','B2','C1']:
    cnt = sum(1 for w in result if w["level"]==l)
    print(f'  {l}: {cnt}')
