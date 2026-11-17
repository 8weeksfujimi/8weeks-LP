#!/usr/bin/env python3
"""8weeks Local Archive — 記録ごとの頁・総目録・統計・サイトマップを生成する。

台帳は一つ（data/archive-db.json）。土地（サブリージョン）ごとの書き出し元
（data/<土地>-archive-db.json）を合わせて、このスクリプトが作る。
同じ台帳から、スクリプトなしで読める静的な頁も作る:

  data/archive-db.json  一つの台帳（各記録に subregion・related_subregions・updated を付けたもの。頁はこれだけを読む）
  records/<ID>.html   記録ごとの頁（固定URL＝引用できる単位。構造化データつき）
  records/index.html  総目録（全記録への入口）
  data/archive-stats.json  台帳の統計（方法の頁が読む）
  archive-method.html      統計の欄（STATS:BEGIN〜END の間）だけ書き換える
  sitemap.xml              アーカイブ関連の行だけ書き換える（宿の頁の行は残す）

使い方:
  python3 scripts/build_archive_pages.py          # 生成
  python3 scripts/build_archive_pages.py --dry    # 件数だけ数えて書かない
  python3 scripts/build_archive_pages.py --check  # 生成物（台帳・記録の頁・総目録・土地の入口・統計・sitemap）が、いまの書き出し元・設定と合っているかを確かめる。何も書かない
  python3 scripts/build_archive_pages.py --prune  # 台帳から無くなった記録の頁を消してよいときだけ付ける（付けなければ止まる）

書き出し元（とくに富士見＝制作側パイプラインの書き出し）を差し替えたら、これを回し直す。
回し直さないと、台帳・星図・絵図・記録の頁は古いままになる。
標準ライブラリだけで動く。
"""
import html
import json
import math
import re
import sys
from collections import Counter, OrderedDict
from pathlib import Path
from urllib.parse import urlsplit, quote

ROOT = Path(__file__).resolve().parent.parent
CONFIG = json.loads((ROOT / 'data' / 'archive-config.json').read_text(encoding='utf-8'))
BASE = CONFIG['site']['base_url']
OUT = ROOT / 'records'

DB_PATH = ROOT / CONFIG['db']['file']
GENERIC = CONFIG['generic_names']
PUBLIC_DROP = ('caution', 'evidence', 'editor_note', 'internal_note', 'area')
GRADE_WORD = {'S': '確立', 'A': '堅実', 'B': '諸説', 'C': '伝承', 'D': '俗説・要検証'}


# ---------- 読み込みと、一つの台帳 ----------
def sub_of(sub_id):
    return next(a for a in CONFIG['subregions'] if a['id'] == sub_id)


def municipality_tokens(muni):
    """市町村の表記を語に割る。括弧の注記は外し、「・、／」で割り、語尾の「ほか」を落とす。"""
    s = re.sub(r'[（(][^）)]*[）)]', '', muni or '')
    return [x for x in (re.sub(r'ほか$', '', t).strip() for t in re.split(r'[・、,，/／\s]+', s)) if x]


def related_subregions_of(r, sub_id):
    """記録の市町村（municipality）に、ほかの土地の市町村が含まれていれば、その土地を「関わる土地」とする。
    部分一致ではなく、語の一致で比べる（「下桑原村」が「原村」に当たらないように）。"""
    toks = set(municipality_tokens(r.get('municipality')))
    return [s['id'] for s in CONFIG['subregions']
            if s['id'] != sub_id and toks & set(s.get('municipalities', []))]


def load_sources():
    """土地ごとの書き出し元を読み、一つの台帳の記録にして返す。

    各記録に subregion（主の土地）・related_subregions（関わる土地。市町村から機械的に）・
    updated（その土地の書き出しの版）を付ける。書き出し元のファイルは書き換えない。
    まだ無い土地のファイルは飛ばす。"""
    records, meta = [], {}
    for sub in CONFIG['subregions']:
        p = ROOT / sub['source']
        if not p.exists():
            continue
        db = json.loads(p.read_text(encoding='utf-8'))
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', str(db.get('updated', ''))):
            sys.exit(f'ERROR: {sub["source"]} に updated（版の日付 YYYY-MM-DD）がありません')
        if not db.get('records'):
            continue
        meta[sub['id']] = {k: v for k, v in db.items() if k != 'records'}
        for src in db['records']:
            r = OrderedDict()
            for k, v in src.items():
                if k in PUBLIC_DROP or k in ('subregion', 'related_subregions', 'updated'):
                    continue
                r[k] = v
                if k == 'id':
                    r['subregion'] = sub['id']
                    r['related_subregions'] = []
                    r['updated'] = db['updated']
            r['related_subregions'] = related_subregions_of(r, sub['id'])
            records.append(r)
    return records, meta


def db_json(records, meta):
    """一つの台帳（data/archive-db.json）の中身を、文字列で返す。"""
    d = CONFIG['db']
    subs = []
    for sub in CONFIG['subregions']:
        n = sum(1 for r in records if r['subregion'] == sub['id'])
        if not n:
            continue
        subs.append(OrderedDict([
            ('id', sub['id']), ('label', sub['label']), ('en', sub['en']), ('desc', sub['desc']),
            ('id_prefix', sub['id_prefix']), ('municipalities', sub.get('municipalities', [])),
            ('count', n), ('updated', meta[sub['id']].get('updated', '')), ('source', sub['source'])]))
    db = OrderedDict([
        ('title', d['title']), ('title_en', d['title_en']), ('description', d['description']),
        ('disclaimer', d['disclaimer']), ('license', d['license']), ('method', d['method']),
        ('subregion_note', CONFIG.get('subregion_note', '')),
        ('field_notes', CONFIG.get('field_notes', {})),
        ('updated', max(s['updated'] for s in subs)), ('count', len(records)),
        ('subregions', subs), ('records', records)])
    return json.dumps(db, ensure_ascii=False, indent=1) + '\n'


def group_of(r):
    for name, pattern, color in CONFIG['groups']:
        if re.search(pattern, r.get('category', '')):
            return name, color
    return 'その他', '#93a3b5'


def capital_of(r):
    """(資本区分, 暫定か) を返す。記録に指定があればそれ、無ければ分類からの割り当て。"""
    if r.get('capital') in CONFIG['capitals']:
        return r['capital'], False
    ov = CONFIG['capital_override'].get(r['id'])
    if ov:
        return ov, True
    for key, cap in CONFIG['capital_default']:
        if key in r.get('category', ''):
            return cap, True
    return CONFIG['capital_fallback'], True


def classify(url, detail_kind=None):
    """出典の種類のキーを返す。考証者が付けた種類があればそれを優先する。"""
    if detail_kind and detail_kind in CONFIG['detail_kind_map']:
        return CONFIG['detail_kind_map'][detail_kind]
    host = urlsplit(url).netloc.lower()
    for suffix, kind in CONFIG['source_rules']:
        if host == suffix or host.endswith(suffix if suffix.startswith('.') else '.' + suffix):
            return kind
    return 'other'


def sources_of(r):
    """[{url, kind, title, publisher, supports}] を返す。"""
    details = {d.get('url'): d for d in (r.get('source_details') or []) if isinstance(d, dict)}
    out = []
    for u in r.get('sources') or []:
        d = details.get(u, {})
        out.append({
            'url': u,
            'kind': classify(u, d.get('kind')),
            'title': d.get('title', ''),
            'publisher': d.get('publisher', ''),
            'supports': d.get('supports', ''),
        })
    return out


