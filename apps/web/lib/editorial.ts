import type { ArtKey } from '../components/Illustrations';

// Pautas e peças do protótipo. Nenhuma está apurada: são propostas editoriais.
export type Story = { number: string; category: string; status: string; title: string; text: string; art: ArtKey; link: string };

export const stories: Story[] = [
  { number: '01', category: 'Entenda', status: 'Explicador · 19 nov 2026', title: 'O caminho do dinheiro', text: 'O que são emendas, como funcionam e por que a diferença entre destinar e pagar importa.', art: 'congresso', link: '/investigacao' },
  { number: '02', category: 'Pauta proposta', status: 'Ainda não apurada', title: 'A geografia das emendas', text: 'Uma investigação futura da distribuição territorial dos recursos federais com registros comparáveis.', art: 'sertao', link: '/mapa' },
  { number: '03', category: 'Pauta proposta', status: 'Ainda não apurada', title: 'Onde termina o registro público?', text: 'Como rastrear transferências e que evidências seriam necessárias para estudar seus resultados.', art: 'documentos', link: '/fluxos' },
];
