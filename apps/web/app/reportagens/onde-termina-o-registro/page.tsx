import type { Metadata } from 'next';
import Link from 'next/link';
import { MoneyFlow } from '../../../components/MoneyFlow';
import { InfoNote } from '../../../components/Ui';
import { Figure, FunilArt } from '../../../components/Illustrations';
import { GlossaryTip } from '../../../components/Glossary';
import { DataState } from '../../../components/States';
import { DATA_MODE, getDataset, getEmendas } from '../../../lib/dataset';
import { brl, formatDate } from '../../../lib/dataset-types';
import { execucaoDeclarada, type Emenda } from '../../../lib/fichas-types';
import { buildFluxo } from '../../../lib/fluxo';
import { getInvestigacao } from '../../../lib/investigacao';
import { funil, type Funil } from '../../../lib/reportagens';
import { stories } from '../../../lib/editorial';

export const metadata: Metadata = { title: 'Onde termina o registro público? | RASTRO' };

const n = (v: number) => v.toLocaleString('pt-BR');
const MINUSCULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
/** "MUNICIPIO DE SOBRAL" → "Município de Sobral" (só caixa; a grafia da fonte é mantida). */
const nomeProprio = (s: string) => s.toLocaleLowerCase('pt-BR').split(' ').map((w, i) => (i && MINUSCULAS.has(w) ? w : w.charAt(0).toLocaleUpperCase('pt-BR') + w.slice(1))).join(' ').replace(/^Municipio\b/, 'município').replace(/^Estado\b/, 'estado');
const story = stories.find(s => s.number === '03')!;
/** Emenda que abre a reportagem: transferência especial com execução declarada. Se sair do pacote, usa a primeira com execução. */
const EXEMPLO = '202537330007';

function Barras({ itens, total }: { itens: { rotulo: string; valor: number; nota?: string }[]; total: number }) {
  return <ol className="funil-barras">{itens.map(i => <li key={i.rotulo}>
    <div className="funil-rotulo"><strong>{n(i.valor)}</strong> {i.rotulo}{i.nota && <small>{i.nota}</small>}</div>
    <div className={i.valor ? 'funil-trilho' : 'funil-trilho is-vazio'} aria-hidden="true"><span style={{ width: `${(i.valor / total) * 100}%` }} /></div>
  </li>)}</ol>;
}

function Abertura({ e }: { e: Emenda }) {
  const plano = (e.transferegov?.planos_acao ?? []).find(execucaoDeclarada);
  const rel = plano?.relatorio;
  return <>
    <p>Em {e.ano}, uma emenda individual de {e.pago_total === null ? 'valor sem registro' : brl(e.pago_total)} foi paga {plano?.beneficiario ? `ao ${nomeProprio(plano.beneficiario)}` : 'a um município'} como transferência especial, a modalidade conhecida como “emenda Pix”. Até aí, o registro federal é completo: autor formal, documento de pagamento, data e quem recebeu.</p>
    {plano && <p>No Transferegov, o município cadastrou o plano de ação <strong>{plano.codigo}</strong>: {plano.objeto ?? 'objeto não informado'}. {rel ? <>No relatório de gestão de {formatDate(rel.data ?? undefined)}, ele declarou ter executado {rel.valor_executado === null ? 'valor sem registro' : brl(rel.valor_executado)}, pagos a {plano.fornecedores.length === 1 ? 'um fornecedor' : `${plano.fornecedores.length} fornecedores`}.</> : 'O ente declarou documentos de liquidação.'}</p>}
    <p>É aqui que a trilha pública termina. Nenhum arquivo aberto usado pelo RASTRO diz se a obra ficou pronta, se tem o tamanho planejado ou se está em uso. A declaração do ente não é vistoria.</p>
  </>;
}