def grades(conf):
    return [g for g in (conf or '').split('/') if g in GRADE_WORD]


def head_of(keyword):
    return re.split(r'[（(]', keyword)[0].strip()


def short_label(keyword, n=22):
    s = re.split(r'[（(—]', keyword)[0].strip()
    return s if len(s) <= n else s[:n - 1] + '…'


def names_of(r):
    """星図と同じ規則: 見出しの頭を「・—、」で割った3字以上の語（一般的な地名は除く）。"""
    out = []
    for t in re.split(r'[・—、]', head_of(r['keyword'])):
        t = re.sub(r'[「」『』]', '', t).strip()
        if len(t) >= 3 and t not in GENERIC and t not in out:
            out.append(t)
    return out


def haversine(a, b):
    lat1, lng1, lat2, lng2 = map(math.radians, (a['lat'], a['lng'], b['lat'], b['lng']))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lng2 - lng1) / 2) ** 2
    return 6371000 * 2 * math.asin(math.sqrt(h))


def has_geo(r):
    g = r.get('geo')
    return isinstance(g, dict) and isinstance(g.get('lat'), (int, float)) and isinstance(g.get('lng'), (int, float))


def build_relations(records):
    """記録どうしのつながり。explicit=考証者が張ったもの、mention=本文に名が出るもの。"""
    by_id = {r['id']: r for r in records}
    rel = {r['id']: OrderedDict() for r in records}
    for r in records:
        for rid in r.get('related_records') or []:
            if rid in by_id and rid != r['id']:
                rel[r['id']][rid] = 'explicit'
                rel[rid].setdefault(r['id'], 'explicit')
    table = [(r, names_of(r)) for r in records]
    for a in records:
        text = a.get('background', '') + ' ' + (a.get('confidence_note') or '')
        for b, names in table:
            if a is b:
                continue
            if any(nm in text for nm in names):
                rel[a['id']].setdefault(b['id'], 'mention')
                rel[b['id']].setdefault(a['id'], 'mention')
    return rel


# ---------- HTML の部品 ----------
def esc(s):
    return html.escape(str(s if s is not None else ''), quote=True)


URL_RE = re.compile(r'https?://[^\s、）」()<>"\']+')


def linkify(s):
    return URL_RE.sub(lambda m: f'<a href="{m.group(0)}" target="_blank" rel="noopener">{m.group(0)}</a>', esc(s))


def top_grade(conf):
    """いちばん高い等級（表記の並び順に頼らない）。"""
    g = grades(conf)
    return min(g, key='SABCD'.index) if g else 'C'


def badge_class(conf):
    return 'c' + top_grade(conf)


def nav(prefix, current=''):
    """アーカイブの中だけを行き来するナビ。宿への案内は、各頁の開示欄の一か所だけに置く。"""
    items = [
        ('archive.html', 'Archive', 'archive'),
        ('archive-db.html', 'Ledger', 'ledger'),
        ('archive-graph.html', 'Graph', 'graph'),
        ('archive-map.html', 'Map', 'map'),
        ('records/index.html', 'Catalogue', 'catalogue'),
        ('archive-method.html', 'Method', 'method'),
    ]
    # スマホの幅に並べられるのは5つまで（6つだと375pxで右にはみ出す）。四つの眺めと、いまいる頁を残す。
    # いまいる頁が四つの眺めのどれか（または記録の頁）なら、五つ目は Method。総目録・土地の入口では Catalogue。
    keep = {'archive', 'ledger', 'graph', 'map', current if current in ('catalogue', 'method') else 'method'}
    def cls(key):
        c = ' '.join(x for x in ('keep' if key in keep else '', 'current' if key == current else '') if x)
        return f' class="{c}"' if c else ''
    links = ''.join(f'<a href="{prefix}{href}"{cls(key)}>{label}</a>' for href, label, key in items)
    return f'''  <header class="header">
    <a class="header-brand" href="{prefix}archive.html"><img src="{prefix}assets/logos/logo_white.png" alt="8weeks Local Archive"></a>
    <nav class="header-nav">{links}</nav>
  </header>'''


def footer(prefix):
    return f'''  <footer class="footer">
    <img src="{prefix}assets/logos/logo_white.png" alt="8weeks">
    <div class="foot-links">
      <a href="{prefix}archive.html">手帖</a>
      <a href="{prefix}archive-db.html">台帳</a>
      <a href="{prefix}archive-graph.html">星図</a>
      <a href="{prefix}archive-map.html">絵図</a>
      <a href="{prefix}records/index.html">総目録</a>
      <a href="{prefix}archive-method.html">方法と凡例</a>
    </div>
    <p>運営会社：{esc(CONFIG['site']['publisher'])}<br>〒399-0211 {esc(CONFIG['site']['publisher_address'])}</p>
    <p style="font-size:0.68rem;color:rgba(255,255,255,0.4)">&copy; 2026 8weeks Stay. All rights reserved.</p>
  </footer>'''


HEAD_FONTS = '''  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Zen+Old+Mincho:wght@400;500;700&family=Noto+Sans+JP:wght@300;400;500;700&display=swap" rel="stylesheet">'''


def record_url(rid):
    return f'{BASE}records/{quote(rid)}.html'


def primary_municipality(r, sub):
    """主の市町村。municipality の先頭の語。
    municipality が無い記録（富士見）は土地の先頭の市町村。ただし「町域外を含む」記録は決めない（None）。"""
    toks = municipality_tokens(r.get('municipality'))
    if toks:
        return toks[0]
    if r.get('town_outside'):
        return None
    return sub['municipalities'][0]


def title_of(r, sub):
    """title の型: 名称｜分類の記録（主の市町村）｜ローカルアーカイブ。確度と出典数は description に出す。
    宣伝語・宿の名は入れない。土地の名（富士見／蓼科／諏訪）ではなく市町村を入れるのは、
    「諏訪」が広い意味（諏訪地方）と取り違えられやすいため（企画部門の発信設計 2026-11-17）。
    市町村を決められない記録（富士見の「町域外を含む」記録）には、括弧を付けない。"""
    kw = r["keyword"] if len(r["keyword"]) <= 26 else head_of(r["keyword"])
    muni = primary_municipality(r, sub)
    return f"{kw}｜{r.get('category', '記録')}の記録{'（' + muni + '）' if muni else ''}｜ローカルアーカイブ"


def description_of(r):
    """description の型: 何の記録か。確度・出典数（種類）。確度の低い記録は冒頭で断る。"""
    bg = re.sub(r'（TOWN_OUTSIDE）|＝TOWN_OUTSIDE', '', r.get('background', ''))   # 書き出し元に残る内部の印
    bg = re.sub(r'(?<=[A-Za-z0-9])[ \t]+(?=[A-Za-z0-9])', '\x00', bg)                # 英数字のあいだの空白は残す
    bg = re.sub(r'\s+', '', bg).replace('\x00', ' ')
    bg = re.sub(r'^冒頭注：[^。]*。', '', bg)
    first = bg[:72] + ('…' if len(bg) > 72 else '')
    lead = '伝承・要検証の話が主の記録。' if top_grade(r['confidence']) in 'CD' else ''
    kinds = Counter(s['kind'] for s in sources_of(r))
    kind_txt = '・'.join(CONFIG['source_kinds'][k] for k, _ in kinds.most_common(2)) + ('ほか' if len(kinds) > 2 else '')
    n = len(r.get('sources') or [])
    return f"{lead}{first} 確度{r['confidence']}、出典{n}件（{kind_txt}）。"


