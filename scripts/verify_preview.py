"""Confere links locais e assets da prévia offline, sem rede."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1] / 'preview'


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ('href', 'src') and value:
                self.refs.append(value)


errors = []
count = 0
for page in ROOT.glob('*.html'):
    parser = Links()
    html = page.read_text(encoding='utf-8')
    assert 'todos os valores exibidos são fictícios' in html, page
    parser.feed(html)
    for ref in parser.refs:
        url = urlsplit(ref)
        if url.scheme or url.netloc or not url.path:
            continue
        target = page.parent / unquote(url.path)
        if url.path.startswith('/') or not target.is_file():
            errors.append((page.name, ref))
        count += 1
assert not errors, errors
print(f'Prévia: {len(list(ROOT.glob("*.html")))} páginas demo, {count} links/assets locais OK')
