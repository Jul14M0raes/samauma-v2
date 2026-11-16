'use client';

/* SAMAÚMA — componentes de interface.
   As peças que todas as telas montam: marca, cartão, indicador, aviso, filtro,
   pino de situação, e faixa de identidade. */

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { STATUS } from '@/lib/dominio/catalogo';
import { DemandaRegras as Demanda } from '@/lib/dominio/demanda';
import { Fmt } from '@/lib/dominio/formato';
import type { Demanda as TDemanda, Situacao } from '@/lib/dominio/tipos';
import { arquivoPublico } from '@/lib/caminhos';

export const LOGO_URL = arquivoPublico('/logo.png');

let simboloSeq = 0;

export function Simbolo() {
  const id = 'ciclo-' + (++simboloSeq);
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="SAMAÚMA" focusable="false">
      <defs>
        <linearGradient id={id} x1="6" y1="58" x2="58" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e0a93a" /><stop offset=".38" stopColor="#8fbb3f" />
          <stop offset=".7" stopColor="#2f8f5b" /><stop offset="1" stopColor="#2a6fa8" />
        </linearGradient>
      </defs>
      <g fill="none" stroke={`url(#${id})`} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M46.5 9.4A27 27 0 0 1 55 41.6" /><path d="M55.6 33.6 55.2 42l-7.4-3.6" />
        <path d="M17.5 54.6A27 27 0 0 1 9 22.4" /><path d="M8.4 30.4 8.8 22l7.4 3.6" />
        <path d="M24.6 27.4a5.6 5.6 0 0 1 2.6-8.6 6.4 6.4 0 0 1 11.4-.6 5.6 5.6 0 0 1 3.2 8.8" />
        <path d="M24.6 27.4a4.6 4.6 0 0 0 4 3.2h9.4a4.6 4.6 0 0 0 3.8-3.2" />
        <path d="M32 18.6v20" /><path d="M32 25.6 27.4 21M32 25.6l4.6-4.6" />
        <path d="M32 38.6c-4.6 0-6.2 2.2-6.2 6M32 38.6c4.6 0 6.2 2.2 6.2 6M32 38.6v6.2" />
      </g>
      <g fill={`url(#${id})`}>
        <circle cx={25.8} cy={46.6} r={2.1} /><circle cx={32} cy={47} r={2.1} /><circle cx={38.2} cy={46.6} r={2.1} />
      </g>
    </svg>
  );
}

export function Tri() {
  return <span className="tri" aria-hidden="true"><i></i><i></i><i></i></span>;
}

/* `tamanho` aceita número em pixels ou qualquer medida CSS — a tela de acesso
   passa um `clamp()` em vh, para a marca encolher junto com a tela. */
export function Marca({ tamanho = 44, forma = 'simbolo' as 'simbolo' | 'completa' }: { tamanho?: number | string; forma?: 'simbolo' | 'completa' }) {
  const completa = forma === 'completa';
  const medida = typeof tamanho === 'number' ? `${tamanho}px` : tamanho;
  return (
    <span className={completa ? 'marca-completa' : 'marca-simbolo'} style={{ ['--tam' as string]: medida }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO_URL} alt="SAMAÚMA"
        onError={e => {
          e.currentTarget.hidden = true;
          const irmao = e.currentTarget.nextElementSibling as HTMLElement | null;
          if (irmao) irmao.hidden = false;
        }} />
      <span className="marca-desenho" hidden>
        <Simbolo />
        {completa && <><b>SAMAÚMA</b><small>Sistema de Grandes Geradores e Inclusão Produtiva</small></>}
      </span>
    </span>
  );
}

/* Sempre um destino explícito: nunca `router.back()`, que depende do
   histórico do navegador e pode devolver a quem chegou por link direto
   para fora do app inteiro. */
export function Voltar({ para, rotulo }: { para: string; rotulo: string }) {
  return <Link href={para} className="voltar">{rotulo}</Link>;
}

/* Substitui `confirm()`/`prompt()` nativos: o botão vira uma pergunta com
   Cancelar/Confirmar embutida, sem sair do sistema visual do app. Para uma
   ação que precisa de um dado (como o motivo de uma suspensão), passe
   `campo` — o valor digitado chega em `onConfirmar`. */
