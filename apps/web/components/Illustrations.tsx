/**
 * Biblioteca de ilustrações editoriais do RASTRO.
 *
 * Linguagem visual: colagem de papel recortado + impressão em risografia
 * (cores chapadas, retícula de meio-tom, grão de papel e bordas levemente
 * irregulares). Tudo é vetor desenhado em código: não há fotografia nem
 * imagem gerada por IA. As cenas são METÁFORAS esquemáticas — não retratam
 * lugares, pessoas ou fatos específicos e não servem como prova visual.
 */
import type { ReactNode } from 'react';

export const C = {
  ink: '#151515',
  paper: '#F4EFE6',
  paper2: '#E8DFCC',
  cobalt: '#2E3BD6',
  barro: '#C2461E',
  sol: '#F2B33D',
  mata: '#2F6B4F',
  mataLight: '#5C9277',
  rosa: '#EE8FA6',
};

/* ---------- Infra comum ---------- */

function Defs({ id }: { id: string }) {
  return (
    <defs>
      {/* grão de papel: pontos escuros esparsos sobre a cena */}
      <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} seed={7} stitchTiles="stitch" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.08  0 0 0 0 0.07  0 0 0 0 0.06  1.7 0 0 0 -0.72" />
      </filter>
      {/* borda de papel recortado à mão */}
      <filter id={`${id}-rough`} x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={3} result="t" />
        <feDisplacementMap in="SourceGraphic" in2="t" scale={5} xChannelSelector="R" yChannelSelector="G" />
      </filter>
      {/* retícula de meio-tom */}
      <pattern id={`${id}-dots`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <circle cx="3.5" cy="3.5" r="1.5" fill={C.ink} />
      </pattern>
      <pattern id={`${id}-dots-lg`} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <circle cx="6" cy="6" r="2.6" fill={C.ink} />
      </pattern>
      <pattern id={`${id}-dots-paper`} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
        <circle cx="4.5" cy="4.5" r="1.6" fill={C.paper} />
      </pattern>
      <pattern id={`${id}-floors`} width="8" height="7" patternUnits="userSpaceOnUse">
        <rect width="8" height="2" fill={C.ink} />
      </pattern>
    </defs>
  );
}

function Frame({ id, w = 800, h = 600, label, round, children }: { id: string; w?: number; h?: number; label: string; round?: { cx: number; cy: number; r: number }; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} className="art-svg" preserveAspectRatio="xMidYMid slice">
      <Defs id={id} />
      {round && <clipPath id={`${id}-clip`}><circle cx={round.cx} cy={round.cy} r={round.r} /></clipPath>}
      {children}
      <rect width={w} height={h} filter={`url(#${id}-grain)`} opacity={0.6} pointerEvents="none" clipPath={round ? `url(#${id}-clip)` : undefined} />
    </svg>
  );
}

/* ---------- Peças reutilizáveis ---------- */

type DocProps = { x: number; y: number; w?: number; h?: number; rot?: number; stamp?: string; fill?: string; mark?: boolean };
function Doc({ x, y, w = 60, h = 78, rot = 0, stamp, fill = C.paper, mark = false }: DocProps) {
  const l = -w / 2, t = -h / 2, px = w * 0.14;
  const rows = [0.34, 0.48, 0.62, 0.76];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={l + 4} y={t + 5} width={w} height={h} fill={C.ink} />
      <rect x={l} y={t} width={w} height={h} fill={fill} stroke={C.ink} strokeWidth={2.5} />
      <rect x={l + px} y={t + h * 0.12} width={w * 0.46} height={Math.max(3, h * 0.07)} fill={C.ink} />
      {mark && <rect x={l + px - 2} y={t + h * 0.48 - h * 0.05} width={w * 0.66} height={h * 0.1} fill={C.sol} />}
      {rows.map(r => (
        <line key={r} x1={l + px} x2={l + w - px - (r > 0.7 ? w * 0.3 : 0)} y1={t + h * r} y2={t + h * r} stroke={C.ink} strokeWidth={1.6} />
      ))}
      {stamp && <circle cx={l + w * 0.74} cy={t + h * 0.8} r={w * 0.13} fill="none" stroke={stamp} strokeWidth={2.5} />}
    </g>
  );
}

