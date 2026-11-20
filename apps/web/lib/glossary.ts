// Glossário do RASTRO — RASCUNHO pendente de validação editorial (SPEC 03, T03.01).
// Cada termo aponta para a norma oficial de referência. Antes de publicar:
// conferir o texto vigente, registrar a data de consulta e obter revisão independente.

export type GlossaryEntry = { id: string; term: string; short: string; long?: string; source?: { label: string; url: string } };

const L4320 = { label: 'Lei nº 4.320/1964', url: 'https://www.planalto.gov.br/ccivil_03/leis/l4320.htm' };
const CF = { label: 'Constituição Federal, arts. 166 e 166-A', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm' };

export const glossary: GlossaryEntry[] = [
  { id: 'emenda', term: 'Emenda parlamentar', short: 'Proposta de deputados e senadores — individualmente, em bancada ou em comissão — para alterar o projeto de lei orçamentária enviado pelo Executivo.', long: 'A emenda muda a destinação de uma parte do orçamento. Ela não é, sozinha, prova de que o dinheiro foi gasto: depois de aprovada ainda precisa ser executada.', source: CF },
  { id: 'rp', term: 'RP (identificador de resultado primário)', short: 'Código usado no orçamento federal para classificar a despesa. RP 6 = emendas individuais, RP 7 = de bancada estadual, RP 8 = de comissão, RP 9 = de relator-geral (modelo histórico).', source: CF },
  { id: 'autorizado', term: 'Autorizado (dotação)', short: 'Valor que a lei orçamentária, com suas alterações, permite gastar em uma ação. É um teto, não um gasto.', source: L4320 },
  { id: 'empenho', term: 'Empenho', short: 'Ato que reserva parte da dotação para uma despesa específica e cria para o Estado a obrigação de pagar, se as condições forem cumpridas.', long: 'Empenhado não significa pago. Um empenho pode ser cancelado ou ficar pendente de um ano para outro.', source: L4320 },
  { id: 'liquidacao', term: 'Liquidação', short: 'Verificação, com base em documentos, de que o credor tem direito a receber — por exemplo, que o bem ou serviço contratado foi entregue.', source: L4320 },
  { id: 'pagamento', term: 'Pagamento', short: 'Saída efetiva do dinheiro para o credor ou beneficiário. Só ocorre depois da liquidação.', long: 'Pagamento comprova que o recurso saiu do caixa federal. Não comprova, sozinho, que a obra ou o serviço final chegou à população.', source: L4320 },
  { id: 'restos', term: 'Restos a pagar', short: 'Despesas empenhadas e não pagas até 31 de dezembro, que passam para os anos seguintes. Por isso o pagamento de uma emenda pode aparecer em outro exercício.', source: L4320 },
  { id: 'especial', term: 'Transferência especial', short: 'Modalidade de emenda individual em que o recurso é repassado diretamente ao estado ou município, sem convênio. Ficou conhecida como “emenda Pix”.', long: 'Nem toda emenda é transferência especial. Nessa modalidade, rastrear o uso final do dinheiro costuma exigir documentos do próprio ente que recebeu.', source: CF },
  { id: 'pagototal', term: 'Pago total', short: 'Soma dos campos Pago e Restos a pagar pagos da fonte, usada no RASTRO para comparar o total com os documentos de pagamento.', long: 'A igualdade numérica não comprova a divisão temporal dos campos. A comparação com os documentos depende do snapshot, da cobertura e da presença dos valores. Cada ficha informa se a conciliação confere, diverge ou está indisponível. As exceções exigem investigação.' },
  { id: 'documento', term: 'Documento de despesa', short: 'Registro oficial do SIAFI que formaliza uma etapa do gasto: nota de empenho, de liquidação ou ordem de pagamento, com data, valor e favorecido.', long: 'Uma emenda pode ter centenas de documentos. O RASTRO usa os documentos para conferir os totais da emenda — sem contá-la mais de uma vez.' },
  { id: 'aplicacao', term: 'Localidade de aplicação', short: 'Município onde o pagamento foi aplicado segundo o documento de despesa: para transferências a municípios e estados, é o local de quem recebeu; nos demais casos, a regionalização do gasto.', long: 'É um critério diferente da localidade registrada na emenda e não se soma a ela. Também não prova onde a obra ou o serviço foi entregue.' },
  { id: 'favorecido', term: 'Favorecido', short: 'Quem recebeu o pagamento: ente público, entidade, empresa ou pessoa. No RASTRO, pessoas físicas e empresários individuais aparecem como “omitido” (LGPD).' },
  { id: 'snapshot', term: 'Snapshot', short: 'Cópia exata de um arquivo oficial no dia em que foi baixado, guardada sem alterações e identificada por uma “impressão digital” (SHA-256). Permite refazer qualquer número do zero.' },
  { id: 'beneficiario', term: 'Beneficiário', short: 'Ente ou entidade que recebe o recurso segundo o registro. Não é necessariamente o lugar onde o serviço é prestado ou a obra é feita.' },
  { id: 'indeterminado', term: 'Destinação indeterminada', short: 'Registro em que os documentos não permitem identificar um município. No RASTRO, esses valores ficam separados — nunca são atribuídos à capital ou a outro município por conveniência.' },
];

export const glossaryById = Object.fromEntries(glossary.map(g => [g.id, g])) as Record<string, GlossaryEntry>;
