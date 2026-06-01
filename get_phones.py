#!/usr/bin/env python3
import urllib.parse, urllib.request, json, time, re

restaurants = [
    ('Lobo do Mar', 'Sesimbra'),
    ('Portofino', 'Sesimbra'),
    ('Forte de Santiago', 'Sesimbra'),
    ('Casa do Mar', 'Sesimbra'),
    ('O Pescador', 'Sesimbra'),
    ('Marisqueira O Barbas', 'Sesimbra'),
    ('A Tasca do Zé', 'Sesimbra'),
    ('O Marujo', 'Sesimbra'),
    ('Costa Nossa', 'Sesimbra'),
    ('Pizza na Praia Meco', 'Meco'),
    ('Dôma', 'Sesimbra'),
    ('Praiamar', 'Sesimbra'),
    ('Marulla Beach Bar', 'Sesimbra'),
]

for name, city in restaurants:
    query = urllib.parse.quote(f"{name} {city}")
    url = f"https://nominatim.openstreetmap.org/search?format=json&q={query}"
    print(f'=== {name} {city}')
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            data = json.loads(r.read().decode())
    except Exception as e:
        print(f'search error: {e}')
        continue
    
    if not data:
        print('no result')
        time.sleep(1)
        continue
    
    best = data[0]
    print(f'  candidate: {best.get("display_name")}')
    
    if best.get('osm_type') == 'node':
        node_url = f"https://api.openstreetmap.org/api/0.6/node/{best['osm_id']}"
        try:
            with urllib.request.urlopen(node_url, timeout=30) as r:
                xml = r.read().decode()
        except Exception as e:
            print(f'node error: {e}')
            continue
        
        match = re.search(r'<tag k="phone" v="([^"]+)"', xml)
        if match:
            print(f'  phone: {match.group(1)}')
        else:
            print('  no phone tag')
    else:
        print('non-node')
    
    time.sleep(1)
