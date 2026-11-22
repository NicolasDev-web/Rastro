import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '../components/Ui';
import { ForaDoMapaArt } from '../components/Illustrations';

export const metadata: Metadata = { title: 'Página não encontrada | RASTRO' };

export default function NotFound() {
  return <div className="container page-space">
    <PageHero eyebrow="ERRO 404" title="Esta página saiu do mapa." description="O endereço não existe no RASTRO ou mudou de lugar. Confira se foi digitado certo ou comece por um destes caminhos." art={<ForaDoMapaArt />}>
      <ul className="not-found-links">
        <li><Link className="text-link" href="/">Início →</Link></li>
        <li><Link className="text-link" href="/mapa">Buscar a sua cidade →</Link></li>
        <li><Link className="text-link" href="/investigacao">Entender as emendas →</Link></li>
        <li><Link className="text-link" href="/contato">Avisar sobre um link quebrado →</Link></li>
      </ul>
    </PageHero>
  </div>;
}
