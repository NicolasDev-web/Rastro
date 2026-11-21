import Link from 'next/link';
import { MoneyFlow } from '../../components/MoneyFlow';
import { ExplorerSection } from '../../components/ExplorerSection';
import { InfoNote, PrimaryLink } from '../../components/Ui';
import { CongressoArt, DocumentosArt, MapaArt, Figure } from '../../components/Illustrations';
import { GlossaryTip } from '../../components/Glossary';
import { DataState } from '../../components/States';
import { DATA_MODE } from '../../lib/dataset';

const types = [
  { type: 'RP 6', title: 'Individuais', detail: 'Apresentadas por deputados federais ou senadores, sujeitas às regras orçamentárias.' },
  { type: 'RP 7', title: 'Bancada estadual', detail: 'Apresentadas pelo conjunto de parlamentares de um estado. A autoria é coletiva: o valor não é repartido entre os integrantes.' },
  { type: 'RP 8', title: 'Comissão', detail: 'Apresentadas por comissões permanentes do Congresso.' },
  { type: 'RP 9', title: 'Relator-geral (histórico)', detail: 'Associada ao modelo conhecido como orçamento secreto, cujo formato anterior foi interrompido.' },
];

const steps = [
  { n: '01', name: 'Indicação', what: 'O parlamentar, a bancada ou a comissão apresenta a emenda e indica o destino.', where: 'Registro de autoria' },
  { n: '02', name: 'Autorização', what: 'Aprovada, a emenda vira dotação na lei orçamentária: um teto de gasto, não um gasto.', where: 'Valor “autorizado”' },
  { n: '03', name: 'Empenho', what: 'O governo reserva o dinheiro para uma despesa específica.', where: 'Nota de empenho' },
  { n: '04', name: 'Liquidação', what: 'Verifica-se, com documentos, que o credor tem direito a receber.', where: 'Registro de liquidação' },
  { n: '05', name: 'Pagamento', what: 'O dinheiro sai do caixa federal.', where: 'Ordem bancária' },
  { n: '06', name: 'Transferência', what: 'Quando o destino é um estado ou município, o pagamento chega à conta do ente.', where: 'Sistemas de transferências' },
  { n: '07', name: 'Entrega', what: 'A obra, o serviço ou a compra acontece no território.', where: 'Fora dos registros financeiros federais', off: true },
];