export function BotaoConfirmar({ rotulo, classe = 'btn sec', rotuloConfirmar = 'Confirmar', pergunta, campo, onConfirmar, disabled }: {
  rotulo: string; classe?: string; rotuloConfirmar?: string; pergunta: string;
  campo?: { rotulo: string; placeholder?: string; obrigatorio?: boolean };
  onConfirmar: (valorCampo?: string) => void; disabled?: boolean;
}) {
  const [perguntando, setPerguntando] = useState(false);
  const [valor, setValor] = useState('');

  if (!perguntando) {
    return <button className={classe} type="button" disabled={disabled} onClick={() => setPerguntando(true)}>{rotulo}</button>;
  }

  const bloqueado = !!campo?.obrigatorio && !valor.trim();

  return (
    <span className="confirmar-inline">
      <span>{pergunta}</span>
      {campo && (
        <input type="text" value={valor} placeholder={campo.placeholder} aria-label={campo.rotulo}
          onChange={e => setValor(e.target.value)} autoFocus />
      )}
      <button className="btn fantasma sm" type="button" onClick={() => { setPerguntando(false); setValor(''); }}>Cancelar</button>
      <button className="btn erro sm" type="button" disabled={bloqueado}
        onClick={() => { setPerguntando(false); onConfirmar(campo ? valor.trim() : undefined); setValor(''); }}>
        {rotuloConfirmar}
      </button>
    </span>
  );
}

export function Cabecalho({ titulo, texto, acao, chips, classe = '' }: {
  titulo: string; texto?: string; acao?: ReactNode; chips?: string[]; classe?: string;
}) {
  return (
    <div className={`cabecalho ${classe}`}>
      <div>
        <h2>{titulo}</h2><Tri />{texto && <p>{texto}</p>}
        {!!chips?.length && <div className="cabecalho-chips">{chips.map((c, i) => <span key={i} className="chip">{c}</span>)}</div>}
      </div>
      {acao && <div className="acoes">{acao}</div>}
    </div>
  );
}

export function Cartao({ titulo, sub, acao, corpo, nota, classe = '' }: {
  titulo?: string; sub?: string; acao?: ReactNode; corpo: ReactNode; nota?: string; classe?: string;
}) {
  return (
    <section className={`cartao ${classe}`}>
      {titulo && (
        <header className="cartao-topo">
          <div><h3>{titulo}</h3>{sub && <p>{sub}</p>}</div>
          {acao}
        </header>
      )}
      <div className="cartao-corpo">{corpo}</div>
      {nota && <div className="cartao-nota">{nota}</div>}
    </section>
  );
}

/* Ícones dos indicadores — traço fino, mesmo estilo dos ícones de perfil.
   Ficam aqui (não em components/prefeitura) porque `Kpi` os usa quando
   recebe `icone`, e nada aqui é específico da Prefeitura. */
const ICONES_INDICADOR: Record<string, string> = {
  predio: '<path d="M5 9.5v10h14v-10"/><path d="M3.3 9.5 12 4 20.7 9.5"/><path d="M10 19.5v-5.5h4v5.5"/>',
  tonelada: '<rect x="3.5" y="7" width="17" height="12" rx="2"/><path d="M8 7V5.3a1.3 1.3 0 0 1 1.3-1.3h5.4A1.3 1.3 0 0 1 16 5.3V7"/><path d="M8 13h8"/>',
  moeda: '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.6v8.8M14.6 9.6c0-1.1-1.1-1.7-2.6-1.7s-2.5.7-2.5 1.7c0 2.3 5.1.9 5.1 3.3 0 1.1-1.2 1.8-2.6 1.8s-2.7-.6-2.7-1.8"/>',
  grupo: '<circle cx="8.7" cy="9" r="3"/><circle cx="16.3" cy="10.2" r="2.4"/><path d="M2.8 19c0-3.3 2.6-5.3 5.9-5.3s5.9 2 5.9 5.3"/><path d="M15.2 14.2c2.5.3 4 2 4 4.8"/>',
  recibo: '<path d="M6 3.5h12v17l-2.4-1.6L13.2 20l-1.2-1.6L10.8 20l-2.4-1.1L6 20.5z"/><path d="M8.5 8h7M8.5 11.5h7M8.5 15h4.5"/>',
  crescer: '<path d="M3.5 17.5 9 11l4 3.2 7.5-8.4"/><path d="M16.3 5.8h4.2V10"/>',
  relogio: '<circle cx="12" cy="12.5" r="8.3"/><path d="M12 7.6v5l3.6 2"/>',
  caminhao: '<path d="M2.8 8h11v9h-11z"/><path d="M13.8 11.2h4.1l3.3 3.1v2.7h-7.4z"/><circle cx="7.2" cy="19.3" r="1.8"/><circle cx="17.6" cy="19.3" r="1.8"/>',
  balanca: '<path d="M12 4v16M7 20h10"/><path d="M4.5 8h6M13.5 8h6"/><path d="M4.5 8 2 13a2.5 2.5 0 0 0 5 0zM19.5 8 17 13a2.5 2.5 0 0 0 5 0z"/>',
  pessoa: '<circle cx="12" cy="8.2" r="3.5"/><path d="M4.8 20.3c0-4.2 3.3-6.7 7.2-6.7s7.2 2.5 7.2 6.7"/>'
};