/** Silhueta esquemática de um edifício legislativo modernista (cúpula, torres e cuia). */
function Congresso({ x, y, s = 1, id }: { x: number; y: number; s?: number; id: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round">
      <rect x={-30} y={-190} width={26} height={190} fill={C.paper} />
      <rect x={4} y={-190} width={26} height={190} fill={C.paper} />
      <rect x={-30} y={-186} width={26} height={182} fill={`url(#${id}-floors)`} stroke="none" opacity={0.3} />
      <rect x={4} y={-186} width={26} height={182} fill={`url(#${id}-floors)`} stroke="none" opacity={0.3} />
      <rect x={-4} y={-122} width={8} height={12} fill={C.paper} />
      <path d="M-140 0 Q-140 -50 -95 -50 Q-50 -50 -50 0Z" fill={C.paper} />
      <path d="M-95 -50 Q-50 -50 -50 0 H-95Z" fill={`url(#${id}-dots)`} stroke="none" opacity={0.5} />
      <path d="M42 -42 L148 -42 Q132 0 95 0 Q58 0 42 -42Z" fill={C.paper} />
      <path d="M95 -42 L148 -42 Q132 0 95 0Z" fill={`url(#${id}-dots)`} stroke="none" opacity={0.5} />
      <rect x={-160} y={0} width={320} height={10} fill={C.paper} />
    </g>
  );
}

function Lupa({ cx, cy, r, angle = 45, len = 90 }: { cx: number; cy: number; r: number; angle?: number; len?: number }) {
  const a = (angle * Math.PI) / 180;
  return (
    <g>
      <line x1={cx + Math.cos(a) * (r + 4)} y1={cy + Math.sin(a) * (r + 4)} x2={cx + Math.cos(a) * (r + len)} y2={cy + Math.sin(a) * (r + len)} stroke={C.ink} strokeWidth={r * 0.32} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r} fill={C.paper} fillOpacity={0.2} stroke={C.ink} strokeWidth={r * 0.18} />
      <path d={`M${cx - r * 0.58} ${cy - r * 0.12} A${r * 0.6} ${r * 0.6} 0 0 1 ${cx - r * 0.12} ${cy - r * 0.58}`} stroke={C.paper} strokeWidth={r * 0.08} fill="none" strokeLinecap="round" />
    </g>
  );
}

function Coin({ x, y, r = 13 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={C.sol} stroke={C.ink} strokeWidth={2.5} />
      <text x={x} y={y + r * 0.3} textAnchor="middle" fontSize={r * 0.82} fill={C.ink}>R$</text>
    </g>
  );
}

function Tag({ x, y, text, bg = C.ink, fg = C.paper }: { x: number; y: number; text: string; bg?: string; fg?: string }) {
  const w = text.length * 7.4 + 16;
  return (
    <g>
      <rect x={x - w / 2} y={y - 11} width={w} height={22} fill={bg} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fill={fg} letterSpacing="0.06em">{text}</text>
    </g>
  );
}

function Palm({ x, y, h }: { x: number; y: number; h: number }) {
  const tx = x + 4, ty = y - h, L = h * 0.42;
  const angles = [-175, -150, -125, -100, -78, -55, -30, -5];
  return (
    <g stroke={C.ink} strokeLinecap="round" fill="none">
      <path d={`M${x} ${y} Q${x - 3} ${y - h / 2} ${tx} ${ty}`} strokeWidth={3.5} />
      {angles.map(deg => {
        const a = (deg * Math.PI) / 180;
        const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.8 + L * 0.25;
        return <path key={deg} d={`M${tx} ${ty} Q${tx + Math.cos(a) * L * 0.5} ${ty + Math.sin(a) * L * 0.6 - 6} ${ex} ${ey}`} strokeWidth={2.5} />;
      })}
    </g>
  );
}

/* ---------- Cenas ---------- */

