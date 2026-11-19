"""Agregação estrita: qualquer parcela ausente torna o total indisponível."""
def total(values):
    values = list(values)
    return sum(values) if values and all(v is not None for v in values) else None


def sql_total(column):
    return f'CASE WHEN COUNT(*) = COUNT({column}) THEN SUM({column}) END'
