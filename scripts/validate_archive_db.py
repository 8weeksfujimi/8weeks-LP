#!/usr/bin/env python3
"""8weeks Local Archive 台帳の整合性チェック。

台帳は一つ（data/archive-db.json）。土地（サブリージョン）ごとの書き出し元
（data/archive-config.json の subregions[].source）を scripts/build_archive_pages.py が合わせて作る。
このスクリプトは、書き出し元の形と、一つの台帳が書き出し元と合っているかを確かめる。
まだ無い土地の書き出し元は飛ばす。

使い方:
  python3 scripts/validate_archive_db.py                 # 形と整合性
  python3 scripts/validate_archive_db.py --links         # 出典URLの生存確認も行う（要ネット接続）
  python3 scripts/validate_archive_db.py --strict        # 警告もエラーとして終了コードに反映する
  python3 scripts/validate_archive_db.py --region=suwa   # 一つの土地だけ
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG = json.loads((ROOT / 'data' / 'archive-config.json').read_text(encoding='utf-8'))
SUB_IDS = [s['id'] for s in CONFIG['subregions']]

REQUIRED_FIELDS = [
    'id', 'category', 'keyword', 'page_type', 'era', 'background',
    'confidence', 'confidence_note', 'source_type', 'sources',
    'sense_tags', 'geo', 'town_outside', 'review_log',
]
# 蓼科・諏訪の書き出し元が持つ項目（富士見の書き出し元には無い。あれば形を確かめる）
EXTENDED_FIELDS = [
    'subregion', 'municipality', 'yomi', 'keyword_en', 'summary_en', 'capital',
    'source_details', 'references', 'geo_precision', 'geo_note',
    'related_records', 'open_questions',
]
# 公開してはいけない内部の項目
INTERNAL_FIELDS = ['caution', 'evidence', 'editor_note', 'internal_note']
PAGE_TYPES = {'地の頁', '余白の頁'}
CONFIDENCE_RE = re.compile(r'^[SABCD](/[SABCD])*$')
# 本文に入れない語（宣伝の語彙・読者への呼びかけ・宿のこと）。蓼科・諏訪の本文に対して確かめる
PROMO_WORDS = ['絶景', '必見', '穴場', '大人気', '癒やし', '癒し', 'おすすめ', 'ぜひ', '魅力的',
               'パワースポット', 'インスタ映え', '聖地巡礼', 'ロケ地', 'あなた', '8weeks', '当館', '当宿']
EDITION_RE = re.compile(r'(富士見|蓼科|諏訪)編')
# 座標の想定範囲（lat_min, lat_max, lng_min, lng_max）
BBOX_TOWN = (35.75, 36.05, 138.05, 138.55)   # 富士見町中心に諏訪郡・八ヶ岳周辺まで
BBOX_WIDE = (33.0, 38.5, 135.0, 141.0)       # 富士見の町域外を含む記録は本州程度まで
BBOX = {'tateshina': (35.90, 36.25, 138.00, 138.50), 'suwa': (35.95, 36.20, 137.95, 138.30)}


def check(records, sub, all_ids):
    errors, warnings = [], []
    id_re = re.compile(r'^' + re.escape(sub['id_prefix']) + r'[A-Z0-9]+-\d{3}$')
    extended = sub['id'] != 'fujimi'
    seen_ids = set()
    for i, r in enumerate(records):
        rid = r.get('id', f'(index {i})')
        for f in REQUIRED_FIELDS + (EXTENDED_FIELDS if extended else []):
            if f not in r:
                errors.append(f'{rid}: 必須フィールド欠落: {f}')
        for f in INTERNAL_FIELDS:
            if f in r:
                errors.append(f'{rid}: 内部の項目が公開データに残っている: {f}')
        if r.get('id') in seen_ids:
            errors.append(f'{rid}: ID重複')
        seen_ids.add(r.get('id'))
        if r.get('id') and not id_re.match(r['id']):
            (errors if extended else warnings).append(f'{rid}: ID形式が {sub["id_prefix"]}XXX-000 形式でない')
        if r.get('page_type') not in PAGE_TYPES:
            errors.append(f'{rid}: page_type不正: {r.get("page_type")}')
        conf = r.get('confidence', '')
        if not CONFIDENCE_RE.match(conf):
            errors.append(f'{rid}: confidence表記不正: {conf}')
        elif extended and conf.split('/') != sorted(conf.split('/'), key='SABCD'.index):
            warnings.append(f'{rid}: confidence は高い順に並べる: {conf}')
        srcs = r.get('sources')
        if not isinstance(srcs, list) or not srcs:
            errors.append(f'{rid}: sources が空')
        else:
            for s in srcs:
                if not isinstance(s, str) or not s.strip():
                    errors.append(f'{rid}: 空の出典エントリ')
                elif not re.match(r'^https?://', s):
                    (errors if extended else warnings).append(f'{rid}: 出典が URL の形ではない: {s[:60]}')
            if len(srcs) < 2:
                errors.append(f'{rid}: 出典が2件未満')
            if len(set(srcs)) != len(srcs):
                warnings.append(f'{rid}: 出典URLが重複している')
        geo = r.get('geo')
        if geo is not None:
            if not (isinstance(geo, dict) and 'lat' in geo and 'lng' in geo):
                errors.append(f'{rid}: geo形式不正: {geo}')
            else:
                lat, lng = geo['lat'], geo['lng']
                bbox = BBOX.get(sub['id']) or (BBOX_WIDE if r.get('town_outside') else BBOX_TOWN)
                if not (bbox[0] <= lat <= bbox[1] and bbox[2] <= lng <= bbox[3]):
                    warnings.append(f'{rid}: 座標が想定範囲外 (lat={lat}, lng={lng}, town_outside={r.get("town_outside")})')
        rlog = r.get('review_log')
        last = str(rlog[-1].get('verdict', '')) if isinstance(rlog, list) and rlog else ''
        if not last:
            warnings.append(f'{rid}: review_log が空（未考証）')
        elif not last.startswith('PASS') and '修正済み' not in last:
            (errors if extended else warnings).append(f'{rid}: 最新レビューがPASSでない: {last}')
        for x in r.get('related_records') or []:
            if x not in all_ids:
                errors.append(f'{rid}: related_records に実在しないID: {x}')
            elif x == r.get('id'):
                errors.append(f'{rid}: related_records に自分自身')

        if not extended:
            continue
        # ---- ここから蓼科・諏訪の書き出し元の項目 ----
        if r.get('subregion') != sub['id']:
            errors.append(f'{rid}: subregion が {sub["id"]} でない: {r.get("subregion")}')
        if r.get('capital') not in CONFIG['capitals']:
            errors.append(f'{rid}: capital 不正: {r.get("capital")}')
        if not (r.get('municipality') or '').strip():
            errors.append(f'{rid}: municipality が空')
        bg = r.get('background', '')
        if not 280 <= len(bg) <= 520:
            warnings.append(f'{rid}: background の長さが目安（300〜480字）から外れる: {len(bg)}字')
        hits = [w for w in PROMO_WORDS if w in bg]
        if hits:
            errors.append(f'{rid}: background に入れない語がある: {hits}')
        for f in ('keyword', 'summary_en', 'cx_idea', 'reciprocity_axis'):
            hits = [w for w in ('8weeks', '当館', '当宿') if w in (r.get(f) or '')]
            if hits:
                errors.append(f'{rid}: {f} に宿のことが書いてある: {hits}')
        if re.search(r'(FJM|TSN|SUW)-[A-Z]+-\d{3}', bg):
            errors.append(f'{rid}: background の地の文に記録のIDが書いてある')
        for f in ('background', 'cx_idea', 'reciprocity_axis', 'confidence_note'):
            if EDITION_RE.search(r.get(f) or ''):
                errors.append(f'{rid}: {f} に「〜編」という言い方がある（台帳は一つ。「富士見の記録」などと書く）')
        if 'D' in conf.split('/'):
            warnings.append(f'{rid}: 確度Dを含む。Dの話が background に入っていないか確かめる')
        details = r.get('source_details') or []
        durls = {d.get('url') for d in details if isinstance(d, dict)}
        for s in srcs or []:
            if s not in durls:
                warnings.append(f'{rid}: source_details に無い出典: {s}')
        for d in details:
            if d.get('kind') not in CONFIG['detail_kind_map']:
                errors.append(f'{rid}: source_details の kind 不正: {d.get("kind")} ({d.get("url")})')
            if d.get('url') not in (srcs or []):
                warnings.append(f'{rid}: sources に無い source_details: {d.get("url")}')
        strong = {CONFIG['detail_kind_map'].get(d.get('kind')) for d in details} & {'public', 'heritage', 'academic', 'museum'}
        if (set(conf.split('/')) & {'S', 'A'}) and not strong:
            errors.append(f'{rid}: S・A を付けているのに、公的・文化財DB・学術・博物館の出典が一つもない')
        if geo is not None and r.get('geo_precision') not in ('poi', 'approx'):
            errors.append(f'{rid}: geo があるのに geo_precision が poi/approx でない')
        if geo is not None and not r.get('geo_note'):
            warnings.append(f'{rid}: geo の出所（geo_note）が無い')
        for ref in r.get('references') or []:
            if not ref.get('citation'):
                errors.append(f'{rid}: references に citation の無い項目')
            elif not ref.get('url'):
                warnings.append(f'{rid}: 実在を確かめた頁（url）の無い書誌: {ref["citation"][:30]}')
    return errors, warnings


def check_db(all_ids):
    """一つの台帳（data/archive-db.json）と、そこから作った生成物（記録の頁・総目録・土地の入口・統計・sitemap・方法の頁の統計欄）が、
    いまの書き出し元・設定・生成スクリプトと合っているか（scripts/build_archive_pages.py --check を呼ぶ）。"""
    errors, warnings = [], []
    p = ROOT / CONFIG['db']['file']
    if not p.exists():
        return [f'{CONFIG["db"]["file"]} が無い。python3 scripts/build_archive_pages.py を回す'], warnings
    res = subprocess.run([sys.executable, str(ROOT / 'scripts' / 'build_archive_pages.py'), '--check'],
                         capture_output=True, text=True)
    if res.returncode != 0:
        errors.append((res.stderr or res.stdout).strip().splitlines()[-1] if (res.stderr or res.stdout).strip() else '一つの台帳の確認に失敗')
    db = json.loads(p.read_text(encoding='utf-8'))
    recs = db.get('records', [])
    if db.get('count') != len(recs):
        errors.append(f'count({db.get("count")}) と records({len(recs)}) が不一致')
    ids = [r.get('id') for r in recs]
    if len(set(ids)) != len(ids):
        errors.append('一つの台帳の中でIDが重複している')
    if set(ids) != set(all_ids):
        errors.append(f'一つの台帳のIDが書き出し元と合わない（差 {len(set(ids) ^ set(all_ids))}件）')
    prefix = {s['id']: s['id_prefix'] for s in CONFIG['subregions']}
    for r in recs:
        rid = r.get('id')
        if r.get('subregion') not in SUB_IDS:
            errors.append(f'{rid}: subregion が設定に無い: {r.get("subregion")}')
        elif not str(rid).startswith(prefix[r['subregion']]):
            errors.append(f'{rid}: IDの頭が土地（{r["subregion"]}）と合わない')
        for x in r.get('related_subregions') or []:
            if x not in SUB_IDS or x == r.get('subregion'):
                errors.append(f'{rid}: related_subregions 不正: {x}')
        if not r.get('updated'):
            errors.append(f'{rid}: updated（版の日付）が無い')
        for f in INTERNAL_FIELDS:
            if f in r:
                errors.append(f'{rid}: 内部の項目が一つの台帳に残っている: {f}')
    counts = {s['id']: s['count'] for s in db.get('subregions', [])}
    for sid, n in counts.items():
        if n != sum(1 for r in recs if r.get('subregion') == sid):
            errors.append(f'subregions の count が合わない: {sid}')
    # 記録の頁（生成物）が、台帳の記録と一対一になっているか
    out = ROOT / 'records'
    if out.exists():
        pages = {f.stem for f in out.glob('*.html')}
        extra = {'index'} | set(SUB_IDS)
        missing = sorted(set(ids) - pages)
        stale = sorted(pages - set(ids) - extra)
        if missing:
            errors.append(f'記録の頁が足りない {len(missing)}件（例 {missing[:3]}）。build を回す')
        if stale:
            errors.append(f'台帳に無い記録の頁が残っている {len(stale)}件（例 {stale[:3]}）。build を回す')
    else:
        warnings.append('records/ が無い（記録の頁が未生成）')
    return errors, warnings


def check_links(records, timeout=12):
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
            if e.code in (403, 404, 405, 429, 500, 501):  # HEAD拒否・bot拒否はGETで再試行
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
    total_err = total_warn = 0
    loaded = []
    for sub in CONFIG['subregions']:
        p = ROOT / sub['source']
        if p.exists():
            loaded.append((sub, json.loads(p.read_text(encoding='utf-8'))))
        else:
            print(f'（{sub["label"]}の書き出し元 {sub["source"]} はまだ無い。飛ばす）')
    all_ids = {r['id'] for _, db in loaded for r in db['records']}
    if len(all_ids) != sum(len(db['records']) for _, db in loaded):
        print('ERROR: 土地をまたいでIDが重複している')
        total_err += 1
    all_records = []
    only = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--region=') or a.startswith('--area=')), None)
    for sub, db in loaded:
        records = db['records']
        if only and sub['id'] != only:
            continue
        all_records += records
        if db.get('count') != len(records):
            print(f'ERROR: [{sub["label"]}] count({db.get("count")}) と records({len(records)}) が不一致')
            total_err += 1
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', str(db.get('updated', ''))):
            print(f'ERROR: [{sub["label"]}] updated（版の日付 YYYY-MM-DD）が無い: {db.get("updated")}')
            total_err += 1
        errors, warnings = check(records, sub, all_ids)
        for e in errors:
            print(f'ERROR: {e}')
        for w in warnings:
            print(f'WARN:  {w}')
        print(f'--- {sub["label"]}: {len(records)}レコード / エラー{len(errors)} / 警告{len(warnings)}')
        total_err += len(errors)
        total_warn += len(warnings)

    if not only:
        errors, warnings = check_db(all_ids)
        for e in errors:
            print(f'ERROR: [一つの台帳] {e}')
        for w in warnings:
            print(f'WARN:  [一つの台帳] {w}')
        print(f'--- 一つの台帳（{CONFIG["db"]["file"]}）: {len(all_ids)}レコード / エラー{len(errors)} / 警告{len(warnings)}')
        total_err += len(errors)
        total_warn += len(warnings)

    if '--links' in sys.argv:
        dead = check_links(all_records)
        for url, status, ids in sorted(dead, key=lambda x: str(x[1])):
            print(f'LINK {status}: {url}  ← {", ".join(ids)}')
        print(f'--- リンク切れ疑い {len(dead)}件')

    sys.exit(1 if total_err or ('--strict' in sys.argv and total_warn) else 0)


if __name__ == '__main__':
    main()