/** O percurso de uma emenda: do Legislativo à cidade, passando por documentos. */
export function CaminhoArt({ id = 'caminho' }: { id?: string }) {
  return (
    <Frame id={id} w={800} h={640} label="Ilustração em colagem: uma trilha pontilhada sai de um edifício legislativo e atravessa três documentos — indicação, empenho e pagamento — até uma pequena cidade com igreja e caixa d'água. Uma lupa amplia o documento do meio.">
      <rect width={800} height={640} fill={C.cobalt} />
      <g filter={`url(#${id}-rough)`}>
        <circle cx={640} cy={140} r={100} fill={C.sol} />
        <circle cx={640} cy={140} r={100} fill={`url(#${id}-dots)`} opacity={0.16} />
        <rect x={70} y={108} width={170} height={18} rx={9} fill={C.paper} />
        <rect x={125} y={138} width={115} height={14} rx={7} fill={C.paper} />
        <rect x={440} y={250} width={140} height={14} rx={7} fill={C.paper} opacity={0.9} />
        <path d="M0 405 C110 370 210 392 330 378 C470 360 570 392 800 362 L800 640 L0 640Z" fill={C.paper2} />
        <Congresso x={205} y={398} s={0.82} id={id} />
        <path d="M0 470 C140 448 260 476 400 462 C560 446 660 474 800 452 L800 640 L0 640Z" fill={C.barro} />
        <path d="M0 470 C140 448 260 476 400 462 C560 446 660 474 800 452 L800 640 L0 640Z" fill={`url(#${id}-dots)`} opacity={0.18} />

        {/* cidade */}
        <g stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round">
          <rect x={548} y={420} width={56} height={44} fill={C.paper} />
          <polygon points="542,422 576,396 610,422" fill={C.ink} />
          <rect x={618} y={394} width={70} height={70} fill={C.paper} />
          <polygon points="612,396 653,364 694,396" fill={C.ink} />
          <rect x={636} y={320} width={34} height={76} fill={C.paper} />
          <polygon points="632,322 653,288 674,322" fill={C.ink} />
          <line x1={653} y1={288} x2={653} y2={268} />
          <line x1={645} y1={277} x2={661} y2={277} />
          <path d="M643 464 V442 Q653 430 663 442 V464Z" fill={C.ink} />
          <rect x={647} y={336} width={12} height={16} fill={C.ink} />
          <rect x={700} y={426} width={44} height={38} fill={C.paper} />
          <polygon points="695,428 722,406 749,428" fill={C.ink} />
          <line x1={758} y1={462} x2={764} y2={402} />
          <line x1={786} y1={462} x2={780} y2={402} />
          <rect x={752} y={372} width={40} height={30} rx={3} fill={C.paper} />
        </g>

        {/* rastro */}
        <path d="M250 402 C330 420 300 470 360 500 C430 535 520 520 560 490 C590 468 610 470 640 466" stroke={C.ink} strokeWidth={6} strokeDasharray="1 14" strokeLinecap="round" fill="none" />
        <Coin x={300} y={432} />
        <Coin x={522} y={520} r={11} />
        <Doc x={330} y={520} rot={-8} stamp={C.barro} />
        <Doc x={590} y={515} w={52} h={68} rot={9} />
        <Lupa cx={450} cy={545} r={62} angle={48} len={110} />
        <Doc x={450} y={545} w={58} h={74} rot={5} stamp={C.cobalt} mark />
      </g>
      <Tag x={330} y={584} text="INDICAÇÃO" />
      <Tag x={450} y={624} text="EMPENHO" bg={C.sol} fg={C.ink} />
      <Tag x={600} y={570} text="PAGAMENTO" />
    </Frame>
  );
}