def jsonld_record(r, sub, rel_ids):
    url = record_url(r['id'])
    place = None
    if has_geo(r) or r.get('municipality') or not r.get('town_outside'):
        place = {'@type': 'Place'}
        locality = r.get('municipality') or (None if r.get('town_outside') else '諏訪郡富士見町')
        if locality:
            place['address'] = {'@type': 'PostalAddress', 'addressCountry': 'JP', 'addressRegion': '長野県', 'addressLocality': locality}
        if has_geo(r):
            place['geo'] = {'@type': 'GeoCoordinates', 'latitude': r['geo']['lat'], 'longitude': r['geo']['lng']}
    article = {
        '@type': 'Article',
        '@id': url + '#record',
        'headline': r['keyword'][:110],
        'description': description_of(r),
        'inLanguage': 'ja',
        'url': url,
        'identifier': r['id'],
        'dateModified': r['updated'],
        'isAccessibleForFree': True,
        'isPartOf': {'@type': 'Dataset', '@id': BASE + 'archive-db.html#dataset', 'name': '8weeks Local Archive 台帳'},
        'author': {'@type': 'Organization', 'name': '8weeks Local Archive', 'url': BASE + 'archive.html'},
        'publisher': {'@type': 'Organization', 'name': CONFIG['site']['publisher'], 'url': BASE},
        'keywords': [r.get('category', '')] + list(r.get('sense_tags') or []),
        'citation': [u for u in (r.get('sources') or [])][:30],
    }
    if r.get('keyword_en'):
        article['alternativeHeadline'] = r['keyword_en']
    if place:
        article['contentLocation'] = place
    if rel_ids:
        article['mentions'] = [{'@id': record_url(i) + '#record'} for i in rel_ids[:12]]
    crumbs = {
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Local Archive', 'item': BASE + 'archive.html'},
            {'@type': 'ListItem', 'position': 2, 'name': '総目録', 'item': BASE + 'records/index.html'},
            {'@type': 'ListItem', 'position': 3, 'name': f"{sub['label']}の記録", 'item': BASE + f"records/{sub['id']}.html"},
            {'@type': 'ListItem', 'position': 4, 'name': r['keyword'][:60], 'item': url},
        ],
    }
    return json.dumps({'@context': 'https://schema.org', '@graph': [article, crumbs]}, ensure_ascii=False, indent=1)


