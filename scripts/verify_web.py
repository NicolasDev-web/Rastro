"""Navegação local, regressões do CSV e capturas reais. Servidor já iniciado."""
import argparse
import csv
import io
import hashlib
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', default='http://localhost:3001')
    parser.add_argument('--mode', choices=['demo', 'validacao', 'publicado'], default='validacao')
    args = parser.parse_args()
    out = ROOT / 'output' / 'qa' / args.mode
    out.mkdir(parents=True, exist_ok=True)
    emenda, autor = 'DEMO00000001', 'demo-a'
    manifest, emendas, dataset = None, {}, None
    if args.mode != 'demo':
        validation = ROOT / ('data/publicado' if args.mode == 'publicado' else 'data/validacao')
        manifest = json.loads((validation/'active-bundle.json').read_text(encoding='utf-8'))
        def read_bundle(name):
            file = validation/manifest['files'][name]['path']
            assert hashlib.sha256(file.read_bytes()).hexdigest() == manifest['files'][name]['sha256']
            return json.loads(file.read_text(encoding='utf-8'))
        emendas = read_bundle('emendas')['emendas']
        dataset = read_bundle('ce-municipios')
        emenda = next(c for c, e in emendas.items() if e['autor_ficha'] and e['documentos'])
        autor = emendas[emenda]['autor_ficha']
    routes = {'home': '/', 'mapa': '/mapa', 'municipio': '/municipios/2304400', 'emenda': f'/emendas/{emenda}',
              'autor': f'/parlamentares/{autor}', 'autores': '/parlamentares', 'dados': '/dados',
              'sobre': '/sobre', 'correcoes': '/correcoes', 'contato': '/contato', 'glossario': '/glossario', 'fluxos': '/fluxos', 'estaduais': '/estaduais'}
    if args.mode == 'publicado':
        # Ficha com plano de ação e execução declarada no Transferegov (ADR-018): texto livre longo da fonte.
        routes['emenda-transferegov'] = '/emendas/202537330007'
    state_routes = {}
    for status, label in [('diverge', 'Pagamentos divergem dos documentos'),
                          ('sem_documentos', 'Sem documento de pagamento'),
                          ('indisponivel', 'Conciliação indisponível — valores incompletos')]:
        code = next((c for c, e in emendas.items() if e['conciliacao']['status'] == status), None)
        if code:
            name = 'emenda-' + status
            routes[name] = f'/emendas/{code}'
            state_routes[name] = label
    results, errors = [], []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1440, 'height': 1000}, device_scale_factor=1, reduced_motion='reduce')
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: errors.append(m.text) if 'Content Security Policy' in m.text or 'Refused to' in m.text else None)
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
                if name in state_routes:
                    assert state_routes[name].casefold() in text.casefold(), (name, text)
                    assert 'pagamentos conferem com os documentos' not in text.casefold()
                assert {'validacao': 'DADOS OFICIAIS EM VALIDAÇÃO', 'publicado': 'Investigação cidadã independente', 'demo': 'todos os valores exibidos são fictícios'}[args.mode] in text
                if args.mode == 'publicado':
                    assert not any(w in text for w in ('VALIDAÇÃO', 'NÃO PUBLICAR', 'fictíci', 'PROTÓTIPO')), route
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
        # Nova aba Mapa (SPEC 04 T04.03, ADR-017): busca por nome sem acento e por código IBGE, pelo teclado.
        search = page.get_by_label('Sua cidade', exact=True)
        search.fill('crateus')
        search.press('Enter')
        assert page.locator('.mapa-ce-card h3').inner_text() == 'Crateús'
        search.fill('2304400')
        search.press('Enter')
        assert page.locator('.mapa-ce-card h3').inner_text() == 'Fortaleza'
        page.wait_for_function('() => new URL(location.href).searchParams.get("municipio") === "2304400"')
        year = page.evaluate('new URL(location.href).searchParams.get("ano")')
        if args.mode != 'demo':
            city = next(m for m in dataset['municipalities'] if m['ibge_code'] == '2304400')
            pago = (city.get('aplicacao') or {}).get(year, {}) or {}
            big = page.locator('.mapa-ce-big b').inner_text().replace(' ', ' ')
            if pago.get('pago'):
                reais, cents = divmod(pago['pago'], 100)
                assert big == f"R$ {reais:,}".replace(',', '.') + f",{cents:02d}", big
            else:
                assert big == 'Sem registro', big
        page.locator('.mapa-ce').evaluate('(el) => window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 95)')
        page.screenshot(path=str(out / 'mapa-fortaleza.png'))
        # Tabela recolhida (alternativa acessível, AC04) e CSV com metadados (AC07).
        page.get_by_text('Ver todos os', exact=False).click()
        with page.expect_download() as event:
            page.get_by_role('button', name='Baixar CSV', exact=False).click()
        download = event.value
        csv_path = out / download.suggested_filename
        download.save_as(str(csv_path))
        content = csv_path.read_text(encoding='utf-8-sig')
        assert '# criterio: Localidade da emenda' in content
        rows = list(csv.DictReader(io.StringIO('\n'.join(l for l in content.splitlines() if not l.startswith('#'))), delimiter=';'))
        row = next(r for r in rows if r['codigo_ibge'] == '2304400')
        if args.mode != 'demo':
            csv_year = row['exercicio']
            expected = (city['years'].get(csv_year) or {}).get('pago')
            assert (row['valor_centavos'] or None) == (str(expected) if expected is not None else None)
        page.get_by_role('link', name='Emendas, autores e quem recebeu').click()
        page.wait_for_url('**/municipios/2304400')
        assert page.locator('main h1').inner_text() == 'Fortaleza'
        response = page.goto(args.url + '/emendas/NAO-EXISTE', wait_until='networkidle')
        assert response.status == 404
        assert not errors, errors
        browser.close()
    (out / 'resultados.json').write_text(json.dumps({'mode': args.mode, 'bundle_id': manifest['id'] if manifest else None,
        'pages': results, 'payment_states_tested': list(state_routes), 'page_errors': errors,
        'csv': 'pass', 'keyboard': 'pass', 'missing_route': 404}, indent=2), encoding='utf-8')
    print(f'{args.mode}: {len(results)} telas sem overflow; navegação, teclado, CSV e 404 OK')


if __name__ == '__main__':
    main()