/** O interior: estrada, mandacaru, carnaúbas e uma placa — "além dos grandes centros". */
export function SertaoArt({ id = 'sertao' }: { id?: string }) {
  const dashes = [[360, 368], [380, 394], [410, 432], [455, 490], [520, 575]];
  const hw = (y: number) => 0.6 + (y - 352) * 0.014;
  return (
    <Frame id={id} label="Ilustração em colagem: estrada de terra atravessa o interior sob um sol grande; à direita, um mandacaru; ao fundo, carnaúbas e casas pequenas; à esquerda, uma placa de madeira diz 'Ceará · 184 municípios'.">
      <rect width={800} height={600} fill={C.sol} />
      <g filter={`url(#${id}-rough)`}>
        <circle cx={540} cy={190} r={120} fill={C.barro} />
        <circle cx={540} cy={190} r={120} fill={`url(#${id}-dots-lg)`} opacity={0.18} />
        <path d="M150 118 q10 -10 20 0 q10 -10 20 0" stroke={C.ink} strokeWidth={3} fill="none" strokeLinecap="round" />
        <path d="M222 86 q7 -7 14 0 q7 -7 14 0" stroke={C.ink} strokeWidth={3} fill="none" strokeLinecap="round" />
        <path d="M0 360 C150 345 280 352 400 350 C540 348 650 340 800 352 L800 600 L0 600Z" fill={C.paper2} />
        <Palm x={86} y={356} h={72} />
        <Palm x={128} y={354} h={52} />
        <Palm x={730} y={350} h={62} />
        <g stroke={C.ink} strokeWidth={2} strokeLinejoin="round">
          <rect x={450} y={334} width={26} height={18} fill={C.paper} />
          <polygon points="447,336 463,324 479,336" fill={C.barro} />
          <rect x={486} y={338} width={20} height={14} fill={C.paper} />
          <polygon points="483,340 496,330 509,340" fill={C.barro} />
        </g>
        <path d="M0 380 C200 370 600 372 800 380 L800 600 L0 600Z" fill="#D46A33" />
        <path d="M0 380 C200 370 600 372 800 380 L800 600 L0 600Z" fill={`url(#${id}-dots)`} opacity={0.2} />
        <polygon points="394,352 406,352 560,600 240,600" fill={C.ink} />
        {dashes.map(([a, b]) => (
          <polygon key={a} points={`${400 - hw(a)},${a} ${400 + hw(a)},${a} ${400 + hw(b)},${b} ${400 - hw(b)},${b}`} fill={C.sol} />
        ))}

        {/* mandacaru: contornos primeiro, preenchimentos depois = silhueta única */}
        <g transform="translate(640 232)">
          {[
            { x: -34, y: 0, w: 68, h: 380, r: 34 }, { x: -96, y: 140, w: 70, h: 36, r: 18 }, { x: -96, y: 40, w: 36, h: 136, r: 18 },
            { x: 26, y: 200, w: 60, h: 34, r: 17 }, { x: 52, y: 90, w: 34, h: 144, r: 17 },
          ].map((p, i) => <rect key={`o${i}`} x={p.x} y={p.y} width={p.w} height={p.h} rx={p.r} fill={C.ink} stroke={C.ink} strokeWidth={7} />)}
          {[
            { x: -34, y: 0, w: 68, h: 380, r: 34 }, { x: -96, y: 140, w: 70, h: 36, r: 18 }, { x: -96, y: 40, w: 36, h: 136, r: 18 },
            { x: 26, y: 200, w: 60, h: 34, r: 17 }, { x: 52, y: 90, w: 34, h: 144, r: 17 },
          ].map((p, i) => <rect key={`f${i}`} x={p.x} y={p.y} width={p.w} height={p.h} rx={p.r} fill={C.mata} />)}
          <g stroke={C.mataLight} strokeWidth={3} strokeLinecap="round">
            <line x1={-12} y1={22} x2={-12} y2={370} /><line x1={12} y1={22} x2={12} y2={370} />
            <line x1={-78} y1={58} x2={-78} y2={150} /><line x1={69} y1={106} x2={69} y2={210} />
          </g>
          <rect x={8} y={6} width={26} height={374} rx={13} fill={`url(#${id}-dots)`} opacity={0.35} />
          <circle cx={0} cy={-2} r={11} fill={C.rosa} stroke={C.ink} strokeWidth={2.5} />
        </g>

        {/* placa */}
        <rect x={150} y={410} width={11} height={200} fill={C.ink} />
        <g transform="rotate(-4 160 420)">
          <polygon points="56,396 246,396 268,419 246,442 56,442" fill={C.ink} transform="translate(4 5)" />
          <polygon points="56,396 246,396 268,419 246,442 56,442" fill={C.paper} stroke={C.ink} strokeWidth={3} />
        </g>
      </g>
      <text x={158} y={424} textAnchor="middle" fontSize={12} fill={C.ink} letterSpacing="0.04em" transform="rotate(-4 160 420)">CEARÁ · 184 MUNICÍPIOS</text>
    </Frame>
  );
}

/** Documentos que saem do edifício legislativo, ligados por um rastro. */
export function CongressoArt({ id = 'congresso' }: { id?: string }) {
  const papers: [number, number, number, number][] = [
    [470, 165, -14, 50], [545, 108, 10, 56], [625, 158, -20, 46], [700, 92, 16, 52],
    [330, 120, 12, 50], [252, 166, -10, 44], [176, 100, 8, 54],
  ];
  return (
    <Frame id={id} label="Ilustração em colagem: um edifício legislativo modernista, com cúpula, cuia e duas torres, e folhas de documentos voando a partir dele, ligadas por uma linha pontilhada.">
      <rect width={800} height={600} fill={C.barro} />
      <g filter={`url(#${id}-rough)`}>
        <circle cx={400} cy={330} r={215} fill={C.rosa} />
        <circle cx={400} cy={330} r={215} fill={`url(#${id}-dots-lg)`} opacity={0.12} />
        <path d="M176 100 C220 150 240 170 252 166 C290 150 300 120 330 120 C380 120 420 170 470 165 C510 160 520 110 545 108 C590 104 600 160 625 158 C660 156 670 100 700 92" stroke={C.ink} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" fill="none" />
        {papers.map(([x, y, r, w], i) => <Doc key={i} x={x} y={y} w={w} h={w * 1.3} rot={r} stamp={i % 3 === 0 ? C.cobalt : undefined} mark={i === 2} />)}
        <rect x={0} y={535} width={800} height={65} fill={C.ink} />
        <g stroke={C.paper} strokeWidth={2} opacity={0.5}>
          <line x1={0} y1={560} x2={800} y2={560} /><line x1={0} y1={582} x2={800} y2={582} />
        </g>
        <Congresso x={400} y={525} s={1.45} id={id} />
      </g>
    </Frame>
  );
}