def render_record(r, records_by_id, rel, order):
    sub = sub_of(r['subregion'])
    other = [a for a in CONFIG['subregions'] if a['id'] != sub['id']]
    gname, _ = group_of(r)
    cap, cap_prov = capital_of(r)
    srcs = sources_of(r)
    kinds = CONFIG['source_kinds']
    url = record_url(r['id'])

    # つながる記録
    rel_items = rel.get(r['id'], {})
    same = [(i, k) for i, k in rel_items.items() if records_by_id[i]['subregion'] == r['subregion']]
    cross = [(i, k) for i, k in rel_items.items() if records_by_id[i]['subregion'] != r['subregion']]

    def rel_li(i, k):
        o = records_by_id[i]
        note = '考証者が張ったつながり' if k == 'explicit' else '本文に名が出る'
        return (f'<li><a href="{esc(i)}.html">{esc(o["keyword"])}</a>'
                f'<span class="sub">確度 {esc(o["confidence"])}・{note}</span></li>')

    rel_html = ''
    if same or cross:
        parts = []
        if same:
            parts.append(f'<p class="link-group">{esc(sub["label"])}の記録</p><ul class="link-list">'
                         + ''.join(rel_li(i, k) for i, k in same[:14]) + '</ul>')
        if cross:
            oname = '・'.join(a['label'] for a in other if any(records_by_id[i]['subregion'] == a['id'] for i, _ in cross))
            parts.append(f'<p class="link-group">となりの土地 — {esc(oname)}の記録</p><ul class="link-list">'
                         + ''.join(rel_li(i, k) for i, k in cross[:10]) + '</ul>')
        rel_html = ('<section class="sec"><h2>つながる記録<small>Related</small></h2>' + ''.join(parts)
                    + '<p class="hint">「本文に名が出る」は、記録の本文や考証メモに別の記録の名が現れたものを機械的に拾っています。意味のあるつながりとは限りません。</p></section>')

    # ちかくの記録
    near_html = ''
    if has_geo(r):
        near = sorted(((haversine(r['geo'], o['geo']), o) for o in records_by_id.values()
                       if o is not r and has_geo(o)), key=lambda x: x[0])
        near = [(d, o) for d, o in near if d < 3000][:6]
        if near:
            def fmt(d):
                return f'{round(d / 50) * 50}m' if d < 950 else f'{d / 1000:.1f}km'
            near_html = ('<section class="sec"><h2>ちかくの記録<small>Nearby</small></h2><ul class="link-list">'
                         + ''.join(f'<li><a href="{esc(o["id"])}.html">{esc(short_label(o["keyword"], 30))}</a>'
                                   f'<span class="sub">直線で約{fmt(d)}</span></li>' for d, o in near)
                         + '</ul><p class="hint">距離は座標どうしの直線距離です。道のりではありません。</p></section>')

    # 出典
    def src_li(s):
        host = urlsplit(s['url']).netloc
        label = esc(s['title']) if s['title'] else esc(host)
        pub = f'（{esc(s["publisher"])}）' if s['publisher'] else ''
        sup = f'<span class="src-supports">ここで確かめたこと: {esc(s["supports"])}</span>' if s['supports'] else ''
        return (f'<li><span class="src-kind k-{s["kind"]}">{esc(kinds[s["kind"]])}</span>'
                f'<span class="src-title">{label}{pub}</span><br>'
                f'<a href="{esc(s["url"])}" target="_blank" rel="noopener">{esc(s["url"])}</a>{sup}</li>')

    kind_counts = Counter(s['kind'] for s in srcs)
    kind_line = '／'.join(f'{kinds[k]} {n}' for k, n in kind_counts.most_common())
    src_note = ('種類の札は、考証者が出典ごとに付けたものです。' if r.get('source_details')
                else '種類の札は、URLのドメインからの機械的な分類です（規則は<a href="../archive-method.html#sources">方法と凡例</a>に）。')
    src_html = (f'<section class="sec" id="sources"><h2>出典<small>Sources · {len(srcs)}</small></h2>'
                f'<ol class="src-list">{"".join(src_li(s) for s in srcs)}</ol>'
                f'<p class="hint">内訳: {esc(kind_line)}。{src_note}種類は確からしさの保証ではありません。確からしさは上の「確からしさの内訳」をお読みください。</p></section>')

    # 書誌
    refs = [x for x in (r.get('references') or []) if isinstance(x, dict) and x.get('citation')]
    refs_html = ''
    if refs:
        def ref_li(x):
            depth = x.get('depth') or ('full' if x.get('seen') else 'biblio')
            seen = {'full': '本文を確認', 'abstract': '要旨まで確認', 'biblio': '未見（書誌のみ確認）'}.get(depth, '未見（書誌のみ確認）')
            link = f' <a href="{esc(x["url"])}" target="_blank" rel="noopener">所在を確かめた頁</a>' if x.get('url') else ''
            note = f' — {esc(x["note"])}' if x.get('note') and x.get('note') not in ('未見', '未見。') else ''
            return f'<li>{esc(x["citation"])}<span class="sub">{seen}</span>{link}{note}</li>'
        refs_html = ('<section class="sec"><h2>さらに読む<small>Further reading</small></h2><ul class="link-list">'
                     + ''.join(ref_li(x) for x in refs)
                     + '</ul><p class="hint">この記録の主題の基本文献です。「未見」は、実在は確かめたものの本文を読めていないこと、「要旨まで確認」は、要旨や抄録だけを読んだことを示します。どちらも、本文の根拠には使っていません。</p></section>')

    # まだ確かめられていないこと
    oq = [q for q in (r.get('open_questions') or []) if q]
    oq_html = ''
    if oq:
        oq_html = ('<section class="sec"><h2>まだ確かめられていないこと<small>Open questions</small></h2><ul class="link-list">'
                   + ''.join(f'<li>{esc(q)}</li>' for q in oq)
                   + '</ul><p class="hint">現地や一次資料で確かめられた方は、どうか教えてください。確かめる時間が、この記録の続きです。</p></section>')

    # 制作の記録・宿のメモ
    log = r.get('review_log') or []
    log_html = ''
    if log:
        log_html = (f'<details class="fold"><summary>制作の記録 — 監査の往復 {len(log)}回</summary>'
                    + ''.join(f'<p class="apparatus"><b>{esc(l.get("iter"))}回目 {esc(l.get("verdict"))}</b> {linkify(l.get("note", ""))}</p>' for l in log)
                    + '</details>')
    memo_html = ''
    if r.get('cx_idea'):
        rx = f'<br><b>負っているもの</b> {linkify(r["reciprocity_axis"])}' if r.get('reciprocity_axis') else ''
        memo_html = (f'<details class="fold"><summary>{esc(sub.get("memo_label", "書き手のメモ — 訪ねるときの受けとり方"))}</summary>'
                     f'<p class="apparatus">{linkify(r["cx_idea"])}{rx}</p></details>')

    # 札
    conf_words = '・'.join(f'{g}＝{GRADE_WORD[g]}' for g in grades(r['confidence']))
    badges = [f'<span class="badge {badge_class(r["confidence"])}">確度 {esc(r["confidence"])}</span>',
              f'<span class="ptype">{esc(r.get("page_type", ""))}</span>',
              f'<span class="badge sub {sub["id"]}">{esc(sub["label"])}</span>']
    for sid in r.get('related_subregions') or []:
        badges.append(f'<span class="badge sub also {esc(sid)}" title="市町村が{esc(sub_of(sid)["label"])}の土地にもかかる記録">＋{esc(sub_of(sid)["label"])}</span>')
    if r['subregion'] == 'fujimi' and r.get('town_outside'):
        badges.append('<span class="badge outside">町域外を含む</span>')
    if r.get('municipality'):
        badges.append(f'<span class="badge cap">{esc(r["municipality"])}</span>')
    badges.append(f'<span class="badge cap">{esc(cap)}{"（暫定）" if cap_prov else ""}</span>')

    yomi = f'<p class="yomi">{esc(r["yomi"])}</p>' if r.get('yomi') else ''
    title_en = f'<p class="title-en" lang="en">{esc(r["keyword_en"])}</p>' if r.get('keyword_en') else ''
    en_sum = f'<span class="en-sum" lang="en">{esc(r["summary_en"])}</span>' if r.get('summary_en') else ''
    tags = f'<p class="tags">{" ・ ".join(esc(t) for t in r.get("sense_tags") or [])}</p>' if r.get('sense_tags') else ''

    views = [f'<a href="../archive-db.html#{esc(r["id"])}">台帳でひらく</a>',
             f'<a href="../archive-graph.html#{esc(r["id"])}">星図でみる — つながり</a>']
    if has_geo(r):
        views.append(f'<a href="../archive-map.html#{esc(r["id"])}">絵図でみる — 土地の上</a>')
        g = r['geo']
        views.append(f'<a href="https://www.google.com/maps/search/?api=1&query={g["lat"]},{g["lng"]}" target="_blank" rel="noopener">地図アプリでひらく</a>')

    geo_note = ''
    if has_geo(r):
        prec = {'poi': 'その地点', 'approx': 'およその位置'}.get(r.get('geo_precision'), '')
        bits = [f'北緯{r["geo"]["lat"]:.4f}・東経{r["geo"]["lng"]:.4f}'] + ([prec] if prec else []) + ([esc(r['geo_note'])] if r.get('geo_note') else [])
        geo_note = f'<p class="hint">座標: {"、".join(bits)}</p>'
    elif r.get('geo_note'):
        geo_note = f'<p class="hint">座標は置いていません。{esc(r["geo_note"])}</p>'

    cite_text = (f'8weeks Local Archive「{r["keyword"]}」『8weeks Local Archive 台帳』{r["id"]}，'
                 f'確度 {r["confidence"]}，{r["updated"]} 版．{url}')

    idx = order.index(r['id'])
    prev_id = order[idx - 1] if idx > 0 else None
    next_id = order[idx + 1] if idx < len(order) - 1 else None
    pager = '<nav class="pager">'
    if prev_id:
        pager += f'<a class="prev" href="{esc(prev_id)}.html"><span class="dir">← まえの記録</span>{esc(short_label(records_by_id[prev_id]["keyword"], 26))}</a>'
    if next_id:
        pager += f'<a class="next" href="{esc(next_id)}.html"><span class="dir">つぎの記録 →</span>{esc(short_label(records_by_id[next_id]["keyword"], 26))}</a>'
    pager += '</nav>'

    stay_line = sub.get('stay', '')

    rel_ids = [i for i, k in rel_items.items() if k == 'explicit']   # 構造化データには、考証者が張ったつながりだけを出す
    return f'''<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{esc(title_of(r, sub))}</title>
  <meta name="description" content="{esc(description_of(r))}">
  <link rel="icon" type="image/png" href="../assets/logos/favicon_moon.png">
  <link rel="canonical" href="{esc(url)}">
  <link rel="alternate" type="application/json" href="../{esc(CONFIG['db']['file'])}" title="8weeks Local Archive 台帳（JSON）">
  <meta property="og:title" content="{esc(r['keyword'])}">
  <meta property="og:description" content="{esc(description_of(r))}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="{esc(url)}">
  <meta property="og:site_name" content="8weeks Local Archive">
  <meta property="og:locale" content="ja_JP">
{HEAD_FONTS}
  <link rel="stylesheet" href="../assets/styles/archive-pages.css">
  <script type="application/ld+json">
{jsonld_record(r, sub, rel_ids)}
  </script>
</head>
<body>
{nav('../')}
  <main class="wrap rec-page">
    <nav class="crumbs" aria-label="現在地">
      <a href="../archive.html">Local Archive</a><span>›</span><a href="index.html">総目録</a><span>›</span><a href="{sub['id']}.html">{esc(sub['label'])}の記録</a><span>›</span>{esc(gname)}
    </nav>
    <article>
      <div class="badges">{''.join(badges)}</div>
      <h1 class="serif">{esc(r['keyword'])}</h1>
      {yomi}{title_en}
      <p class="meta">{esc(r.get('category', ''))}{'｜' + esc(r['era']) if r.get('era') else ''}｜{esc(r['id'])}｜{esc(r['updated'])} 版</p>
      <div class="rec-body">{esc(r.get('background', ''))}{en_sum}</div>
      {tags}

      <section class="sec" id="confidence"><h2>確からしさの内訳<small>Confidence</small></h2>
        <p class="apparatus"><b>確度 {esc(r['confidence'])}</b>（{esc(conf_words)}）<br>{linkify(r.get('confidence_note', ''))}</p>
        <p class="hint">確度は記録全体の点数ではなく、ひとつの記録のなかにある主張ごとの確からしさです。読み方は<a href="../archive-method.html#grades">方法と凡例</a>に。{'出典の種類の要約: ' + esc(r['source_type'].rstrip('。')) + '。' if r.get('source_type') else ''}</p>
      </section>

      {src_html}
      {refs_html}
      {oq_html}
      {rel_html}
      {near_html}

      <section class="sec"><h2>べつの眺めかた<small>Views</small></h2>
        <div class="views">{''.join(views)}</div>
        {geo_note}
      </section>

      {log_html}
      {memo_html}

      <section class="sec" id="cite"><h2>この記録を引用する<small>Cite</small></h2>
        <p class="cite-box" id="citeText">{esc(cite_text)}<span id="citeDate"></span></p>
        <button class="btn-line" id="citeCopy" type="button">引用の書式を写す</button>
        <p class="hint">この頁のURLは変えません。記録を直したときは版の日付が変わります。引用するときは、この記録の出典にもかならずあたってください。利用の条件: 出典（8weeks Local Archive と各記録の典拠）を明記のうえ、自由に参照・引用できます。</p>
      </section>

      <aside class="disclose">
        <b>この記録について</b> — ここに書いたことは、公開されている資料から確かめられた範囲の断片です。誤りや、諸説の一方だけが載っている場合があります。大切なことは、出典と現地で確かめてください。この記録は道案内ではありません。山や湖、峠や冬の道の様子は、その日の公的な情報で確かめてください。<br>
        <b>書き手の立場</b> — この台帳をつくっているのは、富士見町の宿 8weeks です。土地に人が来ることで成り立つ商いをしている者が書いている、という利害があります。{stay_line}つくり方と、書かないと決めていることは <a href="../archive-method.html">方法と凡例</a> に。宿のことは <a href="../index.html#spaces">こちら</a>。
      </aside>
      {pager}
    </article>
  </main>
{footer('../')}
  <script>
    (function () {{
      var d = new Date(), p = function (n) {{ return String(n).padStart(2, '0'); }};
      var today = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
      document.getElementById('citeDate').textContent = '（参照 ' + today + '）';
      document.getElementById('citeCopy').addEventListener('click', function () {{
        var t = document.getElementById('citeText').textContent, b = this;
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(
          function () {{ b.textContent = '写しました'; }},
          function () {{ var r = document.createRange(); r.selectNodeContents(document.getElementById('citeText')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = '選んだ状態にしました'; }});
      }});
    }})();
  </script>
</body>
</html>
'''


