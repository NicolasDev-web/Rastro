# Extract — planejamento de conectores

Ainda **não** existem conectores prontos com dados reais. Implementar conforme `docs/specs/01-DADOS-FEDERAIS.md`.

## Futuro adaptador CGU
- Descobrir downloads e dicionário por exercício.
- Baixar com cabeçalhos e limites respeitosos.
- Registrar manifest: fonte, URL, data UTC, SHA-256, bytes, schema.
- Detectar encoding, separador CSV e locale numérico.
- Validar chaves e granularidade.

## Futuro adaptador Transferegov
- Conferir APIs novas (2026) e documentação.
- Definir endpoint, paginação e contrato para cada módulo.
- Tratar rate limits, timeout, 429 e schema drift.

## Segurança
Não fazer scraping de páginas protegidas ou contornar limitações de acesso. Priorizar arquivos/API pública.