/** Mesa de apuração: pasta, documento com trecho marcado, carimbo, clipe, lupa e moedas. */
export function DocumentosArt({ id = 'documentos' }: { id?: string }) {
  const lines: [number, number][] = [[250, 520], [275, 540], [300, 500], [325, 530], [350, 545], [375, 470], [400, 520], [425, 430]];
  return (
    <Frame id={id} label="Ilustração em colagem: sobre uma pasta azul, um documento com uma linha marcada em amarelo, um carimbo circular escrito 'fonte oficial', um clipe e uma lupa; ao lado, uma pilha de moedas.">
      <rect width={800} height={600} fill={C.paper2} />
      <rect width={800} height={600} fill={`url(#${id}-dots)`} opacity={0.08} />
      <g filter={`url(#${id}-rough)`}>
        <g transform="rotate(-6 400 330)" stroke={C.ink} strokeWidth={3}>
          <rect x={160} y={128} width={150} height={40} rx={6} fill={C.cobalt} />
          <rect x={160} y={150} width={500} height={370} fill={C.cobalt} />
          <rect x={160} y={150} width={500} height={370} fill={`url(#${id}-dots-paper)`} stroke="none" opacity={0.25} />
        </g>
        <g transform="rotate(3 400 330)">
          <rect x={206} y={176} width={380} height={320} fill={C.ink} />
          <rect x={200} y={170} width={380} height={320} fill={C.paper} stroke={C.ink} strokeWidth={3} />
          <rect x={230} y={200} width={170} height={16} fill={C.ink} />
          <rect x={226} y={315} width={290} height={20} fill={C.sol} />
          {lines.map(([y, x2]) => <line key={y} x1={230} x2={x2} y1={y} y2={y} stroke={C.ink} strokeWidth={2.5} />)}
          <path d="M262 150 V212 Q262 228 278 228 Q294 228 294 212 V160 Q294 150 285 150 Q276 150 276 160 V206" stroke={C.ink} strokeWidth={4} fill="none" strokeLinecap="round" />
        </g>
        {[0, 1, 2, 3, 4].map(i => {
          const cy = 536 - i * 15;
          return (
            <g key={i} stroke={C.ink} strokeWidth={2.5}>
              <path d={`M82 ${cy} V${cy + 12} A48 13 0 0 0 178 ${cy + 12} V${cy}`} fill={C.sol} />
              <ellipse cx={130} cy={cy} rx={48} ry={13} fill={C.sol} />
            </g>
          );
        })}
        <Lupa cx={612} cy={262} r={70} angle={45} len={110} />
      </g>
      <g transform="rotate(-15 486 432)">
        <circle cx={486} cy={432} r={50} fill="none" stroke={C.barro} strokeWidth={5} />
        <circle cx={486} cy={432} r={39} fill="none" stroke={C.barro} strokeWidth={2} />
        <text x={486} y={428} textAnchor="middle" fontSize={16} fill={C.barro} letterSpacing="0.08em">FONTE</text>
        <text x={486} y={447} textAnchor="middle" fontSize={11} fill={C.barro} letterSpacing="0.08em">OFICIAL</text>
      </g>
    </Frame>
  );
}

function Pin({ x, y, color, s = 1 }: { x: number; y: number; color: string; s?: number }) {
  // (x, y) = ponta do marcador
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={C.ink} strokeWidth={3} strokeLinejoin="round">
      <path d="M0 0 C-20 -28 -27 -38 -27 -52 A27 27 0 1 1 27 -52 C27 -38 20 -28 0 0Z" fill={color} />
      <circle cx={0} cy={-53} r={9} fill={C.paper} />
    </g>
  );
}

