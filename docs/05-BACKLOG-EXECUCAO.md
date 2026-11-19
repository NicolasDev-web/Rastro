# Backlog prático — da ideia ao lançamento

A coluna `Etapa` é sequencial; não confundir protótipo com publicação jornalística apurada.

| Etapa | Issue | Entrega | Bloqueios | Teste de aceite |
|---|---|---|---|---|
| 0 | RAS-001 | Repo, Constitution, CI e governança | nenhum | docs e checks ativos |
| 1 | RAS-010 | Inventário CGU por exercício | fonte disponível | schema e cobertura registrados |
| 1 | RAS-011 | Inventário Transferegov | documentação API | módulos e endpoints verificados |
| 1 | RAS-012 | Ingestão raw versionada | inventário | mesmo snapshot = mesmo hash |
| 1 | RAS-013 | Parser e normalização | dicionário por fonte | dados preservam origem e valores |
| 1 | RAS-014 | Conciliação e cobertura | parsers | totais e diferenças explicadas |
| 2 | RAS-020 | Design tokens e galeria | Constituição | A11y, 360px, estados demo |
| 2 | RAS-021 | Navegação + layout editorial | tokens | navegação por teclado |
| 2 | RAS-022 | Busca municipal com fixtures | layout | acentos, filtro e vazio |
| 3 | RAS-030 | Investigação educativa | roteiro validado | fontes de conceitos e revisão |
| 3 | RAS-031 | Integração de dados auditados | RAS-014 | sem números demo em produção |
| 4 | RAS-040 | Mapa IBGE real + tabela | municipal + geo | sem atribuição indevida |
| 4 | RAS-041 | Perfis autor formal/coletivo | autoria revisada | papel de autor correto |
| 4 | RAS-042 | Fluxo de evidências | chaves/documentos | relações sempre documentadas |
| 5 | RAS-050 | Dossiê de investigação | fluxo + editorial | contraditório e revisão |
| 6 | RAS-060 | Lançamento, revisão e rollback | todas | checklist SPEC 06 integral |

## Gates obrigatórios

- **Gate A**: parser pode ser repetido e auditado sem alterar resultado.
- **Gate B**: cada total publicado é reconciliado e tem fonte/denominador.
- **Gate C**: usuário leigo entende o indicador testado e visualiza a cobertura.
- **Gate D**: revisão editorial independente antes de qualquer apuração de indivíduos.

## Entregas semanais sugeridas (sem cronograma fixo)

Iteração 1: validar fontes e schema. Iteração 2: criar pipeline e checks. Iteração 3: integrar design editorial. Iteração 4: mapear municípios. Iteração 5: rastreamento documental. Cada iteração termina com revisão da spec, não apenas uma demo visual.
