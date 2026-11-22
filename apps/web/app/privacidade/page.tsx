import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero, InfoNote } from '../../components/Ui';
import { PrivacidadeArt } from '../../components/Illustrations';

export const metadata: Metadata = { title: 'Privacidade | RASTRO' };
const EMAIL = 'nicolasxavier445@gmail.com';
const ATUALIZADA = '22/11/2026';

export default function Privacidade() {
  return <div className="container page-space">
    <PageHero eyebrow="PRIVACIDADE E DADOS PESSOAIS" title="O que o RASTRO guarda, e o que não guarda." description="Como o site trata quem visita, quem escreve e as pessoas que aparecem nos arquivos oficiais." art={<PrivacidadeArt />} />
    <InfoNote>Este site não tem cadastro, login, formulário, cookies próprios, anúncios nem ferramenta de medição de audiência. As páginas e as fontes de letra são servidas pelo próprio site, sem chamar serviços de terceiros no seu navegador.</InfoNote>
    <div className="data-info-grid block-gap">
      <section className="data-method"><h2 className="block-title">Quem visita</h2>
        <p>O site é hospedado na Vercel. Como qualquer servidor, ela registra dados técnicos de cada acesso, como endereço IP, navegador e página pedida, para entregar e proteger o serviço, segundo a <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">política de privacidade da Vercel</a>.</p>
        <p>O RASTRO não usa esses registros para identificar quem visita, não cruza essas informações com outras fontes e não as repassa a ninguém.</p>
      </section>
      <section className="data-method alt"><h2 className="block-title">Quem escreve</h2>
        <p>Quem manda um e-mail para {EMAIL} compartilha o próprio endereço e o que escreveu. Usamos isso só para responder e, quando for o caso, registrar uma correção. Não publicamos o nome de quem escreve sem autorização.</p>
        <p>O e-mail do projeto é uma conta do Gmail; as mensagens também seguem a política do Google. Elas ficam guardadas enquanto servirem à resposta ou ao registro da correção. Você pode pedir que a sua seja apagada.</p>
      </section>
    </div>
    <section className="credits-block block-gap"><h2 className="block-title">Pessoas nos arquivos oficiais</h2>
      <p>Os arquivos públicos da CGU, do Transferegov e do Ceará Transparente trazem nomes de parlamentares, órgãos, entidades e empresas. Parlamentares aparecem pelo papel público de autor de emendas. Retratos oficiais, quando aparecem, vêm da Câmara, do Senado ou da Assembleia Legislativa, com crédito.</p>
      <p>Quando quem recebeu o dinheiro é pessoa física ou empresário individual (MEI), o nome e o documento aparecem como “omitido” em todas as páginas e nos arquivos CSV. O RASTRO não publica CPF.</p>
      <p>Se você aparece em algum registro e acha que ele está errado ou expõe mais do que deveria, escreva. Não podemos mudar o arquivo da fonte oficial, mas revemos como ele aparece aqui e registramos a mudança na <Link href="/correcoes">página de correções</Link>.</p>
    </section>
    <div className="data-info-grid block-gap">
      <section className="data-method"><h2 className="block-title">Seus direitos</h2>
        <p>A Lei Geral de Proteção de Dados (<a href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm" target="_blank" rel="noopener noreferrer">Lei nº 13.709/2018</a>, art. 18) garante, entre outros, o direito de saber se há dados seus aqui, de pedir acesso, correção e a eliminação do que for desnecessário.</p>
        <p>Para qualquer pedido, escreva para <a href={`mailto:${EMAIL}`}>{EMAIL}</a> dizendo a página e o registro.</p>
      </section>
      <section className="data-method alt"><h2 className="block-title">Quem responde</h2>
        <p>O mantenedor do RASTRO, um cidadão que conduz o projeto de forma independente, sem empresa, partido ou governo por trás.</p>
        <p className="small muted">Política atualizada em {ATUALIZADA}. Mudanças nesta página ficam registradas no histórico do projeto.</p>
      </section>
    </div>
  </div>;
}