/** Mapa dobrado com três tipos de destinação: município, aplicação estadual e vários municípios. */
export function MapaArt({ id = 'mapa' }: { id?: string }) {
  return (
    <Frame id={id} label="Ilustração em colagem: mapa de papel dobrado em três partes, sem fronteiras reais, com um marcador laranja rotulado 'município', um azul rotulado 'estadual' e um círculo tracejado com interrogação rotulado 'vários municípios'. Uma régua amarela atravessa a parte de baixo.">
      <rect width={800} height={600} fill={C.mata} />
      <rect width={800} height={600} fill={`url(#${id}-dots)`} opacity={0.12} />
      <g filter={`url(#${id}-rough)`}>
        <polygon points="118,148 298,188 298,528 118,488" fill={C.ink} transform="translate(8 10)" />
        <polygon points="298,188 478,148 478,488 298,528" fill={C.ink} transform="translate(8 10)" />
        <polygon points="478,148 658,188 658,528 478,488" fill={C.ink} transform="translate(8 10)" />
        <g stroke={C.ink} strokeWidth={3} strokeLinejoin="round">
          <polygon points="110,140 290,180 290,520 110,480" fill={C.paper} />
          <polygon points="290,180 470,140 470,480 290,520" fill={C.paper2} />
          <polygon points="470,140 650,180 650,520 470,480" fill={C.paper} />
        </g>
        <polygon points="290,180 470,140 470,480 290,520" fill={`url(#${id}-dots)`} opacity={0.18} />
        <path d="M120 260 C170 250 200 300 250 290 C300 280 320 230 380 240 C440 250 460 320 520 310 C570 300 600 260 645 270" stroke={C.cobalt} strokeWidth={5} fill="none" strokeLinecap="round" />
        <path d="M130 420 C200 400 250 440 330 410 C400 385 450 420 520 400 C580 385 610 420 640 410" stroke={C.ink} strokeWidth={3} strokeDasharray="2 9" fill="none" strokeLinecap="round" />
        <Pin x={210} y={350} color={C.barro} />
        <Pin x={392} y={300} color={C.cobalt} />
        <circle cx={562} cy={360} r={44} fill={C.paper} stroke={C.ink} strokeWidth={3} strokeDasharray="8 7" />
        <g transform="rotate(-8 450 552)">
          <rect x={300} y={530} width={320} height={40} fill={C.sol} stroke={C.ink} strokeWidth={3} />
          {Array.from({ length: 21 }, (_, i) => <line key={i} x1={312 + i * 14.8} x2={312 + i * 14.8} y1={530} y2={i % 5 === 0 ? 552 : 543} stroke={C.ink} strokeWidth={2} />)}
        </g>
      </g>
      <text x={562} y={377} textAnchor="middle" fontSize={46} fill={C.ink}>?</text>
      <Tag x={210} y={376} text="MUNICÍPIO" />
      <Tag x={392} y={326} text="ESTADUAL" bg={C.cobalt} />
      <Tag x={562} y={426} text="VÁRIOS MUNICÍPIOS" bg={C.sol} fg={C.ink} />
    </Frame>
  );
}

function Card({ x, y, w = 170, h = 116, rot = 0, bar = C.cobalt, dashed = false }: { x: number; y: number; w?: number; h?: number; rot?: number; bar?: string; dashed?: boolean }) {
  const l = -w / 2, t = -h / 2;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {!dashed && <rect x={l + 5} y={t + 6} width={w} height={h} fill={C.ink} />}
      <rect x={l} y={t} width={w} height={h} fill={dashed ? 'none' : C.paper} stroke={C.ink} strokeWidth={3} strokeDasharray={dashed ? '10 8' : undefined} />
      {!dashed && <>
        <rect x={l} y={t} width={w} height={22} fill={bar} stroke={C.ink} strokeWidth={3} />
        {[44, 62, 80, 98].map((yy, i) => <line key={yy} x1={l + 16} x2={l + w - 16 - (i === 3 ? 50 : 0)} y1={t + yy} y2={t + yy} stroke={C.ink} strokeWidth={2} />)}
      </>}
    </g>
  );
}

/** Quadro de apuração: fichas ligadas por fios — documentado, em verificação, não identificado. */
export function FluxoArt({ id = 'fluxo' }: { id?: string }) {
  const p1: [number, number] = [140, 132], p2: [number, number] = [430, 104], p3: [number, number] = [300, 352], p4: [number, number] = [610, 342];
  return (
    <Frame id={id} label="Ilustração em colagem: quadro com quatro fichas presas por alfinetes. Um fio contínuo liga as duas primeiras (documentado), um fio tracejado liga a segunda à terceira (em verificação) e um fio interrompido com interrogação leva a uma ficha vazia tracejada (não identificado).">
      <rect width={800} height={600} fill={C.rosa} />
      <rect width={800} height={600} fill={`url(#${id}-dots-lg)`} opacity={0.1} />
      <g filter={`url(#${id}-rough)`}>
        <Card x={140} y={190} rot={-4} bar={C.cobalt} />
        <Card x={430} y={162} rot={3} bar={C.barro} />
        <Card x={300} y={410} rot={2} bar={C.sol} />
        <Card x={610} y={400} rot={-3} dashed />
        <line x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
        <line x1={p2[0]} y1={p2[1]} x2={p3[0]} y2={p3[1]} stroke={C.ink} strokeWidth={4} strokeDasharray="14 10" strokeLinecap="round" />
        <line x1={p3[0]} y1={p3[1]} x2={410} y2={348} stroke={C.ink} strokeWidth={3} strokeDasharray="3 9" strokeLinecap="round" />
        <line x1={520} y1={345} x2={p4[0]} y2={p4[1]} stroke={C.ink} strokeWidth={3} strokeDasharray="3 9" strokeLinecap="round" />
        <circle cx={465} cy={346} r={24} fill={C.sol} stroke={C.ink} strokeWidth={3} />
        {[p1, p2, p3, p4].map(([x, y], i) => (
          <g key={i}><circle cx={x} cy={y} r={11} fill={C.barro} stroke={C.ink} strokeWidth={3} /><circle cx={x - 3} cy={y - 3} r={3} fill={C.paper} /></g>
        ))}
      </g>
      <text x={465} y={357} textAnchor="middle" fontSize={28} fill={C.ink}>?</text>
      <Tag x={285} y={80} text="DOCUMENTADO" />
      <Tag x={420} y={262} text="EM VERIFICAÇÃO" bg={C.cobalt} />
      <Tag x={610} y={480} text="NÃO IDENTIFICADO" bg={C.sol} fg={C.ink} />
    </Frame>
  );
}

