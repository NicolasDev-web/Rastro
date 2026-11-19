# Publish — gate editorial

Publicar somente dataset com `snapshot_id`, `coverage`, `source_url`, `as_of`, reconciliação e revisão. A API pública deve usar materialized views/read models criadas após `verified=true`; usar fallback de indisponibilidade, jamais dados demo misturados.
