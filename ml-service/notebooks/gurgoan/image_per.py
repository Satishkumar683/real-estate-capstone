import pandas as pd
import requests
import json
from concurrent.futures import ThreadPoolExecutor

df = pd.read_csv('../../data/processed/gurgaon/listing_display.csv')
urls = []
for val in df['PROPERTY_IMAGES'].dropna():
    imgs = json.loads(val) if val != '[]' else []
    if imgs:
        urls.append(imgs[0])  # just check the thumbnail each listing actually uses

sample = urls[:300]  # 300 is enough to estimate the failure rate without hammering their server

def check(url):
    try:
        r = requests.head(url, timeout=5)
        return r.status_code
    except Exception:
        return None

with ThreadPoolExecutor(max_workers=10) as ex:
    results = list(ex.map(check, sample))

dead = sum(1 for r in results if r != 200)
print(f"{dead}/{len(sample)} images dead ({dead/len(sample)*100:.0f}%)")