function Corpo({ f, exemplo, asOf, snapshot }: { f: Funil; exemplo: Emenda | null; asOf?: string; snapshot?: string }) {
  const casos = getInvestigacao();
  const totalCasos = f.casos.explicados + f.casos.semCausa.length;
  const c = f.caminhos;
  return <>
    <div className="editorial-hero container"><span className="eyebrow">Reportagem {story.number} / {story.category}</span><h1>Onde termina o <em>registro público?</em></h1>
      <p>Seguimos as {n(f.fichas)} emendas com ficha no RASTRO até onde os documentos permitem. A trilha federal é boa até o pagamento. Depois dele, depende de quem recebeu o dinheiro, e quase sempre para antes da obra.</p>
      <div className="article-meta">{story.status} · dados da CGU extraídos em {formatDate(asOf)}{snapshot ? ` · snapshot ${snapshot}` : ''} · emendas de {f.anos[0]} a {f.anos[1]}</div></div>
    <div className="container"><Figure className="chapter-art"><FunilArt id="cap-funil" /></Figure></div>
    <div className="container narrative-layout">
      <aside className="narrative-toc"><span className="eyebrow">Nesta reportagem</span><a href="#exemplo">01 — Uma emenda</a><a href="#funil">02 — O funil</a><a href="#caminhos">03 — Três caminhos</a><a href="#perguntas">04 — Sem resposta</a><a href="#continuar">05 — Siga você</a><a href="#metodo">Método</a></aside>
      <article className="article-body">
        <section id="exemplo"><span className="section-no">01 / Uma emenda do começo ao fim</span><h2>O dinheiro sai. A obra não aparece.</h2>
          {exemplo ? <><Abertura e={exemplo} /><MoneyFlow flow={buildFluxo(exemplo, { demo: false, caso: casos[exemplo.code] })} />
            <p className="small muted"><Link href={`/emendas/${exemplo.code}`}>Ficha completa da emenda {exemplo.code}</Link>. O autor aparece pelo papel formal que o registro lhe dá; nada aqui avalia a escolha da emenda.</p></>
            : <DataState kind="empty" title="Nenhuma emenda com execução declarada no pacote">Sem execução declarada no Transferegov, não há exemplo completo a mostrar.</DataState>}
          <div className="glossary-row"><GlossaryTip id="especial" /><GlossaryTip id="pagamento" /></div>
        </section>

        <section id="funil"><span className="section-no">02 / O funil</span><h2>Cada etapa perde um pedaço da trilha.</h2>
          <p>Contamos, para cada uma das {n(f.fichas)} emendas, até onde vai o registro aberto. São contagens de emendas, não de dinheiro: cada barra mostra quantas chegam àquela etapa com documento.</p>
          <Barras total={f.fichas} itens={[
            { rotulo: 'emendas com ficha no RASTRO', valor: f.fichas },
            { rotulo: 'com autor formal identificado', valor: f.autor },
            { rotulo: 'com documento de pagamento', valor: f.comDocumentoPagamento, nota: `${n(f.pagamentoDocumentado)} conferem com o total da fonte ou têm a diferença explicada; ${n(f.pagamentoEmVerificacao)} seguem em verificação` },
            { rotulo: 'com favorecido no documento de pagamento', valor: f.favorecido },
            { rotulo: 'com plano de ação ou convênio no Transferegov', valor: f.registroDoUso, nota: 'é onde o ente diz o que pretende fazer com o dinheiro' },
            { rotulo: 'com execução declarada pelo ente', valor: f.execucaoDeclarada, nota: 'relatório de gestão ou documento de liquidação no Transferegov' },
            { rotulo: 'com prova pública de entrega', valor: f.entregaComprovada, nota: 'nenhum arquivo aberto usado traz vistoria ou atesto de que a obra ou o serviço chegou' },
          ]} />
          <p>As {n(f.semDocumento)} emendas sem documento de pagamento não são, por si, um problema: muitas ainda não foram pagas. O que importa é o salto entre a terceira e a quinta barra. O pagamento federal é bem registrado; o que o dinheiro virou, não.</p>
        </section>

        <section id="caminhos"><span className="section-no">03 / Três caminhos</span><h2>Cada modalidade para num lugar diferente.</h2>
          <div className="data-info-grid block-gap">
            <section className="data-method"><h3 className="block-title">Transferência especial</h3>
              <p><strong>{n(c.especial.emendas)} emendas.</strong> {c.especial.comRegistro === c.especial.emendas ? 'Todas' : n(c.especial.comRegistro)} com plano de ação no Transferegov; {n(c.especial.comExecucao)} com execução declarada.</p>
              <p>Pela Constituição, o dinheiro “pertencerá ao ente federado no ato da efetiva transferência financeira” (art. 166-A, § 2º). Daí em diante, o rastro é o que o município ou o estado declara no relatório de gestão.</p></section>
            <section className="data-method alt"><h3 className="block-title">Convênio ou contrato de repasse</h3>
              <p><strong>{n(c.convenio.emendas)} emendas.</strong> {n(c.convenio.comRegistro)} com proposta e metas no Transferegov.</p>
              <p>As metas dizem o que foi planejado. Os contratos, as licitações e os pagamentos feitos por quem executa o convênio não estão na API pública do Transferegov. A trilha aberta para no plano.</p></section>
          </div>
          <section className="credits-block"><h3 className="block-title">Demais transferências</h3>
            <p><strong>{n(c.demais.emendas)} emendas</strong>, a maior parte. Sem plano de ação nem convênio, o registro federal termina no próprio documento de pagamento.</p>
            <p>Boa parte é dinheiro da saúde repassado fundo a fundo. Entre todas as fichas, {n(f.fundoAFundo.emendas)} emendas têm pagamentos na modalidade “Fundo a Fundo”. Em {n(f.fundoAFundo.documentosFundoBanco)} dos {n(f.fundoAFundo.documentosFundo)} documentos dessa modalidade ({n(f.fundoAFundo.emendasBanco)} emendas), o favorecido registrado é o Banco do Brasil, não o fundo ou o órgão que vai gastar. O documento traz o município de aplicação; o uso do dinheiro fica nos sistemas da saúde e na prestação de contas do município, fontes que o RASTRO ainda não integrou.</p>
          </section>
        </section>

        <section id="perguntas"><span className="section-no">04 / O que ficou sem resposta</span><h2>{n(f.casos.semCausa.length)} diferenças sem explicação.</h2>
          <p>Investigamos {n(totalCasos)} emendas em que a soma dos documentos de pagamento não bate com o total da fonte, ou em que a fonte informa pagamento sem documento. {n(f.casos.explicados)} têm causa documentada, como transferência de saldo entre órgãos na reorganização dos ministérios de 2023. As outras {n(f.casos.semCausa.length)} continuam abertas.</p>
          <InfoNote>Diferença sem causa documentada é uma pergunta, não uma acusação. Pode ser atraso da fonte, documento fora do recorte ou erro de registro. Cada caso tem o próximo passo anotado.</InfoNote>
          <details className="mapa-tabela block-gap"><summary>Ver os {n(f.casos.semCausa.length)} casos em aberto</summary>
            <div className="table-wrap"><table className="data-table texto-fonte">
              <caption>Casos sem causa documentada, por ano da emenda. O texto é o achado registrado na investigação; nomes de favorecidos não aparecem.</caption>
              <thead><tr><th scope="col">Emenda</th><th scope="col">O que os dados mostram</th><th scope="col">Próximo passo</th></tr></thead>
              <tbody>{f.casos.semCausa.map(s => <tr key={s.code}><th scope="row"><Link href={`/emendas/${s.code}`}>{s.code}</Link><br /><small>{s.ano}</small></th><td>{s.achado}</td><td>{s.proxima ?? '—'}</td></tr>)}</tbody>
            </table></div>
          </details>
        </section>

        <section id="continuar"><span className="section-no">05 / Siga você</span><h2>A trilha continua fora dos arquivos abertos.</h2>
          <p>O que o RASTRO não alcança ainda pode ser pedido. Um roteiro para quem quer seguir uma emenda da própria cidade:</p>
          <ol className="guia-lista">
            <li><strong>Comece pela ficha.</strong> Busque o código em <Link href="/fluxos">Fluxos</Link> ou pela cidade no <Link href="/mapa">Mapa</Link>. Anote a modalidade, quem recebeu e o valor pago.</li>
            <li><strong>Transferência especial:</strong> a ficha traz o link do plano de ação e do relatório de gestão no Transferegov. Se o relatório não existe ou não diz o que foi feito, pergunte à prefeitura ou ao governo do estado.</li>
            <li><strong>Convênio:</strong> os contratos e as notas fiscais ficam com quem executou. Peça pela Lei de Acesso à Informação (<a href="https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm" target="_blank" rel="noopener noreferrer">Lei nº 12.527/2011</a>): o prazo de resposta é de 20 dias, prorrogáveis por mais 10. Para órgãos federais, o pedido vai pelo <a href="https://falabr.cgu.gov.br" target="_blank" rel="noopener noreferrer">Fala.BR</a>; para a prefeitura, pelo serviço de informação ao cidadão dela.</li>
            <li><strong>Saúde, fundo a fundo:</strong> o <a href="https://portalfns.saude.gov.br" target="_blank" rel="noopener noreferrer">Fundo Nacional de Saúde</a> mostra os repasses ao fundo municipal. O uso aparece no relatório anual de gestão da saúde, que passa pelo conselho municipal de saúde.</li>
            <li><strong>Contas da prefeitura:</strong> no Ceará, quem julga as contas dos municípios é o Tribunal de Contas do Estado (TCE-CE).</li>
            <li><strong>Achou algo?</strong> <Link href="/contato">Escreva para o RASTRO</Link>: a informação pode completar uma ficha ou explicar um dos casos em aberto.</li>
          </ol>
        </section>

        <section id="metodo"><span className="section-no">Método e limites</span><h2>Como contamos.</h2>
          <p>O universo são as {n(f.fichas)} fichas de emenda do RASTRO: emendas federais de {f.anos[0]} a {f.anos[1]} destinadas ao Ceará ou de autores eleitos pelo estado, do arquivo de emendas da CGU, com os documentos de despesa e o Transferegov ligados só por identificador oficial. Contamos emendas, não somamos valores de anos, etapas ou fontes diferentes.</p>
          <p>“Documento de pagamento” é a ordem de pagamento do SIAFI com o código da emenda. “Execução declarada” é o documento de liquidação ou o valor executado que o próprio ente registrou no relatório de gestão do Transferegov. A emenda é contada em “demais transferências” quando não é transferência especial e não tem convênio no arquivo da CGU.</p>
          <p>Nada nesta reportagem indica irregularidade. Mostra até onde o registro público vai, e onde ele para. <Link href="/dados">Fontes e metodologia →</Link></p>
        </section>
      </article>
    </div>
  </>;
}