def render_index(records, meta, stats):
    by_sub = OrderedDict((a['id'], []) for a in CONFIG['subregions'])
    for r in records:
        by_sub[r['subregion']].append(r)
    used = [s for s in CONFIG['subregions'] if by_sub[s['id']]]
    labels = '・'.join(s['label'] for s in used)
    jump = ' ／ '.join(f'<a href="#{s["id"]}">{esc(s["label"])} {len(by_sub[s["id"]])}件</a>' for s in used)
    blocks = []
    for sub in used:
        rs = by_sub[sub['id']]
        groups = OrderedDict((g[0], []) for g in CONFIG['groups'])
        for r in rs:
            groups[group_of(r)[0]].append(r)
        gh = ''
        for name, items in groups.items():
            if not items:
                continue
            lis = ''.join(
                f'<li><span class="c">確度 {esc(r["confidence"])}</span><a href="{esc(r["id"])}.html">{esc(r["keyword"])}</a></li>'
                for r in items)
            gh += f'<div class="cat-group"><h3>{esc(name)}（{len(items)}）</h3><ul class="cat-list">{lis}</ul></div>'
        also = [r for r in records if sub['id'] in (r.get('related_subregions') or [])]
        if also:
            lis = ''.join(
                f'<li><span class="c">{esc(sub_of(r["subregion"])["label"])}に置く</span><a href="{esc(r["id"])}.html">{esc(r["keyword"])}</a></li>'
                for r in also)
            gh += (f'<div class="cat-group also"><h3>ほかの土地に置いた、{esc(sub["label"])}にもかかわる記録（{len(also)}）</h3>'
                   f'<ul class="cat-list">{lis}</ul></div>')
        upd = meta.get(sub['id'], {}).get('updated', '')
        blocks.append(f'<section class="cat-sub" id="{sub["id"]}"><h2 class="serif">{esc(sub["label"])}の記録</h2>'
                      f'<p>{esc(sub["desc"])} {len(rs)}件・{esc(upd)} 版。<a class="more" href="{sub["id"]}.html">{esc(sub["label"])}の入口の頁へ →</a></p>{gh}</section>')
    ld = {
        '@context': 'https://schema.org', '@type': 'CollectionPage',
        'name': '総目録 — 8weeks Local Archive', 'url': BASE + 'records/index.html', 'inLanguage': 'ja',
        'isPartOf': {'@type': 'WebSite', 'name': '8weeks Local Archive', 'url': BASE + 'archive.html'},
        'mainEntity': {'@type': 'ItemList', 'numberOfItems': len(records),
                       'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'url': record_url(r['id']), 'name': r['keyword'][:110]}
                                           for i, r in enumerate(records)]},
    }
    return f'''<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>総目録 — {esc(labels)}の記録 {len(records)}件｜8weeks Local Archive</title>
  <meta name="description" content="長野県・八ヶ岳のすそから諏訪湖まで、{esc(labels)}の土地の記録 {len(records)}件の総目録。どの記録にも確からしさの度合いと出典を添えています。">
  <link rel="icon" type="image/png" href="../assets/logos/favicon_moon.png">
  <link rel="canonical" href="{BASE}records/index.html">
  <meta property="og:title" content="総目録 — 8weeks Local Archive">
  <meta property="og:description" content="{esc(labels)}。八ヶ岳のすそから諏訪湖までの土地の記録 {len(records)}件。確からしさの度合いと出典つき。">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{BASE}records/index.html">
  <meta property="og:site_name" content="8weeks Local Archive">
  <meta property="og:locale" content="ja_JP">
{HEAD_FONTS}
  <link rel="stylesheet" href="../assets/styles/archive-pages.css">
  <script type="application/ld+json">
{json.dumps(ld, ensure_ascii=False)}
  </script>
</head>
<body>
{nav('../', 'catalogue')}
  <section class="page-hero">
    <h1 class="serif">総目録</h1>
    <p class="en">Catalogue · {len(records)} records</p>
    <p class="lead">台帳に収めた記録のすべてを、土地ごと・主題ごとに並べた目録です。見出しをひらくと、その記録だけの頁に移ります。どの頁にも、本文・確からしさの内訳・出典・つながる記録・引用の書式があります。ことばで探したいとき、絞り込みたいときは <a href="../archive-db.html">台帳</a> へ。台帳は一つで、土地を{len(used)}つに分けています。</p>
    <p class="jump">{jump}</p>
  </section>
  <main class="wrap wide">
    {''.join(blocks)}
    <aside class="disclose">
      <b>読むまえに</b> — 確度は S（確立）・A（堅実）・B（諸説）・C（伝承）・D（俗説・要検証）の五段で、「A/C」のような表記は、一つの記録に確からしさの違う話が同居していることを示します。くわしくは <a href="../archive-method.html">方法と凡例</a> に。この台帳をつくっているのは富士見町の宿 8weeks です。
    </aside>
  </main>
{footer('../')}
</body>
</html>
'''