/* Ícones das abas da sidebar — um por id de aba, cobrindo os quatro perfis
   que usam sidebar (gerador, cooperativa, prefeitura). Mesmo traço fino dos
   demais ícones do app. */
const ICONES_ABA: Record<string, string> = {
  painel: '<path d="M4 13.5V20h16v-6.5"/><path d="M2.5 12 12 4l9.5 8"/><path d="M9.5 20v-6h5v6"/>',
  demandas: '<rect x="5" y="3.5" width="14" height="17" rx="1.6"/><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4"/>',
  nova: '<path d="M12 5v14M5 12h14"/>',
  documentos: '<path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"/><path d="M14 3.5V8h4"/>',
  relatorios: '<path d="M4 20V10M10 20V4M16 20v-7M4 20h16"/>',
  fila: '<path d="M2.8 8h11v9h-11z"/><path d="M13.8 11.2h4.1l3.3 3.1v2.7h-7.4z"/><circle cx="7.2" cy="19.3" r="1.8"/><circle cx="17.6" cy="19.3" r="1.8"/>',
  recebidas: '<path d="M4 12h4l2 3h4l2-3h4" /><path d="M4 12 5.5 5.5A1.4 1.4 0 0 1 6.9 4.4h10.2a1.4 1.4 0 0 1 1.4 1.1L20 12v6.4A1.6 1.6 0 0 1 18.4 20H5.6A1.6 1.6 0 0 1 4 18.4Z"/>',
  portaria: '<path d="M6 21V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v15"/><path d="M4 21h16"/><path d="M14 12v2"/>',
  equipe: '<circle cx="8.7" cy="9" r="3"/><circle cx="16.3" cy="10.2" r="2.4"/><path d="M2.8 19c0-3.3 2.6-5.3 5.9-5.3s5.9 2 5.9 5.3"/><path d="M15.2 14.2c2.5.3 4 2 4 4.8"/>',
  cadastros: '<circle cx="8.7" cy="9" r="3"/><circle cx="16.3" cy="10.2" r="2.4"/><path d="M2.8 19c0-3.3 2.6-5.3 5.9-5.3s5.9 2 5.9 5.3"/><path d="M15.2 14.2c2.5.3 4 2 4 4.8"/>',
  fiscalizacao: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.3 15.3 20 20"/>',
  configuracoes: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.6M12 18.4V21M4.9 4.9l1.9 1.9M17.2 17.2l1.9 1.9M3 12h2.6M18.4 12H21M4.9 19.1l1.9-1.9M17.2 6.8l1.9-1.9"/>'
};

export function IconeAba({ id }: { id: string }) {
  const traco = ICONES_ABA[id] || ICONES_ABA.painel;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" dangerouslySetInnerHTML={{ __html: traco }} />
  );
}

export function IconeIndicador({ nome, cor }: { nome: string; cor: string }) {
  return (
    <span className="painel-icone" style={{ ['--cor-icone' as string]: cor }} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"
        dangerouslySetInnerHTML={{ __html: ICONES_INDICADOR[nome] }} />
    </span>
  );
}

