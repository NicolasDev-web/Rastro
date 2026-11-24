import type { Metadata } from 'next';
import Link from 'next/link';
import { InfoNote, PrimaryLink } from '../../../components/Ui';
import { DoisMapasArt, Figure } from '../../../components/Illustrations';
import { GlossaryTip } from '../../../components/Glossary';
import { DataState } from '../../../components/States';
import { DATA_MODE, getDataset, getMunicipios } from '../../../lib/dataset';
import { compactBrl, formatDate, type Dataset } from '../../../lib/dataset-types';
import { capital, geografiaPorAno, pct, porHabitante, POPULACAO, reais } from '../../../lib/reportagens';
import { stories } from '../../../lib/editorial';

export const metadata: Metadata = { title: 'A geografia das emendas | RASTRO' };

const n = (v: number) => v.toLocaleString('pt-BR');
const story = stories.find(s => s.number === '02')!;
const lista = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs.at(-1)}`);
const MINUSCULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
/** "FUNDO ESTADUAL DE SAUDE - FES" → "Fundo Estadual de Saude" (só caixa; a grafia da fonte é mantida). */
const nomeOrgao = (s: string) => s.split(' - ')[0].toLocaleLowerCase('pt-BR').split(' ').map((w, i) => (i && MINUSCULAS.has(w) ? w : w.charAt(0).toLocaleUpperCase('pt-BR') + w.slice(1))).join(' ');

function Corpo({ data }: { data: Dataset }) {
  const anos = geografiaPorAno(data);
  const completos = anos.filter(a => !a.emExecucao);
  const ref = completos.at(-1) ?? anos.at(-1)!;
  const total = data.municipalities.length;
  const ph = completos.map(a => porHabitante(data, a.ano));
  const phRef = ph.at(-1)!;
  const cap = capital(data, ref.ano);
  const munCap = getMunicipios();
  const estaduaisNaCapital = munCap.ok ? (munCap.data['2304400']?.favorecidos ?? []).slice(0, 6).filter(f => /estad/i.test(f.natureza ?? '')).map(f => f.favorecido ?? '') : [];
  const faixaMaior = phRef.faixas.at(-1)!, faixaMenor = phRef.faixas[0];
  const sempre = ph.every(p => (p.faixas[0].mediana ?? 0) > (p.faixas.at(-1)!.mediana ?? Infinity));
  const loc = ref.localidade;
  const primeiro = anos[0];
  const pequenasRecebemMais = (faixaMenor.mediana ?? 0) > (faixaMaior.mediana ?? Infinity);
  const capAbaixo = cap.porHabitante !== null && phRef.mediana !== null && cap.porHabitante < phRef.mediana;
  return <>
    <div className="editorial-hero container"><span className="eyebrow">Reportagem {story.number} / {story.category}</span><h1>A geografia <em>das emendas</em></h1>
      <p>Em {ref.ano}, as emendas federais registraram município de destino em só {n(ref.municipiosLocalidade)} das {n(total)} cidades do Ceará. Os documentos de pagamento do mesmo ano mostram dinheiro aplicado em {n(ref.municipiosAplicacao)}. O mapa depende da pergunta que se faz ao dado.</p>
      <div className="article-meta">{story.status} · dados da CGU extraídos em {formatDate(data.asOf)}{data.snapshot ? ` · snapshot ${data.snapshot}` : ''} · população: IBGE, Censo {POPULACAO.ano}</div></div>
    <div className="container"><Figure className="chapter-art"><DoisMapasArt id="cap-dois-mapas" /></Figure></div>
    <div className="container narrative-layout">
      <aside className="narrative-toc"><span className="eyebrow">Nesta reportagem</span><a href="#dois-mapas">01 — Dois mapas</a><a href="#sem-cidade">02 — Sem cidade</a><a href="#por-habitante">03 — Por habitante</a><a href="#capital">04 — A capital</a><a href="#sem-registro">05 — Sem registro</a><a href="#metodo">Método</a></aside>
      <article className="article-body">
        <section id="dois-mapas"><span className="section-no">01 / Dois mapas do mesmo dinheiro</span><h2>Onde a emenda diz que vai, e onde o pagamento aparece.</h2>
          <p>Toda emenda tem uma <strong>localidade</strong>: o lugar que o próprio registro aponta como destino. Todo documento de pagamento tem um <strong>município de aplicação</strong>: onde o dinheiro foi aplicado segundo o SIAFI. São perguntas diferentes, e os dois números nunca se somam.</p>
          <div tabIndex={0} className="table-wrap"><table className="data-table">
            <caption>Municípios do Ceará com registro em cada critério, por ano da emenda (de {n(total)}). Pela localidade, conta o município com qualquer valor registrado; pela aplicação, o município com pagamento.</caption>
            <thead><tr><th scope="col">Ano</th><th scope="col" className="num">Pela localidade da emenda</th><th scope="col" className="num">Pela aplicação do pagamento</th></tr></thead>
            <tbody>{anos.map(a => <tr key={a.ano}><th scope="row">{a.ano}{a.emExecucao ? ' (em execução)' : ''}</th><td className="num">{n(a.municipiosLocalidade)}</td><td className="num">{n(a.municipiosAplicacao)}</td></tr>)}</tbody>
          </table></div>
          <p>{primeiro.ano !== ref.ano && primeiro.municipiosLocalidade > ref.municipiosLocalidade ? `Pela localidade, o número de cidades caiu de ${n(primeiro.municipiosLocalidade)} em ${primeiro.ano} para ${n(ref.municipiosLocalidade)} em ${ref.ano}, enquanto a aplicação seguiu cobrindo quase todo o estado. ` : ''}Quem olhasse só a localidade concluiria, errado, que quase nada chegou à maior parte das cidades. Por isso o <Link href="/mapa">mapa do RASTRO</Link> usa a aplicação do pagamento.</p>
          <div className="glossary-row"><GlossaryTip id="aplicacao" /><GlossaryTip id="indeterminado" /></div>
        </section>

        <section id="sem-cidade"><span className="section-no">02 / O dinheiro que nasce sem cidade</span><h2>{loc.varios * 2 > loc.total ? 'A maior parte é registrada para “vários municípios”.' : 'Parte do dinheiro é registrada sem cidade.'}</h2>
          <p>Em {ref.ano}, do pago total das emendas com localidade no Ceará ({compactBrl(loc.total)}), {pct(loc.varios, loc.total)} foi registrado como “vários municípios”, {pct(loc.estado, loc.total)} como aplicação no estado inteiro e só {pct(loc.municipal, loc.total)} com um município definido. “Vários municípios” não diz quanto foi para cada um: essa parte só ganha endereço quando o pagamento é feito.</p>
          <div tabIndex={0} className="table-wrap"><table className="data-table">
            <caption>Divisão do pago total (pago + restos a pagar pagos) pela localidade da emenda, em cada ano. As porcentagens são partes do total do próprio ano; anos não se somam.</caption>
            <thead><tr><th scope="col">Ano</th><th scope="col" className="num">Vários municípios</th><th scope="col" className="num">Estado inteiro</th><th scope="col" className="num">Um município</th><th scope="col" className="num">Pago total no ano</th></tr></thead>
            <tbody>{anos.map(a => <tr key={a.ano}><th scope="row">{a.ano}{a.emExecucao ? ' (em execução)' : ''}</th><td className="num">{pct(a.localidade.varios, a.localidade.total)}</td><td className="num">{pct(a.localidade.estado, a.localidade.total)}</td><td className="num">{pct(a.localidade.municipal, a.localidade.total)}</td><td className="num">{compactBrl(a.localidade.total)}</td></tr>)}</tbody>
          </table></div>
        </section>

        <section id="por-habitante"><span className="section-no">03 / Por habitante</span><h2>{pequenasRecebemMais ? 'Cidades pequenas recebem mais por pessoa.' : 'O valor por pessoa, pelo tamanho da cidade.'}</h2>
          <p>Dividimos o valor pago com aplicação em cada cidade pela população do Censo {POPULACAO.ano}. Em {ref.ano}, a cidade típica (a mediana) recebeu {reais(phRef.mediana)} por habitante. Entre as cidades com até 10 mil habitantes, a mediana foi {reais(faixaMenor.mediana)}; entre as com mais de 100 mil, {reais(faixaMaior.mediana)}.</p>
          <ol className="funil-barras">{phRef.faixas.map(f => <li key={f.rotulo}>
            <div className="funil-rotulo"><strong>{reais(f.mediana)}</strong> por habitante · {f.rotulo}<small>{n(f.municipios)} municípios com pagamento em {ref.ano} (mediana da faixa)</small></div>
            <div className="funil-trilho" aria-hidden="true"><span style={{ width: `${((f.mediana ?? 0) / Math.max(...phRef.faixas.map(x => x.mediana ?? 0))) * 100}%` }} /></div>
          </li>)}</ol>
          <p>{sempre ? 'O padrão se repete em todos os anos completos:' : 'Ano a ano:'}</p>
          <div tabIndex={0} className="table-wrap"><table className="data-table">
            <caption>Mediana do valor pago com aplicação no município, por habitante (reais), por faixa de população do Censo {POPULACAO.ano} e ano da emenda. Só entram municípios com pagamento no ano.</caption>
            <thead><tr><th scope="col">Faixa</th>{ph.map(p => <th key={p.ano} scope="col" className="num">{p.ano}</th>)}</tr></thead>
            <tbody>{phRef.faixas.map((f, i) => <tr key={f.rotulo}><th scope="row">{f.rotulo}</th>{ph.map(p => <td key={p.ano} className="num">{reais(p.faixas[i].mediana)}</td>)}</tr>)}</tbody>
          </table></div>
          <InfoNote><strong>Hipótese, não testada aqui:</strong> parte das emendas tem valores parecidos qualquer que seja o tamanho da cidade, e o mesmo valor pesa mais por habitante onde há menos gente. Os documentos de pagamento não dizem por que uma cidade recebeu mais que outra.</InfoNote>
          <p>Comparamos faixas, não cidades uma a uma. O valor por habitante não mede necessidade nem resultado, e não diz se a divisão é justa.</p>
        </section>

        <section id="capital"><span className="section-no">04 / A capital</span><h2>{capAbaixo ? `${cap.nome} fica abaixo, com uma ressalva.` : `${cap.nome}, com uma ressalva.`}</h2>
          <p>Com {n(cap.populacao)} habitantes, {cap.nome} teve {reais(cap.porHabitante)} por habitante em {ref.ano} pela aplicação do pagamento{capAbaixo ? ', abaixo' : ', diante'} da mediana do estado ({reais(phRef.mediana)}).</p>
          <p>Mas a capital é sede do governo estadual, e o pagamento a um órgão do estado aparece com aplicação em Fortaleza.{estaduaisNaCapital.length ? ` Nos registros de todos os anos, entre os maiores favorecidos com aplicação na capital estão ${lista(estaduaisNaCapital.map(nomeOrgao))}.` : ''} Parte desse dinheiro pode ser usada fora da cidade. O valor da capital mistura o que foi para a prefeitura com o que foi para o estado.</p>
        </section>

        <section id="sem-registro"><span className="section-no">05 / Sem registro</span><h2>Ausência não é zero.</h2>
          <p>{completos.some(a => a.semRegistro.length) ? <>Algumas cidades não aparecem em nenhum dos dois critérios em certos anos: {completos.filter(a => a.semRegistro.length).map(a => `${a.ano}: ${lista(a.semRegistro)}`).join('; ')}.</> : 'Todas as cidades aparecem em ao menos um critério em todos os anos completos.'} Isso quer dizer que nenhum registro aberto liga uma emenda daquele ano a elas, não que tenham recebido zero: o dinheiro pode ter chegado por emenda registrada para vários municípios e paga a um órgão de outra cidade.</p>
          <PrimaryLink href="/mapa">Procure a sua cidade no mapa</PrimaryLink>
        </section>

        <section id="metodo"><span className="section-no">Método e limites</span><h2>Como calculamos.</h2>
          <p>Localidade da emenda: pago total (pago + restos a pagar pagos) do arquivo de emendas da CGU, pelo código IBGE da localidade. Aplicação: soma dos documentos de pagamento da CGU com aquele município de aplicação, incluindo restos a pagar pagos. Os dois critérios ficam sempre separados. O ano é o da emenda; os pagamentos podem ser de anos seguintes. {anos.at(-1)?.emExecucao ? `${anos.at(-1)!.ano} ainda está em execução e fica fora das comparações por habitante.` : ''}</p>
          <p>População: Censo Demográfico {POPULACAO.ano} do IBGE (população residente), a mesma para todos os anos, baixada em {formatDate(POPULACAO.baixado_em)} com SHA-256 <code>{POPULACAO.sha256.slice(0, 12)}</code>. Município de aplicação não prova onde a obra ou o serviço foi entregue.</p>
          <p>Sem ranking de cidades nem de autores. <Link href="/dados">Fontes e metodologia →</Link></p>
        </section>
      </article>
    </div>
  </>;
}

export default function GeografiaDasEmendas() {
  const ds = getDataset();
  if (DATA_MODE === 'demo' || !ds.ok) {
    return <div className="container page-space">
      <div className="editorial-hero"><span className="eyebrow">Reportagem {story.number}</span><h1>A geografia <em>das emendas</em></h1></div>
      <Figure className="chapter-art"><DoisMapasArt id="cap-dois-mapas" /></Figure>
      {DATA_MODE === 'demo'
        ? <DataState kind="demo" title="Sem números na demonstração">Esta reportagem usa só os dados oficiais publicados. Na demonstração eles não são carregados, e nenhum número fictício é mostrado no lugar.</DataState>
        : <DataState kind="error" title="Dados indisponíveis">{!ds.ok ? ds.error : ''}</DataState>}
    </div>;
  }
  return <Corpo data={ds.data} />;
}