export default function Investigacao() {
  return <>
    <div className="editorial-hero container"><span className="eyebrow">A investigação / capítulo zero</span><h1>Quem decide para onde <em>vai o dinheiro?</em></h1><p>Um guia visual para entender como funcionam as emendas parlamentares e como acompanhar o que aconteceu depois da indicação.</p><div className="article-meta">Explicador introdutório · sem resultados quantitativos apurados · 19 nov 2026</div></div>
    <div className="container"><Figure className="chapter-art"><CongressoArt id="cap-congresso" /></Figure></div>

    <div className="container narrative-layout">
      <aside className="narrative-toc"><span className="eyebrow">Nesta reportagem</span><a href="#origem">01 — O que é</a><a href="#tipos">02 — Modalidades</a><a href="#etapas">03 — Etapas</a><a href="#ceara">04 — Recorte Ceará</a><a href="#limites">05 — O que dá para saber</a></aside>
      <article className="article-body">

        <section id="origem"><span className="section-no">01 / O que é</span><h2>Uma parte do orçamento tem seu destino alterado pelo Legislativo.</h2>
          <p>Emendas parlamentares são instrumentos para propor modificações na lei orçamentária. Elas podem financiar políticas e serviços públicos, mas uma indicação não significa que o recurso tenha sido pago, muito menos que o resultado final tenha sido entregue.</p>
          <p>Esta publicação pretende apresentar os registros oficiais de maneira compreensível, sem presumir que toda emenda seja problemática — nem que a publicação de um valor seja suficiente para comprovar sua aplicação.</p>
          <GlossaryTip id="emenda" />
        </section>

        <section id="tipos"><span className="section-no">02 / Quais são</span><h2>Nem todas as emendas seguem o mesmo caminho.</h2>
          <div className="type-list">{types.map(t => <div key={t.type}><div className="type-code">{t.type}</div><div><h3>{t.title}</h3><p>{t.detail}</p></div></div>)}</div>
          <InfoNote>Emendas individuais na modalidade de transferências especiais são comumente chamadas de “emendas Pix”. Isso não significa que todas as emendas sejam transferências especiais.</InfoNote>
          <div className="glossary-row"><GlossaryTip id="rp" /><GlossaryTip id="especial" /></div>
        </section>

        <section id="etapas"><span className="section-no">03 / O caminho</span><h2>Destinar não é pagar. Pagar não é entregar.</h2>
          <p>Entre a indicação e a obra pronta, o dinheiro passa por etapas diferentes, registradas em documentos diferentes. Nem todas se aplicam do mesmo modo a cada modalidade — e nenhuma substitui a outra. Por isso o RASTRO nunca soma valores de etapas distintas.</p>
          <ol className="stage-ladder">{steps.map(s => <li key={s.n} className={s.off ? 'is-off' : undefined}>
            <span className="stage-n">{s.n}</span>
            <div><strong>{s.name}</strong><p>{s.what}</p><span className="stage-where">{s.where}</span></div>
          </li>)}</ol>
          <div className="glossary-row"><GlossaryTip id="empenho" /><GlossaryTip id="liquidacao" /><GlossaryTip id="pagamento" /><GlossaryTip id="restos" /></div>
        </section>

        <section id="ceara"><span className="section-no">04 / O recorte Ceará</span><h2>Onde o município aparece?</h2>
          <p>Nem todo recurso “para o Ceará” tem um município de destino nos documentos. Parte é registrada como aplicação no estado inteiro; parte cobre vários municípios sem dizer quanto foi para cada um. Atribuir esses valores à capital — ou a qualquer cidade — por conveniência produziria um mapa falso.</p>
          <Figure><MapaArt id="cap-mapa" /></Figure>
          <div className="destino-grid">
            <div className="destino destino-municipio"><span className="tiny-code">MUNICÍPIO</span><strong>Beneficiário municipal identificado</strong><p>Entra na ficha da cidade — lembrando que o beneficiário não é necessariamente o local da entrega.</p></div>
            <div className="destino destino-estado"><span className="tiny-code">ESTADUAL</span><strong>Aplicação no estado inteiro</strong><p>Não identifica quem recebeu. Fica separada e só é ligada a um município com documento que comprove o vínculo.</p></div>
            <div className="destino destino-indeterminado"><span className="tiny-code">VÁRIOS MUNICÍPIOS</span><strong>Mais de um município, sem repartição</strong><p>Permanece visível como lacuna, nunca distribuído por estimativa.</p></div>
          </div>
          {DATA_MODE === 'demo'
            ? <DataState kind="partial_coverage" title="Distribuição real ainda não publicada">Os totais do Ceará por destino só aparecem depois da ingestão e conciliação das fontes oficiais (backlog RAS-014) e da revisão editorial.</DataState>
            : <InfoNote>Os valores reais de cada destino, municipal, estadual e de vários municípios, estão no <Link href="/mapa">explorador e na tabela do mapa</Link>, sempre separados.</InfoNote>}
        </section>

        <section id="limites"><span className="section-no">05 / O que podemos comprovar</span><h2>A documentação define a força de cada conclusão.</h2>
          <p>Alguns registros permitem identificar o autor formal e o beneficiário. Outros exigem cruzar sistemas, solicitar documentos adicionais ou realizar apuração de campo para descobrir o destino efetivo dos recursos. Uma lacuna de rastreabilidade deve ser descrita como limitação dos documentos, não como prova de desvio.</p>
          <div className="know-grid">
            <div className="know know-yes"><h3>Os registros federais mostram</h3><ul><li>Autoria formal e modalidade da emenda</li><li>Valores autorizados, empenhados e pagos</li><li>Beneficiário registrado e datas</li><li>Ligações por código ou documento</li></ul></div>
            <div className="know know-no"><h3>Os registros sozinhos não mostram</h3><ul><li>Se a obra ou o serviço foi entregue</li><li>Qualidade ou preço justo do que foi comprado</li><li>Onde exatamente o dinheiro foi usado no território</li><li>Intenção de quem indicou</li></ul></div>
          </div>
          <p className="pull">Pagamento comprova que o dinheiro saiu. Não comprova que a obra chegou.</p>
          <MoneyFlow />
          <Figure><DocumentosArt id="cap-documentos" /></Figure>
          <h2 id="sua-cidade">Comece por onde você mora.</h2>
          <p>{DATA_MODE === 'demo' ? 'Escolha um município da demonstração para ver como a ficha funcionaria antes da entrada dos dados reais auditados.' : 'Escolha seu município para ver quanto foi empenhado e pago em emendas registradas para ele.'}</p>
          <ExplorerSection compact />
          <div className="block-gap"><PrimaryLink href="/mapa">Abrir o explorador completo</PrimaryLink></div>
          <p className="small muted block-gap">Fontes de partida: <a href="https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares" target="_blank" rel="noreferrer">CGU</a> e <a href="https://api-publica.transferegov.gestao.gov.br/" target="_blank" rel="noreferrer">Transferegov</a>. Termos no <Link href="/glossario">glossário</Link>. Consulte a metodologia antes de comparar valores.</p>
        </section>
      </article>
    </div>
  </>;
}
