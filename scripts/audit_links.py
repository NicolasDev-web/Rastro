"""Auditoria dos links externos do site gerado (SPEC 06, T06.03).

Lê o HTML de um build estático (padrão: dist/rastro), junta os links externos por domínio e confere cada
um com GET, um acesso por vez, intervalo mínimo de 1 s por domínio, User-Agent genérico do projeto, sem
cookies e sem contornar bloqueio. Domínios com muitos links são conferidos por amostra determinística
(ordem do SHA-1 do endereço). Resultado por link: ok, quebrado (404/410), bloqueado (401/403/429/451:
não verificável, não é quebrado) e erro (rede ou outro código). Não roda no CI.

Uso: python scripts/audit_links.py [--site dist/rastro] [--amostra 25]
"""
import argparse
import collections
import datetime
import hashlib
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UA = 'RASTRO-verificador-de-links/1.0 (projeto de investigação cidadã; conferência de links publicados)'
HREF = re.compile(r'href="(https?://[^"#]+)')


def collect(site: Path):
    urls = collections.defaultdict(set)  # url -> páginas
    for f in site.rglob('*.html'):
        page = '/' + f.relative_to(site).as_posix().removesuffix('index.html').removesuffix('.html')
        for u in HREF.findall(f.read_text(encoding='utf-8', errors='ignore')):
            urls[u.replace('&amp;', '&')].add(page)
    return urls


def check(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'text/html,*/*'})
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            r.read(2048)
            return 'ok', r.status
    except urllib.error.HTTPError as e:
        if e.code in (404, 410):
            return 'quebrado', e.code
        if e.code in (401, 403, 429, 451):
            return 'bloqueado', e.code
        return 'erro', e.code
    except Exception as e:  # rede, TLS, tempo esgotado
        return 'erro', type(e).__name__


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--site', default=str(ROOT / 'dist' / 'rastro'))
    parser.add_argument('--amostra', type=int, default=25, help='máximo de links conferidos por domínio')
    args = parser.parse_args()
    site = Path(args.site)
    urls = collect(site)
    by_host = collections.defaultdict(list)
    for u in urls:
        by_host[re.sub(r'^https?://([^/:]+).*', r'\1', u)].append(u)
    results, last = [], {}
    for host in sorted(by_host):
        sample = sorted(by_host[host], key=lambda u: hashlib.sha1(u.encode()).hexdigest())[:args.amostra]
        for u in sample:
            wait = 1.0 - (time.monotonic() - last.get(host, 0))
            if wait > 0:
                time.sleep(wait)
            status, code = check(u)
            last[host] = time.monotonic()
            results.append((host, u, status, code))
            print(f'{status:9} {code} {u}', flush=True)
    today = datetime.date.today().isoformat()
    counts = collections.Counter(r[2] for r in results)
    lines = [f'# Links externos — {today}', '',
             f'> SPEC 06, T06.03. Gerado por `python scripts/audit_links.py`. Site: `{site.relative_to(ROOT) if site.is_relative_to(ROOT) else site}`, '
             f'{sum(1 for _ in site.rglob("*.html"))} páginas, {len(urls)} links externos únicos em {len(by_host)} domínios. '
             f'Conferidos: {len(results)} (até {args.amostra} por domínio, amostra determinística). '
             '"Bloqueado" quer dizer que o site recusou o acesso automatizado; não é link quebrado.', '',
             '| Resultado | Links |', '|---|---:|']
    lines += [f'| {k} | {counts.get(k, 0)} |' for k in ('ok', 'quebrado', 'bloqueado', 'erro')]
    lines += ['', '## Por domínio', '', '| Domínio | Links únicos | Conferidos | ok | quebrado | bloqueado | erro |', '|---|---:|---:|---:|---:|---:|---:|']
    for host in sorted(by_host):
        c = collections.Counter(r[2] for r in results if r[0] == host)
        lines.append(f'| {host} | {len(by_host[host])} | {sum(c.values())} | {c["ok"]} | {c["quebrado"]} | {c["bloqueado"]} | {c["erro"]} |')
    problems = [r for r in results if r[2] in ('quebrado', 'erro')]
    lines += ['', '## Quebrados e erros', '']
    if not problems:
        lines.append('Nenhum.')
    for host, u, status, code in problems:
        pages = sorted(urls[u])
        lines.append(f'- **{status} ({code})** {u} — em {len(pages)} página(s), ex.: `{pages[0]}`')
    out = ROOT / 'reports' / f'links-externos-{today}.md'
    out.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'{dict(counts)} -> {out.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