LAND_NOTE = ('記録は、主題の中心がある市町村の土地に置いています。市町村の境をまたぐ主題はどちらか一方に置き、'
             'もう一方の土地には「＋諏訪」のような点線の札を付けています。霧ヶ峰の高原のように、この基準と違う置き方をしたものもあります。'
             '原村は富士見と蓼科のあいだにあるので、どちらの土地の市町村にも数えています。土地どうしで記録の数を比べるための区分ではありません。')


def render_land(sub, records, by_id, rel, meta):
    """土地ごとの入口の頁。どの土地も同じ型で、台帳から機械的に作る（読み物は書かない）。"""
    rs = [r for r in records if r['subregion'] == sub['id']]
    used = [s for s in CONFIG['subregions'] if any(r['subregion'] == s['id'] for r in records)]
    url = f"{BASE}records/{sub['id']}.html"
    upd = meta.get(sub['id'], {}).get('updated', '')
    n_src = sum(len(r.get('sources') or []) for r in rs)
    has_oq = any('open_questions' in r for r in rs)   # 富士見の書き出し元には、この項目がまだ無い
    n_open = sum(len(r.get('open_questions') or []) for r in rs) if has_oq else '—'
    n_geo = sum(1 for r in rs if has_geo(r))

    groups = OrderedDict((g[0], []) for g in CONFIG['groups'])
    for r in rs:
        groups[group_of(r)[0]].append(r)
    toc = ''
    for name, items in groups.items():
        if not items:
            continue
        lis = ''.join(
            f'<li><span class="c">確度 {esc(r["confidence"])}</span><a href="{esc(r["id"])}.html">{esc(r["keyword"])}</a>'
            f'<span class="n">出典 {len(r.get("sources") or [])}</span></li>' for r in items)
        toc += f'<div class="cat-group"><h3>{esc(name)}（{len(items)}）</h3><ul class="cat-list">{lis}</ul></div>'

    also = [r for r in records if sub['id'] in (r.get('related_subregions') or [])]
    also_html = ''
    if also:
        lis = ''.join(
            f'<li><span class="c">{esc(sub_of(r["subregion"])["label"])}に置く</span><a href="{esc(r["id"])}.html">{esc(r["keyword"])}'
            f'<span class="muni">{esc(r.get("municipality", ""))}</span></a></li>' for r in also)
        also_html = (f'<section class="sec"><h2>ほかの土地に置いた、{esc(sub["label"])}にもかかわる記録<small>Also here · {len(also)}</small></h2>'
                     f'<div class="cat-group also"><ul class="cat-list">{lis}</ul></div>'
                     '<p class="hint">記録の市町村が、この土地の市町村にもかかるものを、機械的に拾っています。</p></section>')

    by_other = OrderedDict((s['id'], []) for s in used if s['id'] != sub['id'])
    for r in rs:
        for oid, kind in rel.get(r['id'], {}).items():
            o = by_id[oid]
            if kind == 'explicit' and o['subregion'] != sub['id']:
                by_other[o['subregion']].append((r, o))
    cross_html = ''
    if any(by_other.values()):
        parts = []
        for oid, pairs in by_other.items():
            if not pairs:
                continue
            lis = ''.join(
                f'<li><a href="{esc(r["id"])}.html">{esc(short_label(r["keyword"], 26))}</a>'
                f'<span class="sub">と</span><a href="{esc(o["id"])}.html">{esc(short_label(o["keyword"], 26))}</a></li>' for r, o in pairs)
            parts.append(f'<p class="link-group">{esc(sub_of(oid)["label"])}の記録と — {len(pairs)}本</p><ul class="link-list pair">{lis}</ul>')
        cross_html = ('<section class="sec"><h2>となりの土地とのつながり<small>Across the lands</small></h2>' + ''.join(parts)
                      + '<p class="hint">考証者が、出典で確かめて張ったつながりだけを並べています。</p></section>')

    jump = ' ／ '.join(
        (f'<b>{esc(s["label"])}</b>' if s['id'] == sub['id'] else f'<a href="{s["id"]}.html">{esc(s["label"])}</a>') for s in used)
    munis = '・'.join(sub.get('municipalities', []))
    tiles = [(len(rs), '記録'), (n_src, '出典（記録ごとの延べ数）'), (n_geo, '座標を置けた記録'), (n_open, 'まだ確かめられていないこと')]
    tiles_html = '<div class="stat-grid">' + ''.join(f'<div class="stat"><div class="n">{n}</div><div class="l">{esc(l)}</div></div>' for n, l in tiles) + '</div>'
    desc = (f'{sub["places"]}の土地の記録 {len(rs)}件の入口。主題ごとの目次、線引き、となりの土地とのつながり。'
            'どの記録にも確からしさの度合いと出典を添えています。')
    oq_note = '' if has_oq else 'この土地の記録には、「まだ確かめられていないこと」の項目がまだありません（確かめられなかったことは、記録ごとの考証メモに書いてあります）。'
    ld = {
        '@context': 'https://schema.org', '@type': 'CollectionPage',
        'name': f'{sub["label"]}の記録 — 8weeks Local Archive', 'url': url, 'inLanguage': 'ja',
        'isPartOf': {'@type': 'Dataset', '@id': BASE + 'archive-db.html#dataset', 'name': '8weeks Local Archive 台帳'},
        'about': {'@type': 'Place', 'name': sub['places'],
                  'geo': {'@type': 'GeoCoordinates', 'latitude': sub['center'][0], 'longitude': sub['center'][1]}},
        'mainEntity': {'@type': 'ItemList', 'numberOfItems': len(rs),
                       'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'url': record_url(r['id']), 'name': r['keyword'][:110]}
                                           for i, r in enumerate(rs)]},
    }
    return f'''<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{esc(sub['label'])}の記録 {len(rs)}件 — {esc(sub['en'])}｜8weeks Local Archive</title>
  <meta name="description" content="{esc(desc)}">
  <link rel="icon" type="image/png" href="../assets/logos/favicon_moon.png">
  <link rel="canonical" href="{esc(url)}">
  <meta property="og:title" content="{esc(sub['label'])}の記録 — 8weeks Local Archive">
  <meta property="og:description" content="{esc(desc)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{esc(url)}">
  <meta property="og:site_name" content="8weeks Local Archive">
  <meta property="og:locale" content="ja_JP">
{HEAD_FONTS}
  <link rel="stylesheet" href="../assets/styles/archive-pages.css">
  <script type="application/ld+json">
{json.dumps(ld, ensure_ascii=False)}
  </script>
</head>
<body>
{nav('../', 'catalogue')}
  <section class="page-hero">
    <h1 class="serif">{esc(sub['label'])}の記録</h1>
    <p class="en">{esc(sub['en'])} · {len(rs)} records</p>
    <p class="lead">{esc(sub['desc'])} 台帳は一つで、土地を{len(used)}つに分けています。この頁は、そのうち{esc(sub['label'])}の入口です。</p>
    <p class="jump">{jump} ／ <a href="index.html">総目録</a></p>
  </section>
  <main class="wrap wide">
    <nav class="crumbs" aria-label="現在地">
      <a href="../archive.html">Local Archive</a><span>›</span><a href="index.html">総目録</a><span>›</span>{esc(sub['label'])}の記録
    </nav>
    {tiles_html}
    <p class="hint">{esc(upd)} 版。数は台帳から機械的に数えたものです。{esc(oq_note)}</p>

    <section class="sec" id="line"><h2>線引き<small>Where the line runs</small></h2>
      <p class="apparatus"><b>{esc(sub['label'])}</b> — {esc(sub['desc'])}<br><b>基準にしている市町村</b> {esc(munis)}</p>
      <p class="hint">{esc(LAND_NOTE)} くわしくは <a href="../archive-method.html#areas">方法と凡例</a> に。</p>
    </section>

    <section class="sec" id="contents"><h2>主題ごとの目次<small>Contents · {len(rs)}</small></h2>
      {toc}
    </section>

    {also_html}
    {cross_html}

    <section class="sec"><h2>べつの眺めかた<small>Views</small></h2>
      <div class="views">
        <a href="../archive-db.html?region={sub['id']}">台帳で、この土地に絞る</a>
        <a href="../archive-map.html?region={sub['id']}">絵図で、この土地をみる</a>
        <a href="../archive-graph.html">星図 — つながりで見る</a>
        <a href="index.html">総目録 — すべての土地</a>
      </div>
    </section>

    <aside class="disclose">
      <b>読むまえに</b> — 確度は S（確立）・A（堅実）・B（諸説）・C（伝承）・D（俗説・要検証）の五段で、「A/C」のような表記は、一つの記録に確からしさの違う話が同居していることを示します。ここに並ぶのは、公開されている資料から確かめられた範囲の断片です。記録は道案内ではありません。<br>
      <b>書き手の立場</b> — この台帳をつくっているのは、富士見町の宿 8weeks です。土地に人が来ることで成り立つ商いをしている者が書いている、という利害があります。{esc(sub.get('stay', ''))}つくり方と、書かないと決めていることは <a href="../archive-method.html">方法と凡例</a> に。宿のことは <a href="../index.html#spaces">こちら</a>。
    </aside>
  </main>
{footer('../')}
</body>
</html>
'''