/** Plenário visto de cima: cadeiras vazias, com autoria individual, de bancada e de comissão. */
export function AutoresArt({ id = 'autores' }: { id?: string }) {
  const cx = 400, cy = 540;
  const rows = [150, 210, 270, 330];
  const seats = rows.flatMap((r, ri) => {
    const n = Math.round(r / 22);
    return Array.from({ length: n }, (_, i) => {
      const a = Math.PI + (Math.PI * (i + 0.5)) / n;
      return { ri, i, a: a / Math.PI, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), deg: (a * 180) / Math.PI + 90 };
    });
  });
  // individual = uma cadeira; bancada e comissão = fatias contínuas do plenário (autoria coletiva)
  const fill = (s: { ri: number; i: number; a: number }) => (s.ri === 2 && s.i === 3 ? C.sol : s.a >= 1.55 && s.a <= 1.68 ? C.cobalt : s.a >= 1.79 && s.a <= 1.92 ? C.mata : C.paper);
  const at = (turn: number, r: number, dy: number): [number, number] => [cx + r * Math.cos(Math.PI * turn), cy + r * Math.sin(Math.PI * turn) + dy];
  return (
    <Frame id={id} label="Ilustração em colagem: plenário visto de cima, com fileiras de cadeiras vazias em semicírculo. Uma cadeira amarela marca autoria individual, um grupo azul marca bancada e um grupo verde marca comissão. Não há pessoas.">
      <rect width={800} height={600} fill={C.barro} />
      <g filter={`url(#${id}-rough)`}>
        <path d={`M${cx - 370} ${cy} A370 370 0 0 1 ${cx + 370} ${cy}Z`} fill={C.rosa} stroke={C.ink} strokeWidth={3} />
        <path d={`M${cx - 370} ${cy} A370 370 0 0 1 ${cx + 370} ${cy}Z`} fill={`url(#${id}-dots-lg)`} opacity={0.12} />
        {seats.map(s => (
          <g key={`${s.ri}-${s.i}`} transform={`translate(${s.x} ${s.y}) rotate(${s.deg})`}>
            <rect x={-12} y={-9} width={24} height={18} rx={4} fill={fill(s)} stroke={C.ink} strokeWidth={2.5} />
          </g>
        ))}
        <rect x={355} y={470} width={90} height={60} fill={C.ink} />
        <rect x={365} y={478} width={70} height={14} fill={C.paper} />
        <rect x={0} y={540} width={800} height={60} fill={C.ink} />
      </g>
      <Tag x={at(1 + 3.5 / 12, 270, -30)[0]} y={at(1 + 3.5 / 12, 270, -30)[1]} text="INDIVIDUAL" bg={C.sol} fg={C.ink} />
      <Tag x={at(1.615, 372, 0)[0]} y={at(1.615, 372, 0)[1]} text="BANCADA" bg={C.cobalt} />
      <Tag x={at(1.855, 372, 0)[0] - 10} y={at(1.855, 372, 0)[1]} text="COMISSÃO" />
      <text x={400} y={576} textAnchor="middle" fontSize={13} fill={C.paper} letterSpacing="0.1em">CADEIRAS VAZIAS · SEM PESSOAS REAIS</text>
    </Frame>
  );
}

/* ---------- Spots (ícones ilustrados para os pilares) ---------- */

function Spot({ id, bg, label, children }: { id: string; bg: string; label: string; children: ReactNode }) {
  return (
    <Frame id={id} w={240} h={240} label={label} round={{ cx: 120, cy: 124, r: 100 }}>
      <g filter={`url(#${id}-rough)`}>
        <circle cx={120} cy={124} r={100} fill={bg} />
        {children}
      </g>
    </Frame>
  );
}