export default function OndeTerminaORegistro() {
  const res = getEmendas();
  const ds = getDataset();
  if (DATA_MODE === 'demo' || !res.ok) {
    return <div className="container page-space">
      <div className="editorial-hero"><span className="eyebrow">Reportagem {story.number}</span><h1>Onde termina o <em>registro público?</em></h1></div>
      <Figure className="chapter-art"><FunilArt id="cap-funil" /></Figure>
      {DATA_MODE === 'demo'
        ? <DataState kind="demo" title="Sem números na demonstração">Esta reportagem usa só os dados oficiais publicados. Na demonstração eles não são carregados, e nenhum número fictício é mostrado no lugar.</DataState>
        : <DataState kind="error" title="Dados indisponíveis">{!res.ok ? res.error : ''}</DataState>}
    </div>;
  }
  const emendas = Object.values(res.data);
  const f = funil(emendas, getInvestigacao());
  const exemplo = res.data[EXEMPLO] ?? emendas.filter(e => (e.transferegov?.planos_acao ?? []).some(execucaoDeclarada)).sort((a, b) => b.code.localeCompare(a.code))[0] ?? null;
  return <Corpo f={f} exemplo={exemplo} asOf={ds.ok ? ds.data.asOf : undefined} snapshot={ds.ok ? ds.data.snapshot : undefined} />;
}
