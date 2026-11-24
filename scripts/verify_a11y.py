"""Acessibilidade automatizada com axe-core (SPEC 06, incremento de fechamento). Servidor já iniciado.

Roda as regras WCAG 2.1 A e AA nas rotas principais em 1440 e 360 px. Falha com violação de
impacto "serious" ou "critical"; as demais ficam no relatório output/qa/<modo>/a11y.json.
O axe vem de apps/web/node_modules (dependência de desenvolvimento), sem CDN.
"""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
AXE = ROOT / 'apps' / 'web' / 'node_modules' / 'axe-core' / 'axe.min.js'
TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
BLOCKING = {'serious', 'critical'}
ROUTES = ['/', '/investigacao', '/mapa', '/municipios/2304400', '/parlamentares', '/fluxos', '/estaduais',
          '/dados', '/glossario', '/reportagens', '/sobre', '/correcoes', '/contato', '/privacidade', '/rota-que-nao-existe']


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', default='http://localhost:3001')
    parser.add_argument('--mode', choices=['demo', 'validacao', 'publicado'], default='demo')
    args = parser.parse_args()
    routes = list(ROUTES)
    if args.mode == 'publicado':
        routes += ['/reportagens/geografia-das-emendas', '/reportagens/onde-termina-o-registro',
                   '/emendas/202537330007', '/estaduais/agenor-neto']
    out = ROOT / 'output' / 'qa' / args.mode
    out.mkdir(parents=True, exist_ok=True)
    axe = AXE.read_text(encoding='utf-8')
    report, blocking = [], []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # bypass_csp só neste navegador de teste: a CSP de produção bloquearia o script do axe.
        context = browser.new_context(bypass_csp=True, reduced_motion='reduce')
        page = context.new_page()
        for width in (1440, 360):
            page.set_viewport_size({'width': width, 'height': 1000 if width == 1440 else 800})
            for route in routes:
                page.goto(args.url + route, wait_until='networkidle', timeout=120000)
                page.locator('main h1, main h2').first.wait_for()
                page.add_script_tag(content=axe)
                result = page.evaluate('(tags) => axe.run(document, {runOnly: {type: "tag", values: tags}})', TAGS)
                for v in result['violations']:
                    item = {'route': route, 'width': width, 'id': v['id'], 'impact': v['impact'], 'help': v['help'],
                            'nodes': [n['target'] for n in v['nodes']][:10], 'count': len(v['nodes'])}
                    report.append(item)
                    if v['impact'] in BLOCKING:
                        blocking.append(item)
        browser.close()
    (out / 'a11y.json').write_text(json.dumps({'mode': args.mode, 'tags': TAGS, 'routes': routes,
        'violations': report}, indent=2, ensure_ascii=False), encoding='utf-8')
    for b in blocking:
        print(f"[{b['impact']}] {b['width']}px {b['route']} {b['id']} ({b['count']}): {b['help']} {b['nodes'][:3]}")
    minor = len(report) - len(blocking)
    print(f'{args.mode}: {len(routes) * 2} telas, {len(blocking)} violações graves, {minor} menores (ver a11y.json)')
    raise SystemExit(1 if blocking else 0)


if __name__ == '__main__':
    main()
