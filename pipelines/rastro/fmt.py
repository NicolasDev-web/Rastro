"""Formatação para relatórios (somente apresentação; cálculos sempre em centavos inteiros)."""


def brl(cents: int | None) -> str:
    if cents is None:
        return 'sem registro'
    neg = cents < 0
    reais, cent = divmod(abs(cents), 100)
    txt = f'{reais:,}'.replace(',', '.') + f',{cent:02d}'
    return f'{"-" if neg else ""}R$ {txt}'


def num(n: int) -> str:
    return f'{n:,}'.replace(',', '.')


def table(headers: list[str], rows: list[list], align: str | None = None) -> str:
    align = align or 'l' * len(headers)
    sep = ['---:' if a == 'r' else '---' for a in align]
    out = ['| ' + ' | '.join(headers) + ' |', '| ' + ' | '.join(sep) + ' |']
    out += ['| ' + ' | '.join(str(c) for c in r) + ' |' for r in rows]
    return '\n'.join(out)