# ---------- 統計 ----------
def compute_stats(records, meta):
    def one(rs):
        srcs = [s for r in rs for s in sources_of(r)]
        top = Counter(top_grade(r['confidence']) for r in rs)
        contains = Counter(g for r in rs for g in set(grades(r['confidence'])))
        return {
            'records': len(rs),
            'page_type': dict(Counter(r.get('page_type', '') for r in rs)),
            'top_grade': {g: top.get(g, 0) for g in 'SABCD'},
            'contains_grade': {g: contains.get(g, 0) for g in 'SABCD'},
            'groups': dict(Counter(group_of(r)[0] for r in rs).most_common()),
            'capital': dict(Counter(capital_of(r)[0] for r in rs).most_common()),
            'capital_provisional': sum(1 for r in rs if capital_of(r)[1]),
            'with_geo': sum(1 for r in rs if has_geo(r)),
            'sources': len(srcs),
            'sources_unique': len({s['url'] for s in srcs}),
            'sources_per_record': round(len(srcs) / len(rs), 1) if rs else 0,
            'source_kinds': dict(Counter(s['kind'] for s in srcs).most_common()),
            'references': sum(len(r.get('references') or []) for r in rs),
            'open_questions': sum(len(r.get('open_questions') or []) for r in rs) if any('open_questions' in r for r in rs) else None,
            'reviewed': sum(1 for r in rs if (r.get('review_log') or []) and r['review_log'][-1].get('verdict') == 'PASS'),
            'with_source_details': sum(1 for r in rs if r.get('source_details')),
            'with_related_subregions': sum(1 for r in rs if r.get('related_subregions')),
        }
    stats = {'generated': max(m.get('updated', '') for m in meta.values()), 'all': one(records), 'subregions': {}}
    for sub in CONFIG['subregions']:
        rs = [r for r in records if r['subregion'] == sub['id']]
        if rs:
            stats['subregions'][sub['id']] = dict(one(rs), label=sub['label'], updated=meta.get(sub['id'], {}).get('updated', ''))
    rel = build_relations(records)
    by_id = {r['id']: r for r in records}
    stats['cross_subregion_links'] = sum(1 for a, m in rel.items() for b in m if a < b and by_id[a]['subregion'] != by_id[b]['subregion'])
    stats['cross_subregion_explicit'] = sum(1 for a, m in rel.items() for b, k in m.items() if a < b and k == 'explicit' and by_id[a]['subregion'] != by_id[b]['subregion'])
    return stats


def stats_html(stats):
    kinds = CONFIG['source_kinds']
    subs = stats['subregions']
    a = stats['all']

    def tiles():
        t = [(a['records'], '記録の数'), (a['sources'], '出典（記録ごとの延べ数）'),
             (a['sources_unique'], '出典のURL（重複を除く）'), (a['with_geo'], '座標を置けた記録'),
             (stats['cross_subregion_links'], '土地をまたぐつながり')]
        return '<div class="stat-grid">' + ''.join(f'<div class="stat"><div class="n">{n}</div><div class="l">{esc(l)}</div></div>' for n, l in t) + '</div>'

    def bars(title, rows, total, alt=False):
        out = f'<p class="cap">{esc(title)}</p>'
        for label, n in rows:
            pct = (n / total * 100) if total else 0
            out += (f'<div class="row"><span>{esc(label)}</span><span class="track"><span class="fill{" alt" if alt else ""}" style="width:{pct:.1f}%;display:block"></span></span>'
                    f'<span class="v">{n}</span></div>')
        return out

    grade_rows = [(f'{g}（{GRADE_WORD[g]}）を含む記録', a['contains_grade'][g]) for g in 'SABCD']
    kind_rows = [(kinds[k], n) for k, n in a['source_kinds'].items()]
    cap_rows = list(a['capital'].items())
    sub_rows = ''.join(
        f'<tr><th>{esc(v["label"])}</th><td>{v["records"]}件</td><td>{v["sources"]}件（1記録あたり {v["sources_per_record"]}）</td>'
        f'<td>{v["page_type"].get("地の頁", 0)}／{v["page_type"].get("余白の頁", 0)}</td><td>{v["with_geo"]}件</td><td>{esc(v["updated"])}</td></tr>'
        for v in subs.values())
    by_author = '・'.join(v['label'] for v in subs.values() if v['with_source_details'] == v['records'])
    by_domain = '・'.join(v['label'] for v in subs.values() if v['with_source_details'] == 0)
    kind_note = ''
    if by_author:
        kind_note += f'出典の種類は、{by_author}の記録では考証者が出典ごとに付けています。'
    if by_domain:
        kind_note += f'{by_domain}の記録では、URLのドメインから機械的に分類しています。'
    return f'''
      {tiles()}
      <table>
        <tr><th>土地</th><th>記録</th><th>出典</th><th>地の頁／余白の頁</th><th>座標あり</th><th>版</th></tr>
        {sub_rows}
      </table>
      <div class="bars">
        {bars('確度 — その等級の主張をひとつでも含む記録の数（一つの記録が複数に数えられます）', grade_rows, a['records'])}
        {bars('出典の種類 — 全 ' + str(a['sources']) + ' 件の内訳', kind_rows, a['sources'], alt=True)}
        {bars('資本の区分 — 記録の数（うち ' + str(a['capital_provisional']) + ' 件は分類からの暫定の割り当て）', cap_rows, a['records'])}
      </div>
      <p class="note">この欄は、台帳（{esc(stats['generated'])} 版）から機械的に数えたものです。{esc(kind_note)}「未分類」は規則に当てはまらなかったもので、質が低いという意味ではありません。土地ごとの数は、土地どうしを比べるためのものではありません。線の引き方を変えれば、数も変わります。数え方の規則は <a href="data/archive-config.json">設定ファイル</a> に、数えた結果は <a href="data/archive-stats.json">統計ファイル</a> に置いています。</p>
'''


