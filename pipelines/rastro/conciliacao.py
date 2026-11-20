"""Comparação financeira exata; padrões numéricos não explicam a causa da diferença."""
from .money import total


def payment(pago, rap_pagos, document_values):
    values = list(document_values)
    expected = total([pago, rap_pagos])
    actual = total(values)
    status = ('sem_documentos' if not values else
              'indisponivel' if expected is None or actual is None else
              'confere' if actual == expected else 'diverge')
    difference = actual - expected if status in ('confere', 'diverge') else None
    pattern = (status if status != 'diverge' else
               'igual_so_pago' if actual == pago else
               'abaixo' if difference < 0 else 'acima')
    return {'status': status, 'documentos_pago': actual, 'pago_total': expected,
            'documentos_pagamento': len(values), 'diferenca': difference, 'padrao': pattern}
