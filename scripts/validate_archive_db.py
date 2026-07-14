#!/usr/bin/env python3
"""富士見町ローカルアーカイブ台帳 (data/fujimi-archive-db.json) の整合性チェック。

使い方:
  python3 scripts/validate_archive_db.py            # スキーマ・整合性チェック
  python3 scripts/validate_archive_db.py --links    # 出典URLの生存確認も行う（要ネット接続）
"""
import json
import re
import sys
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / 'data' / 'fujimi-archive-db.json'

REQUIRED_FIELDS = [
    'id', 'category', 'keyword', 'page_type', 'era', 'background',
    'confidence', 'confidence_note', 'source_type', 'sources',
    'sense_tags', 'geo', 'town_outside', 'review_log',
]
PAGE_TYPES = {'地の頁', '余白の頁'}
CONFIDENCE_RE = re.compile(r'^[SABCD](/[SABCD])*$')
ID_RE = re.compile(r'^FJM-[A-Z0-9]+-\d{3}$')
# 富士見町中心に諏訪郡・八ヶ岳周辺まで許容（town_outside=True はさらに広く本州程度）
BBOX_TOWN = (35.75, 36.05, 138.05, 138.55)   # lat_min, lat_max, lng_min, lng_max
BBOX_WIDE = (33.0, 38.5, 135.0, 141.0)


def check(records):
    errors, warnings = [], []
    seen_ids = set()
    for i, r in enumerate(records):
        rid = r.get('id', f'(index {i})')
        for f in REQUIRED_FIELDS:
            if f not in r:
                errors.append(f'{rid}: 必須フィールド欠落: {f}')
        if r.get('id') in seen_ids:
            errors.append(f'{rid}: ID重複')
        seen_ids.add(r.get('id'))
        if r.get('id') and not ID_RE.match(r['id']):
            warnings.append(f'{rid}: ID形式が FJM-XXX-000 形式でない')
        if r.get('page_type') not in PAGE_TYPES:
            errors.append(f'{rid}: page_type不正: {r.get("page_type")}')
        conf = r.get('confidence', '')
        if not CONFIDENCE_RE.match(conf):
            errors.append(f'{rid}: confidence表記不正: {conf}')
        srcs = r.get('sources')
        if not isinstance(srcs, list) or not srcs:
            errors.append(f'{rid}: sources が空')
        else:
            for s in srcs:
                if not isinstance(s, str) or not s.strip():
                    errors.append(f'{rid}: 空の出典エントリ')
        geo = r.get('geo')
        if geo is not None:
            if not (isinstance(geo, dict) and 'lat' in geo and 'lng' in geo):
                errors.append(f'{rid}: geo形式不正: {geo}')
            else:
                lat, lng = geo['lat'], geo['lng']
                bbox = BBOX_WIDE if r.get('town_outside') else BBOX_TOWN
                if not (bbox[0] <= lat <= bbox[1] and bbox[2] <= lng <= bbox[3]):
                    warnings.append(f'{rid}: 座標が想定範囲外 (lat={lat}, lng={lng}, town_outside={r.get("town_outside")})')
        rlog = r.get('review_log')
        if not isinstance(rlog, list) or not rlog:
            warnings.append(f'{rid}: review_log が空（未考証）')
        elif rlog[-1].get('verdict') != 'PASS':
            warnings.append(f'{rid}: 最新レビューがPASSでない: {rlog[-1].get("verdict")}')
    return errors, warnings


def check_links(records, timeout=10):
    """出典URLにHEAD/GETを投げ、死んでいるリンクを報告する。"""
    import urllib.request
    import urllib.error
    from concurrent.futures import ThreadPoolExecutor

    urls = {}
    for r in records:
        for s in r.get('sources', []):
            if isinstance(s, str) and s.startswith('http'):
                urls.setdefault(s.strip(), []).append(r['id'])

    def to_ascii_url(url):
        """日本語を含むIRIをurllibが扱えるURIに変換する。"""
        from urllib.parse import urlsplit, urlunsplit, quote
        p = urlsplit(url)
        return urlunsplit((
            p.scheme,
            p.netloc.encode('idna').decode('ascii') if p.netloc else p.netloc,
            quote(p.path, safe='/%'),
            quote(p.query, safe='=&%?/:'),
            quote(p.fragment, safe='%'),
        ))

    def probe(orig_url):
        url = to_ascii_url(orig_url)
        req = urllib.request.Request(url, method='HEAD', headers={'User-Agent': 'Mozilla/5.0 (archive-link-check)'})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as res:
                return orig_url, res.status
        except urllib.error.HTTPError as e:
            if e.code in (403, 405, 429):  # HEAD拒否・bot拒否はGETで再試行
                try:
                    req2 = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (archive-link-check)'})
                    with urllib.request.urlopen(req2, timeout=timeout) as res:
                        return orig_url, res.status
                except Exception as e2:
                    return orig_url, f'ERR {e2}'
            return orig_url, f'HTTP {e.code}'
        except Exception as e:
            return orig_url, f'ERR {e}'

    print(f'出典URL {len(urls)}件を確認中...')
    dead = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        for url, status in ex.map(probe, urls):
            if status != 200:
                dead.append((url, status, urls[url]))
    return dead


def main():
    db = json.loads(DB_PATH.read_text(encoding='utf-8'))
    records = db['records']
    if db.get('count') != len(records):
        print(f'ERROR: count({db.get("count")}) と records({len(records)}) が不一致')
    errors, warnings = check(records)
    for e in errors:
        print(f'ERROR: {e}')
    for w in warnings:
        print(f'WARN:  {w}')
    print(f'--- {len(records)}レコード / エラー{len(errors)} / 警告{len(warnings)}')

    if '--links' in sys.argv:
        dead = check_links(records)
        for url, status, ids in sorted(dead, key=lambda x: str(x[1])):
            print(f'LINK {status}: {url}  ← {", ".join(ids)}')
        print(f'--- リンク切れ疑い {len(dead)}件')
        sys.exit(1 if errors else 0)

    sys.exit(1 if errors else 0)


if __name__ == '__main__':
    main()
