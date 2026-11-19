"""Navegação local, regressões do CSV e capturas reais. Servidor já iniciado."""
import argparse
import csv
import io
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', default='http://localhost:3001')
    parser.add_argument('--mode', choices=['demo', 'validacao'], default='validacao')
    args = parser.parse_args()
    out = ROOT / 'output' / 'qa' / args.mode
    out.mkdir(parents=True, exist_ok=True)
    emenda, autor = 'DEMO00000001', 'demo-a'
    if args.mode == 'validacao':
        emendas = json.loads(sorted((ROOT / 'data/validacao').glob('emendas-*.json'))[-1].read_text(encoding='utf-8'))['emendas']
        emenda = next(c for c, e in emendas.items() if e['autor_ficha'] and e['documentos'])
        autor = emendas[emenda]['autor_ficha']
    routes = {'home': '/', 'mapa': '/mapa', 'municipio': '/municipios/2304400', 'emenda': f'/emendas/{emenda}',
              'autor': f'/parlamentares/{autor}', 'autores': '/parlamentares', 'dados': '/dados',
              'sobre': '/sobre', 'correcoes': '/correcoes', 'contato': '/contato', 'glossario': '/glossario', 'fluxos': '/fluxos'}
    results, errors = [], []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1440, 'height': 1000}, device_scale_factor=1, reduced_motion='reduce')
        page.on('pageerror', lambda e: errors.append(str(e)))
        for width in (1440, 360):
            page.set_viewport_size({'width': width, 'height': 1000 if width == 1440 else 800})
            for name, route in routes.items():
                response = page.goto(args.url + route, wait_until='networkidle', timeout=120000)
                assert response.status == 200, (route, response.status)
                page.locator('main h1, main h2').first.wait_for()
                page.evaluate('document.fonts.ready')
                overflow = page.evaluate('document.documentElement.scrollWidth > window.innerWidth')
                assert not overflow, f'Overflow {width}px {route}'
                text = page.locator('body').inner_text()
                assert ('DADOS OFICIAIS EM VALIDAÇÃO' if args.mode == 'validacao' else 'todos os valores exibidos são fictícios') in text
                for link in ('/sobre', '/correcoes', '/contato'):
                    assert page.locator(f'footer a[href="{link}"]').count() == 1
                page.screenshot(path=str(out / f'{name}-{width}.png'))
                if width == 1440 and name == 'emenda':
                    for section, shot in [('linha-do-tempo', 'cronologia'), ('recebeu', 'favorecidos')]:
                        page.locator(f'#{section}').scroll_into_view_if_needed()
                        page.screenshot(path=str(out / f'{shot}-1440.png'))
                if width == 1440 and name == 'mapa':
                    page.locator('.data-table').first.scroll_into_view_if_needed()
                    page.screenshot(path=str(out / 'tabela-mapa-1440.png'))
                results.append({'route': route, 'width': width, 'status': response.status, 'overflow': overflow})
        page.set_viewport_size({'width': 1440, 'height': 1000})
        page.goto(args.url + '/mapa', wait_until='networkidle')
        search = page.get_by_label('Município cearense', exact=True)
        search.fill('crateus')
        search.press('Enter')
        assert page.locator('.metric-panel h4').inner_text().startswith('Crateús')
        search.fill('2304400')
        search.press('Enter')
        for criterio, label in [('emenda', 'Localidade da emenda'), ('aplicacao', 'Onde o pagamento foi aplicado')]:
            button = page.get_by_role('button', name=label, exact=True)
            button.click()
            assert button.get_attribute('aria-pressed') == 'true'
            page.wait_for_function('(c) => new URL(location.href).searchParams.get("criterio") === c', arg=criterio)
            with page.expect_download() as event:
                page.get_by_role('button', name='Baixar CSV').click()
            download = event.value
            csv_path = out / download.suggested_filename
            download.save_as(str(csv_path))
            content = csv_path.read_text(encoding='utf-8-sig')
            assert f'# criterio: {label}' in content
            rows = list(csv.DictReader(io.StringIO('\n'.join(l for l in content.splitlines() if not l.startswith('#'))), delimiter=';'))
            row = next(r for r in rows if r['codigo_ibge'] == '2304400')
            if args.mode == 'validacao':
                dataset = json.loads(sorted((ROOT / 'data/validacao').glob('ce-municipios-*.json'))[-1].read_text(encoding='utf-8'))
                city = next(m for m in dataset['municipalities'] if m['ibge_code'] == '2304400')
                year = page.evaluate('new URL(location.href).searchParams.get("ano")')
                expected = city['aplicacao'][year]['pago'] if criterio == 'aplicacao' else city['years'][year]['pago']
                assert int(row['valor_centavos']) == expected
            if criterio == 'aplicacao':
                assert all(r['etapa'] == 'pago_aplicacao' for r in rows)
                assert all(r['tipo_destinacao'] == 'municipio' for r in rows)
                assert all(r['rap_pagos_centavos'] == '' for r in rows)
            page.locator('#explorador').evaluate('(el) => window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 95)')
            page.screenshot(path=str(out / f'criterio-{criterio}.png'))
        page.get_by_role('link', name='Fortaleza', exact=False).first.click()
        page.wait_for_url('**/municipios/2304400')
        assert page.locator('main h1').inner_text() == 'Fortaleza'
        response = page.goto(args.url + '/emendas/NAO-EXISTE', wait_until='networkidle')
        assert response.status == 404
        assert not errors, errors
        browser.close()
    (out / 'resultados.json').write_text(json.dumps({'mode': args.mode, 'pages': results, 'page_errors': errors, 'csv': 'pass', 'keyboard': 'pass', 'missing_route': 404}, indent=2), encoding='utf-8')
    print(f'{args.mode}: {len(results)} telas sem overflow; navegação, teclado, CSV e 404 OK')


if __name__ == '__main__':
    main()