export function Centelha({ valores, cor }: { valores: number[]; cor: string }) {
  const max = Math.max(...valores, 1);
  const min = Math.min(...valores, 0);
  const amplitude = max - min || 1;
  const pontos = valores.map((v, i) => {
    const x = (i / (valores.length - 1)) * 60;
    const y = 18 - ((v - min) / amplitude) * 16;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg className="centelha" viewBox="0 0 60 18" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pontos} fill="none" stroke={cor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* `tom` marca o papel do número na tela, não é escolha de gosto:
   marca = o número principal desta tela · ok = meta batida ou zero
   pendências · alerta = exige ação mas está dentro do previsto · erro =
   fora da regra. Vale para `Kpi`, `Pino` e `Aviso`. */
export type Tom = '' | 'marca' | 'ok' | 'alerta' | 'erro';

export function Kpi({ rotulo, valor, sub, tom = '', variacao = null, destaque = false, icone, cor, pontos }: {
  rotulo: string; valor: ReactNode; sub?: string; tom?: Tom; variacao?: number | null; destaque?: boolean;
  icone?: string; cor?: string; pontos?: number[];
}) {
  const corIcone = cor || 'var(--perfil)';
  return (
    <div className={`kpi ${tom} ${destaque ? 'destaque' : ''} ${icone ? 'com-icone' : ''}`}>
      {icone && (
        <div className="kpi-topo">
          <IconeIndicador nome={icone} cor={corIcone} />
          {pontos && <Centelha valores={pontos} cor={corIcone} />}
        </div>
      )}
      <div className="rot">{rotulo}</div>
      <div className="val num">
        {valor}
        {variacao != null && (
          <span className={`delta ${variacao >= 0 ? 'sobe' : 'desce'}`}>
            {variacao >= 0 ? '▲' : '▼'} {Fmt.variacao(Math.abs(variacao))}
          </span>
        )}
      </div>
      <div className="sub">{sub || ''}</div>
    </div>
  );
}

export function Kpis({ children, classe = '' }: { children: ReactNode; classe?: string }) {
  return <div className={`kpis ${classe}`}>{children}</div>;
}

export function Pares({ itens }: { itens: [string, ReactNode, string?][] }) {
  return (
    <dl className="pares">
      {itens.map(([rotulo, valor, tom], i) => (
        <div key={i}><dt>{rotulo}</dt><dd className={`num ${tom || ''} ${typeof valor === 'string' && valor.length > 60 ? 'longo' : ''}`}>{valor}</dd></div>
      ))}
    </dl>
  );
}

export function Aviso({ titulo, texto, tom = '' }: { titulo: string; texto: string; tom?: '' | 'alerta' | 'bom' | 'erro' | 'problema' }) {
  return <div className={`aviso ${tom}`}><b>{titulo}</b><span>{texto}</span></div>;
}

export function Vazio({ titulo, texto }: { titulo: string; texto: string }) {
  return <div className="vazio"><Marca tamanho={38} /><b>{titulo}</b><span>{texto}</span></div>;
}

export function Pino({ rotulo, tom }: { rotulo: string; tom: string }) {
  return <span className={`pino ${tom}`}>{rotulo}</span>;
}

export function SituacaoDemanda({ demanda }: { demanda: TDemanda }) {
  return <Pino rotulo={Demanda.rotulo(demanda)} tom={STATUS[demanda.status].tom} />;
}

export function SituacaoGerador({ situacao }: { situacao: Situacao }) {
  return <Pino rotulo={situacao.rotulo} tom={situacao.tom} />;
}

export function Filtros<T, G extends string>({ todas, grupos, atual, rotulos, aoEscolher }: {
  todas: T[]; grupos: Record<G, (item: T) => boolean>; atual: G; rotulos: [G, string][]; aoEscolher: (chave: G) => void;
}) {
  return (
    <div className="filtros">
      {rotulos.map(([chave, rotulo]) => {
        const n = todas.filter(grupos[chave]).length;
        return (
          <button key={chave} className={atual === chave ? 'on' : ''} aria-pressed={atual === chave}
            onClick={() => aoEscolher(chave)}>
            {rotulo}<span className="n num">{n}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Exportar({ escopo, rotulo = 'Exportar', aoCsv, aoXls, aoPdf }: {
  escopo: string; rotulo?: string; aoCsv: (escopo: string) => void;
  aoXls?: (escopo: string) => void; aoPdf?: (escopo: string) => void;
}) {
  return (
    <div className="exportar">
      <span className="etiqueta">{rotulo}</span>
      <button className="btn sec sm" onClick={() => aoCsv(escopo)}>CSV</button>
      {aoXls && <button className="btn sec sm" onClick={() => aoXls(escopo)}>XLS</button>}
      {aoPdf && <button className="btn sec sm" onClick={() => aoPdf(escopo)}>PDF</button>}
    </div>
  );
}

export function FaixaPerfil({ nome, papel, medidas, acao }: {
  nome: string; papel: string; medidas: [ReactNode, string][]; acao?: ReactNode;
}) {
  return (
    <div className="faixa-perfil">
      <div className="identidade">
        <Marca tamanho={36} />
        <div><b>{nome}</b><span>{papel}</span></div>
      </div>
      <div className="medidas">
        {medidas.map(([valor, rotulo], i) => <div key={i}><b className="num">{valor}</b><span>{rotulo}</span></div>)}
      </div>
      {acao && <div className="faixa-acao">{acao}</div>}
    </div>
  );
}

