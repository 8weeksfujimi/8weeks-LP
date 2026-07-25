#!/usr/bin/env python3
"""道行きの栞データ (data/fujimi-taste-bundles.json) の整合性チェック。

使い方:
  python3 scripts/validate_taste_bundles.py           # スキーマ・整合性チェック
  python3 scripts/validate_taste_bundles.py --links   # 出典URLの生存確認も行う（要ネット接続）

エリア（富士見を中心に白州・蓼科・諏訪・小淵沢）、味スポット、場所、
道行き（trails）が参照する記録ID・味ID・場所IDの実在を確認する。
台帳側は data/fujimi-archive-db.json を参照。
"""
import json
import re
import sys
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / 'data'
TB_PATH = DATA_DIR / 'fujimi-taste-bundles.json'
DB_PATH = DATA_DIR / 'fujimi-archive-db.json'

AREA_REQUIRED = ['id', 'name', 'en', 'role', 'desc']
SPOT_REQUIRED = ['id', 'area', 'name', 'genre', 'area_label', 'geo', 'desc', 'confidence', 'sources']
TASTE_EXTRA = ['story_hook']
TRAIL_REQUIRED = ['id', 'area', 'title', 'narrative', 'stops', 'discovery', 'duration']
TASTE_ID_RE = re.compile(r'^TASTE-\d{3}$')
PLACE_ID_RE = re.compile(r'^PLACE-\d{3}$')
TRAIL_ID_RE = re.compile(r'^TRAIL-\d{3}$')
CONFIDENCE_RE = re.compile(r'^[SABCD](/[SABCD])*$')
# 富士見を中心に、白州（北杜市）・蓼科／霧ヶ峰・諏訪・小淵沢まで許容
BBOX = (35.70, 36.15, 138.03, 138.55)


def check_spot(t, errors, warnings, id_re, kind_name, taste=False):
    tid = t.get('id', '(no id)')
    required = SPOT_REQUIRED + (TASTE_EXTRA if taste else [])
    for f in required:
        if f not in t:
            errors.append(f'{tid}: 必須フィールド欠落: {f}')
    if t.get('id') and not id_re.match(t['id']):
        warnings.append(f'{tid}: ID形式が{kind_name}-000 形式でない')
    if not CONFIDENCE_RE.match(t.get('confidence', '')):
        errors.append(f'{tid}: confidence表記不正: {t.get("confidence")}')
    srcs = t.get('sources')
    if not isinstance(srcs, list) or len(srcs) < 2:
        errors.append(f'{tid}: sources が2件未満（実在確認のため2出典以上）')
    geo = t.get('geo')
    if geo is not None:
        if not (isinstance(geo, dict) and 'lat' in geo and 'lng' in geo):
            errors.append(f'{tid}: geo形式不正: {geo}')
        elif not (BBOX[0] <= geo['lat'] <= BBOX[1] and BBOX[2] <= geo['lng'] <= BBOX[3]):
            warnings.append(f'{tid}: 座標が想定範囲外 (lat={geo["lat"]}, lng={geo["lng"]})')
        if isinstance(geo, dict) and t.get('geo_precision') == 'approx' and not t.get('geo_note'):
            warnings.append(f'{tid}: 近似座標なのに geo_note がない')
    elif not t.get('geo_note'):
        warnings.append(f'{tid}: geo が null なのに geo_note がない（絵図に置けない）')
    if t.get('closed_suspected'):
        warnings.append(f'{tid}: 閉店疑いフラグつき（要確認）')


