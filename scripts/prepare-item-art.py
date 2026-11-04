"""Prepare cosmetic-only, offline item artwork. No stats enter the PoB runtime."""
import concurrent.futures, hashlib, io, json, pathlib, time, urllib.parse, urllib.request, uuid
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parent.parent
LOCAL = ROOT / '.local'
HEADERS = {'User-Agent': 'POK-UI-artwork/0.1 (+https://github.com/skerfolg/pok-ui)'}

def read_json(url, cache):
    if cache.exists(): return json.loads(cache.read_text(encoding='utf8'))
    with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=45) as response: raw = response.read()
    cache.write_bytes(raw)
    return json.loads(raw)

def main():
    LOCAL.mkdir(exist_ok=True)
    catalog = json.loads((ROOT / 'resources/pob-editor/catalog.json').read_text(encoding='utf8'))
    source_url = 'https://raw.githubusercontent.com/repoe-fork/poe2/master/data/base_items.json'
    bases = read_json(source_url, LOCAL / 'poe2-base-art-source.json')
    stage = LOCAL / ('item-art-stage-' + uuid.uuid4().hex)
    (stage / 'images').mkdir(parents=True)
    cache = LOCAL / 'item-art-downloads'; cache.mkdir(exist_ok=True)
    jobs, base_keys, unique_keys = {}, {}, {}
    def add(url, width=1, height=1):
        jobs.setdefault(url, {'gridWidth': width, 'gridHeight': height})
        return url
    by_name = {}
    for value in bases.values():
        visual = value.get('visual_identity') or {}; dds = visual.get('dds_file')
        if not dds or not dds.startswith('Art/2DItems/') or '..' in dds: continue
        by_name.setdefault(value['name'], []).append(value)
    for entry in catalog['entries']:
        if entry['type'] != 'base': continue
        candidates = by_name.get(entry['name'], [])
        paths = {(value.get('visual_identity') or {}).get('dds_file') for value in candidates}
        if len(paths) != 1: continue
        value = candidates[0]; asset = next(iter(paths))[:-4] + '.webp'
        url = 'https://cdn.poe2db.tw/image/' + urllib.parse.quote(asset, safe='/')
        base_keys[entry['name']] = add(url, value.get('inventory_width') or 1, value.get('inventory_height') or 1)
    leagues = read_json('https://poe.ninja/poe2/api/economy/leagues', LOCAL / 'art-probe-leagues.json')
    league = leagues[0]['id']; names = {}
    categories = ['UniqueWeapons','UniqueArmours','UniqueAccessories','UniqueFlasks','UniqueCharms','UniqueJewels']
    native_names = {entry['name'] for entry in catalog['entries'] if entry['type'] == 'unique'}
    for category in categories:
        url = 'https://poe.ninja/poe2/api/economy/stash/current/item/overview?' + urllib.parse.urlencode({'league': league,'type': category})
        data = read_json(url, LOCAL / ('art-' + category + '.json'))
        for entry in data['lines']:
            icon = entry.get('icon', '')
            if entry['name'] not in native_names or not icon.startswith('https://web.poecdn.com/'): continue
            names.setdefault(entry['name'], set()).add(icon)
            unique_keys[entry['name'] + '\n' + entry.get('baseType', '')] = add(icon)
    for name, icons in names.items():
        if len(icons) == 1: unique_keys[name] = next(iter(icons))
    def download(pair):
        url, shape = pair; key = hashlib.sha256(url.encode()).hexdigest(); saved = cache / key
        try:
            if saved.exists(): raw = saved.read_bytes()
            else:
                for attempt in range(3):
                    try:
                        with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=25) as response: raw = response.read(2*1024*1024+1)
                        break
                    except Exception:
                        if attempt == 2: raise
                        time.sleep(attempt+1)
                if len(raw) > 2*1024*1024: raise ValueError('Oversized image')
                saved.write_bytes(raw)
            with Image.open(io.BytesIO(raw)) as image:
                width,height=image.size; format=image.format; image.verify()
            if format not in ['PNG','WEBP'] or width > 2048 or height > 2048: raise ValueError('Unsupported image')
            digest=hashlib.sha256(raw).hexdigest(); extension='png' if format=='PNG' else 'webp'
            (stage / 'images' / (digest+'.'+extension)).write_bytes(raw)
            return url, {'hash':digest,'width':width,'height':height,'mime':'image/'+extension,'file':'images/'+digest+'.'+extension,**shape,'source':url}
        except Exception as error: return url, {'error':str(error)}
    results={}
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        for index,(url,value) in enumerate(pool.map(download,jobs.items())):
            results[url]=value
            if index%50==0: print('artwork',index,'/',len(jobs),flush=True)
    files={value['hash']:value for value in results.values() if 'hash' in value}
    index={'schemaVersion':1,'preparedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'pobCommit':catalog['source']['commit'],
           'sources':[source_url,'https://poe.ninja/docs/api','https://cdn.poe2db.tw/'],'league':league,
           'bases':{name:results[url]['hash'] for name,url in base_keys.items() if 'hash' in results[url]},
           'uniques':{name:results[url]['hash'] for name,url in unique_keys.items() if 'hash' in results[url]},'files':files,
           'missing':{url:value['error'] for url,value in results.items() if 'error' in value}}
    (stage/'index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    target=ROOT/'resources/item-art'; backup=LOCAL/('item-art-backup-'+uuid.uuid4().hex)
    assert target.resolve().parent == (ROOT/'resources').resolve() and backup.resolve().is_relative_to(LOCAL.resolve())
    if target.exists(): target.rename(backup)
    try: stage.rename(target)
    except Exception:
        if backup.exists(): backup.rename(target)
        raise
    print('prepared',len(index['bases']),'base names,',len(index['uniques']),'unique keys,',len(files),'images; missing',len(index['missing']))

if __name__=='__main__': main()
