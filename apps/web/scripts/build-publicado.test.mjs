// Trava de publicação (ADR-015, auditoria SENTINEL S-09): cada padrão proibido recusa o site.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CONTACT_EMAIL, scan } from './build-publicado.mjs';

function site(files) {
  const dir = mkdtempSync(join(tmpdir(), 'rastro-trava-'));
  mkdirSync(join(dir, '_next'), { recursive: true });
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  return dir;
}

test('site limpo, com o e-mail de contato e pessoas omitidas, passa', () => {
  const dir = site({ 'index.html': `<p>Contato: ${CONTACT_EMAIL}</p><p>[pessoa física — omitido]</p><img src="/fotos/a@2x.png">`, '_next/app.js': 'console.log(1)' });
  assert.deepEqual(scan(dir), { pages: 1, problems: [] });
  rmSync(dir, { recursive: true, force: true });
});

for (const [label, text] of [
  ['CPF', 'Favorecido 123.456.789-09'],
  ['CPF parcialmente mascarado', 'Favorecido ***.456.789-**'],
  ['MEI', 'Favorecido 11.854.334 FULANO DE TAL'],
  ['e-mail pessoal', 'autor exemplo.pessoal@gmail.com'],
  ['caminho local', 'C:\\Users\\Alguem\\projeto'],
  ['chave de API', 'PORTAL_API_KEY=x'],
  ['source map', '//# sourceMappingURL=app.js.map'],
  ['aviso de validação', 'DADOS OFICIAIS EM VALIDAÇÃO'],
]) {
  test(`recusa ${label}, inclusive em JS`, () => {
    const dir = site({ 'index.html': '<p>ok</p>', '_next/chunk.js': `var s = ${JSON.stringify(text)};` });
    assert.ok(scan(dir).problems.length > 0, label);
    rmSync(dir, { recursive: true, force: true });
  });
}