def check(tb, record_ids):
    errors, warnings = [], []

    area_ids = set()
    centers = 0
    for a in tb.get('areas', []):
        aid = a.get('id', '(no id)')
        for f in AREA_REQUIRED:
            if f not in a:
                errors.append(f'area {aid}: 必須フィールド欠落: {f}')
        if a.get('id') in area_ids:
            errors.append(f'area {aid}: ID重複')
        area_ids.add(a.get('id'))
        if a.get('role') == 'center':
            centers += 1
        elif a.get('role') != 'sub':
            errors.append(f'area {aid}: role不正: {a.get("role")}')
    if centers != 1:
        errors.append(f'中心エリア（role=center）が{centers}件（1件であるべき）')

    taste_ids, place_ids = set(), set()
    for t in tb.get('taste_spots', []):
        if t.get('id') in taste_ids:
            errors.append(f'{t.get("id")}: ID重複')
        taste_ids.add(t.get('id'))
        check_spot(t, errors, warnings, TASTE_ID_RE, 'TASTE', taste=True)
        if t.get('area') not in area_ids:
            errors.append(f'{t.get("id")}: 存在しないエリア: {t.get("area")}')
        for rid in t.get('related_records', []):
            if rid not in record_ids:
                errors.append(f'{t.get("id")}: related_records に存在しない記録ID: {rid}')

    for p in tb.get('places', []):
        if p.get('id') in place_ids:
            errors.append(f'{p.get("id")}: ID重複')
        place_ids.add(p.get('id'))
        check_spot(p, errors, warnings, PLACE_ID_RE, 'PLACE')
        if p.get('area') not in area_ids:
            errors.append(f'{p.get("id")}: 存在しないエリア: {p.get("area")}')

    trail_ids = set()
    for tr in tb.get('trails', []):
        trid = tr.get('id', '(no id)')
        for f in TRAIL_REQUIRED:
            if f not in tr:
                errors.append(f'{trid}: 必須フィールド欠落: {f}')
        if tr.get('id') in trail_ids:
            errors.append(f'{trid}: ID重複')
        trail_ids.add(tr.get('id'))
        if tr.get('id') and not TRAIL_ID_RE.match(tr['id']):
            warnings.append(f'{trid}: ID形式が TRAIL-000 形式でない')
        if tr.get('area') not in area_ids:
            errors.append(f'{trid}: 存在しないエリア: {tr.get("area")}')
        stops = tr.get('stops', [])
        if len(stops) < 2:
            errors.append(f'{trid}: stops が2件未満（束にならない）')
        kinds = {'record': 0, 'taste': 0, 'place': 0}
        pools = {'record': record_ids, 'taste': taste_ids, 'place': place_ids}
        for j, s in enumerate(stops):
            kind, ref = s.get('kind'), s.get('ref')
            if kind not in kinds:
                errors.append(f'{trid}: stops[{j}] kind不正: {kind}')
                continue
            kinds[kind] += 1
            if ref not in pools[kind]:
                errors.append(f'{trid}: stops[{j}] 存在しない{kind} ID: {ref}')
        if kinds['record'] == 0 and kinds['place'] == 0:
            warnings.append(f'{trid}: 訪ね先（記録・場所）がない')
        if kinds['taste'] == 0:
            warnings.append(f'{trid}: 味の立ち寄り先がない（うまいものを欠く）')
        if kinds['record'] == 0:
            warnings.append(f'{trid}: 台帳の記録に触れない（知的な発見が薄くなる）')

        # 道順（Googleマップ連携）と時間割の形式
        route = tr.get('route')
        if route is None:
            warnings.append(f'{trid}: route がない（Googleマップの道順ボタンが出ない）')
        else:
            if route.get('kind') not in ('chain', 'dest'):
                errors.append(f'{trid}: route.kind 不正: {route.get("kind")}')
            if route.get('mode') not in ('walking', 'driving'):
                errors.append(f'{trid}: route.mode 不正: {route.get("mode")}')
            if route.get('kind') == 'dest' and not route.get('dest_name'):
                errors.append(f'{trid}: route.kind=dest なのに dest_name がない')
            if route.get('kind') == 'chain':
                pools_geo = {'record': None, 'taste': None, 'place': None}
                geo_stops = 0
                for s in stops:
                    ref = s.get('ref')
                    src = None
                    if s.get('kind') == 'taste':
                        src = next((t for t in tb.get('taste_spots', []) if t.get('id') == ref), None)
                    elif s.get('kind') == 'place':
                        src = next((p for p in tb.get('places', []) if p.get('id') == ref), None)
                    if src is None:
                        geo_stops += 1  # 記録側の座標は台帳にあり、ここでは数えるだけ
                    elif src.get('geo'):
                        geo_stops += 1
                if geo_stops < 2:
                    errors.append(f'{trid}: route.kind=chain だが座標つき停留所が2件未満')
        for j, row in enumerate(tr.get('timeline', [])):
            if not (isinstance(row, dict) and row.get('t') and row.get('label')):
                errors.append(f'{trid}: timeline[{j}] は t / label が必要')

    return errors, warnings


def main():
    tb = json.loads(TB_PATH.read_text(encoding='utf-8'))
    db = json.loads(DB_PATH.read_text(encoding='utf-8'))
    record_ids = {r['id'] for r in db['records']}

    errors, warnings = check(tb, record_ids)
    for e in errors:
        print(f'ERROR: {e}')
    for w in warnings:
        print(f'WARN:  {w}')
    print(f'--- エリア{len(tb.get("areas", []))}・味{len(tb.get("taste_spots", []))}・'
          f'場所{len(tb.get("places", []))}・道行き{len(tb.get("trails", []))} / '
          f'エラー{len(errors)} / 警告{len(warnings)}')

    if '--links' in sys.argv:
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from validate_archive_db import check_links
        dead = check_links(tb.get('taste_spots', []) + tb.get('places', []))
        for url, status, ids in sorted(dead, key=lambda x: str(x[1])):
            print(f'LINK {status}: {url}  ← {", ".join(ids)}')
        print(f'--- リンク切れ疑い {len(dead)}件')

    sys.exit(1 if errors else 0)


if __name__ == '__main__':
    main()