export function SpotEntender() {
  return (
    <Spot id="spot-entender" bg={C.sol} label="Ilustração: livro aberto">
      <g stroke={C.ink} strokeWidth={3} strokeLinejoin="round">
        <path d="M44 100 V178 Q85 162 120 180 Q155 162 196 178 V100" fill={C.cobalt} />
        <path d="M50 94 Q85 80 118 98 V172 Q85 154 50 168Z" fill={C.paper} />
        <path d="M190 94 Q155 80 122 98 V172 Q155 154 190 168Z" fill={C.paper} />
        <path d="M160 88 V128 L168 120 L176 128 V86" fill={C.barro} />
      </g>
      <g stroke={C.ink} strokeWidth={2}>
        {[112, 126, 140].map(y => <line key={y} x1={64} y1={y} x2={106} y2={y - 6} />)}
        {[112, 126, 140].map(y => <line key={`r${y}`} x1={134} y1={y - 6} x2={152} y2={y - 8} />)}
      </g>
    </Spot>
  );
}

export function SpotExplorar() {
  return (
    <Spot id="spot-explorar" bg={C.rosa} label="Ilustração: mapa dobrado com marcador">
      <g stroke={C.ink} strokeWidth={3} strokeLinejoin="round">
        <polygon points="46,92 96,108 96,192 46,176" fill={C.paper} />
        <polygon points="96,108 146,92 146,176 96,192" fill={C.paper2} />
        <polygon points="96,108 146,92 146,176 96,192" fill="url(#spot-explorar-dots)" opacity={0.3} stroke="none" />
        <polygon points="146,92 196,108 196,192 146,176" fill={C.paper} />
        <path d="M60 160 C90 150 100 170 130 150 C150 138 170 150 186 132" stroke={C.ink} strokeWidth={2.5} strokeDasharray="2 7" strokeLinecap="round" fill="none" />
        <path d="M130 140 C112 114 104 104 104 90 A26 26 0 1 1 156 90 C156 104 148 114 130 140Z" fill={C.barro} />
        <circle cx={130} cy={88} r={9} fill={C.paper} />
      </g>
    </Spot>
  );
}

export function SpotVerificar() {
  return (
    <Spot id="spot-verificar" bg={C.cobalt} label="Ilustração: lupa sobre documento">
      <Doc x={106} y={122} w={92} h={118} rot={-5} mark />
      <Lupa cx={146} cy={140} r={34} angle={45} len={46} />
    </Spot>
  );
}

export function SpotAcompanhar() {
  return (
    <Spot id="spot-acompanhar" bg={C.barro} label="Ilustração: jornal dobrado">
      <g transform="rotate(4 120 124)">
        <rect x={58} y={64} width={130} height={128} fill={C.ink} />
        <rect x={52} y={58} width={130} height={128} fill={C.paper} stroke={C.ink} strokeWidth={3} />
        <rect x={64} y={70} width={106} height={12} fill={C.ink} />
        <rect x={64} y={90} width={84} height={6} fill={C.ink} />
        <rect x={64} y={104} width={52} height={44} fill={C.sol} stroke={C.ink} strokeWidth={2} />
        <rect x={64} y={104} width={52} height={44} fill="url(#spot-acompanhar-dots)" opacity={0.35} />
        <g stroke={C.ink} strokeWidth={2}>
          {[108, 118, 128, 138, 148, 160, 170].map(y => <line key={y} x1={124} y1={y} x2={170} y2={y} />)}
          {[160, 170].map(y => <line key={`l${y}`} x1={64} y1={y} x2={116} y2={y} />)}
        </g>
      </g>
    </Spot>
  );
}

/* ---------- Registro e moldura ---------- */

export const artworks = { caminho: CaminhoArt, sertao: SertaoArt, congresso: CongressoArt, documentos: DocumentosArt, mapa: MapaArt, fluxo: FluxoArt, autores: AutoresArt } as const;
export type ArtKey = keyof typeof artworks;

export function Art({ name, id }: { name: ArtKey; id?: string }) {
  const Cmp = artworks[name];
  return <Cmp id={id} />;
}

export const spots = { entender: SpotEntender, explorar: SpotExplorar, verificar: SpotVerificar, acompanhar: SpotAcompanhar } as const;
export type SpotKey = keyof typeof spots;

export function SpotArt({ name }: { name: SpotKey }) {
  const Cmp = spots[name];
  return <Cmp />;
}

/** Figura editorial com legenda. Ilustração = metáfora visual, nunca registro documental. */
export function Figure({ children, caption, className = '' }: { children: ReactNode; caption: string; className?: string }) {
  return (
    <figure className={`art ${className}`}>
      <div className="art-frame">{children}</div>
      <figcaption><b>Ilustração</b> {caption}</figcaption>
    </figure>
  );
}
