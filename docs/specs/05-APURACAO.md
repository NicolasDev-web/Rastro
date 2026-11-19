# SPEC 05 — Dossiês e ciclo editorial

## Histórias
Como editor, quero reunir documentos e hipóteses sem transformar padrões estatísticos em acusações. Como citado, quero o direito ao contraditório e a correção de erros.

## Modelo de dossiê
`id`, `hipotese`, `fatos_confirmados`, `outras_explicacoes`, `lacunas`, `documentos`, `entrevistas`, `pedidos_LAI`, `contatos_respondentes`, `direito_resposta`, `status_editorial`, `parecer_legal`, `revisores`.

## Fases
Sinal descritivo → triagem → coleta documental → confirmação → contraditório → edição → revisão → publicação → monitoramento e correção.

## Critérios de aceite
- **AC01** Pauta sempre apresenta explicações alternativas plausíveis e limitações.
- **AC02** Alegação individualizada não é publicada sem revisão editorial e oportunidade razoável de resposta.
- **AC03** Todo número no texto remete ao dataset/versionamento.
- **AC04** Nenhum dossiê não publicado vaza para API pública.
- **AC05** Correção posterior preserva versão anterior e motivo.

## Tasks
- [ ] T05.01 Template de pauta e checklist.
- [ ] T05.02 CRUD privado com papéis editoriais.
- [ ] T05.03 Upload seguro e checksums de evidência.
- [ ] T05.04 Registro de pedido LAI e contraditório.
- [ ] T05.05 Revisão e auditoria de publicação.