def method_with_stats(stats):
    """方法の頁の統計の欄（STATS:BEGIN〜END）を差し替えた全文を返す。目印が無ければ None。"""
    p = ROOT / 'archive-method.html'
    if not p.exists():
        return None
    text = p.read_text(encoding='utf-8')
    new, n = re.subn(r'(<!-- STATS:BEGIN -->).*?(<!-- STATS:END -->)',
                     lambda m: m.group(1) + stats_html(stats) + '      ' + m.group(2), text, flags=re.S)
    return new if n else None


# ---------- サイトマップ ----------
def sitemap_text(records, meta, used_subs):
    """sitemap.xml の全文と、行数を返す。宿の頁の行は、いまのファイルから引き継ぐ。"""
    p = ROOT / 'sitemap.xml'
    keep = []
    if p.exists():
        for m in re.finditer(r'<url>.*?</url>', p.read_text(encoding='utf-8'), flags=re.S):
            loc = re.search(r'<loc>(.*?)</loc>', m.group(0)).group(1)
            if '/archive' not in loc and '/records/' not in loc:
                keep.append(re.sub(r'\n\s*', '\n    ', m.group(0).strip()).replace('\n    </url>', '\n  </url>'))
    latest = max(m.get('updated', '') for m in meta.values())
    pages = [('archive.html', latest, 'weekly', '0.8'), ('archive-db.html', latest, 'weekly', '0.7'),
             ('records/index.html', latest, 'weekly', '0.7'), ('archive-method.html', latest, 'monthly', '0.6'),
             ('archive-map.html', latest, 'weekly', '0.5'), ('archive-graph.html', latest, 'weekly', '0.5')]
    pages[3:3] = [(f'records/{s["id"]}.html', meta[s['id']].get('updated', latest), 'weekly', '0.7') for s in used_subs]
    pages = [x for x in pages if (ROOT / x[0]).exists() or x[0].startswith('records/')]
    urls = ['  ' + k for k in keep]
    for path, lastmod, freq, prio in pages:
        urls.append(f'  <url>\n    <loc>{BASE}{path}</loc>\n    <lastmod>{lastmod}</lastmod>\n    <changefreq>{freq}</changefreq>\n    <priority>{prio}</priority>\n  </url>')
    for r in records:
        urls.append(f'  <url>\n    <loc>{record_url(r["id"])}</loc>\n    <lastmod>{r["updated"]}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>')
    return ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + '\n'.join(urls) + '\n</urlset>\n'), len(urls)


def build_outputs(records, meta):
    """生成物を {リポジトリからの相対パス: 中身} で返す。何も書かない。
    中身は書き出し元と設定だけで決まる（生成した日には依らない）ので、置いてあるファイルと比べられる。"""
    by_id = {r['id']: r for r in records}
    rel = build_relations(records)
    stats = compute_stats(records, meta)
    # 頁送りの順: 土地 → 分類 → ID
    gorder = [g[0] for g in CONFIG['groups']]
    aorder = [a['id'] for a in CONFIG['subregions']]
    order = [r['id'] for r in sorted(records, key=lambda r: (aorder.index(r['subregion']), gorder.index(group_of(r)[0]), r['id']))]
    sorted_records = [by_id[i] for i in order]
    used_subs = [s for s in CONFIG['subregions'] if any(r['subregion'] == s['id'] for r in records)]
    out = OrderedDict()
    out[CONFIG['db']['file']] = db_json(records, meta)
    for r in records:
        out[f'records/{r["id"]}.html'] = render_record(r, by_id, rel, order)
    out['records/index.html'] = render_index(sorted_records, meta, stats)
    for sub in used_subs:
        out[f'records/{sub["id"]}.html'] = render_land(sub, sorted_records, by_id, rel, meta)
    out['data/archive-stats.json'] = json.dumps(stats, ensure_ascii=False, indent=1) + '\n'
    method = method_with_stats(stats)
    if method is not None:
        out['archive-method.html'] = method
    sitemap, n_urls = sitemap_text(sorted_records, meta, used_subs)
    out['sitemap.xml'] = sitemap
    return out, stats, used_subs, n_urls, method is not None


def main():
    dry = '--dry' in sys.argv
    records, meta = load_sources()
    by_id = {r['id']: r for r in records}
    if len(by_id) != len(records):
        dup = [i for i, n in Counter(r['id'] for r in records).items() if n > 1]
        sys.exit(f'ERROR: ID が重複しています: {dup}')
    for r in records:
        if not r['id'].startswith(sub_of(r['subregion'])['id_prefix']):
            sys.exit(f'ERROR: {r["id"]} が {r["subregion"]} の書き出し元に入っています（IDの頭が合わない）')
    outputs, stats, used_subs, n_urls, injected = build_outputs(records, meta)
    # 台帳から無くなった記録の頁（records/ にあって、いまの台帳に無いもの）
    stale = sorted(f.name for f in OUT.glob('*.html') if f'records/{f.name}' not in outputs) if OUT.exists() else []
    if '--check' in sys.argv:
        diff = [path for path, text in outputs.items()
                if not (ROOT / path).exists() or (ROOT / path).read_text(encoding='utf-8') != text]
        if diff or stale:
            for path in diff[:12]:
                print(f'  古い: {path}')
            if len(diff) > 12:
                print(f'  …ほか {len(diff) - 12} 件')
            for name in stale[:12]:
                print(f'  台帳に無い頁: records/{name}')
            sys.exit(f'STALE: 生成物が、いまの書き出し元・設定と合っていません（古い {len(diff)} 件／台帳に無い頁 {len(stale)} 件）。'
                     'python3 scripts/build_archive_pages.py を回してください。')
        print(f'OK: 生成物 {len(outputs)} 件は、いまの書き出し元・設定と合っています（記録 {len(records)}件）')
        return
    if dry:
        print(json.dumps(stats, ensure_ascii=False, indent=1))
        if stale:
            print(f'台帳に無い記録の頁 {len(stale)} 件: {stale[:12]}')
        return
    if stale and '--prune' not in sys.argv:
        sys.exit(f'ERROR: records/ に、いまの台帳に無い頁が {len(stale)} 件あります: {stale[:12]}\n'
                 '記録の頁のURLは引用の単位です。書き出し元の置き忘れ・名前の間違いでないかを確かめてください。'
                 '本当に消してよいときだけ --prune を付けて回してください。')
    OUT.mkdir(exist_ok=True)
    for name in stale:
        (OUT / name).unlink()
    for path, text in outputs.items():
        (ROOT / path).write_text(text, encoding='utf-8')
    print(f'台帳 {len(records)} 件 → {DB_PATH.relative_to(ROOT)}／記録の頁 {len(records)} 本／総目録 1 本／土地の入口 {len(used_subs)} 本／sitemap {n_urls} 行／統計の差し込み {"済" if injected else "なし（archive-method.html に目印が無い）"}')
    for aid, v in stats['subregions'].items():
        print(f'  {v["label"]}: {v["records"]}件・出典{v["sources"]}件・座標{v["with_geo"]}件')
    print(f'  土地をまたぐつながり: {stats["cross_subregion_links"]}（うち考証者が張ったもの {stats["cross_subregion_explicit"]}）')


if __name__ == '__main__':
    main()
