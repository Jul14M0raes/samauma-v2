'use client';

/* SAMAÚMA — gráficos.
   Feitos à mão: barras em HTML, rosca e anel em SVG inline. Sem biblioteca,
   sem canvas e sem fonte remota. */

import { useState } from 'react';
import { Catalogo } from '@/lib/dominio/catalogo';
import { Fmt, somar } from '@/lib/dominio/formato';
import { Parametros } from '@/lib/dominio/parametros';
import { Vazio } from './Basicos';

interface DiaSerie { iso: string; rotulo: string; curto: string; hoje: boolean; kg: number; reciclado: number; rejeito: number; n: number }

export function GraficoSerie({ serie, separarRejeito = true }: { serie: DiaSerie[]; separarRejeito?: boolean }) {
  const [aceso, setAceso] = useState<number | null>(null);
  const max = Math.max(...serie.map(d => d.kg), 1);
  const total = somar(serie, 'kg');
  const reciclado = somar(serie, 'reciclado');

  return (
    <div className="serie">
      <div className="serie-topo">
        <span className="serie-total num">{Fmt.toneladas(total)} <small>comprovados no período</small></span>
        <span className="serie-max num">{Fmt.kg(max)} <small>pico do dia</small></span>
      </div>
      <div className="barras">
        {serie.map((dia, i) => {
          const altura = dia.kg ? Math.max(4, (dia.kg / max) * 100) : 2;
          const parteRejeito = dia.kg ? (dia.rejeito / dia.kg) * 100 : 0;
          return (
            <div key={i} className={`col ${dia.hoje ? 'hoje' : ''} ${dia.kg ? '' : 'zero'}`}
              onMouseEnter={() => setAceso(i)} onMouseLeave={() => setAceso(null)}>
              {aceso === i && dia.kg > 0 && (
                <span className="barras-dica">
                  <b>{Fmt.kg(dia.kg)}</b>
                  <span>{dia.rotulo} · {dia.n} carga(s)</span>
                </span>
              )}
              <i className="trilho" aria-hidden="true"></i>
              <span className="haste" style={{ ['--h' as string]: `${altura.toFixed(1)}%` }}>
                {separarRejeito && parteRejeito > 0 && <i className="rejeito" style={{ ['--r' as string]: `${parteRejeito.toFixed(1)}%` }}></i>}
              </span>
              <span className="dia">{dia.curto}</span>
            </div>
          );
        })}
      </div>
      {separarRejeito && (
        <div className="serie-legenda">
          <span><i className="amostra recuperado"></i>recuperado {Fmt.kg(reciclado)}</span>
          <span><i className="amostra rejeito"></i>rejeito {Fmt.kg(total - reciclado)}</span>
          <span><i className="amostra hoje"></i>hoje</span>
        </div>
      )}
    </div>
  );
}

interface ItemRosca { id?: string; nome: string; kg: number; cor?: string; renda?: number; parte: number }

let roscaSeq = 0;

/* Deslocamento acumulado de cada fatia da rosca, calculado fora do corpo do
   componente: mutar um contador dentro do `.map()` de um render é o tipo de
   impureza que o linter de hooks rejeita. */
function deslocamentosDaRosca(itens: ItemRosca[], total: number, volta: number): number[] {
  let acumulado = 0;
  return itens.map(item => {
    const atual = acumulado;
    acumulado += (total ? item.kg / total : 0) * volta;
    return atual;
  });
}

export function GraficoRosca({ itens, legenda = 'kg', centro }: { itens: ItemRosca[]; legenda?: 'kg' | 'renda'; centro?: React.ReactNode }) {
  if (!itens.length) return <Vazio titulo="Sem material comprovado" texto="A composição aparece quando o primeiro ciclo fechar." />;

  const total = somar(itens, 'kg');
  const raio = 42;
  const volta = 2 * Math.PI * raio;
  const id = 'rosca-' + (++roscaSeq);
  const deslocamentos = deslocamentosDaRosca(itens, total, volta);

  const arcos = itens.map((item, i) => {
    const traco = (total ? item.kg / total : 0) * volta;
    return (
      <circle key={i} className="arco" cx={50} cy={50} r={raio} stroke={item.cor || '#8a9690'}
        strokeDasharray={`${traco.toFixed(2)} ${(volta - traco).toFixed(2)}`}
        strokeDashoffset={(-deslocamentos[i]).toFixed(2)}>
        <title>{item.nome}: {Fmt.kg(item.kg)}</title>
      </circle>
    );
  });

  /* Sem preço de referência para nenhum item (caso de uma composição que não
     é de materiais recicláveis, como recuperado × aterro), a coluna de preço
     fica vazia em toda linha — melhor tirá-la e devolver a largura ao nome,
     que senão trunca com reticências à toa. */
  const precos = itens.map(item => {
    const residuo = Catalogo.residuo(item.id || '');
    return residuo ? Parametros.preco(residuo.id) : 0;
  });
  const temPreco = legenda === 'kg' && precos.some(Boolean);

  return (
    <div className="composicao">
      <div className="rosca">
        <svg viewBox="0 0 100 100" role="img" aria-labelledby={id} focusable="false">
          <title id={id}>Composição por material</title>
          <circle className="trilho" cx={50} cy={50} r={raio} />
          <g transform="rotate(-90 50 50)">{arcos}</g>
        </svg>
        <div className="rosca-centro">{centro || <><b className="num">{Fmt.toneladas(total)}</b><span>comprovados</span></>}</div>
      </div>
      <ul className={`legenda ${temPreco ? '' : 'sem-preco'}`}>
        {itens.map((item, i) => (
          <li key={i}>
            <span className="ponto" style={{ background: item.cor || '#8a9690' }}></span>
            <span className="nome">{item.nome}</span>
            {temPreco && <span className="preco num">{precos[i] ? Fmt.reais(precos[i]) + '/kg' : ''}</span>}
            <span className="valor num">{legenda === 'renda' ? Fmt.reais(item.renda) : Fmt.kg(item.kg)}</span>
            <span className="parte num">{Fmt.percentual(item.parte, 0)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

let anelSeq = 0;

export function Anel({ valor, rotulo = '', nota = '', tom = 'verde', texto = null }: {
  valor: number | null; rotulo?: string; nota?: string; tom?: string; texto?: React.ReactNode;
}) {
  const pct = Math.max(0, Math.min(100, valor || 0));
  const raio = 42;
  const volta = 2 * Math.PI * raio;
  const preenchido = (pct / 100) * volta;
  const id = 'anel-' + (++anelSeq);

  return (
    <div className={`anel ${tom}`}>
      <div className="anel-aro">
        <svg viewBox="0 0 100 100" role="img" aria-labelledby={id} focusable="false">
          <title id={id}>{rotulo}: {Fmt.percentual(pct, 0)}</title>
          <circle className="trilho" cx={50} cy={50} r={raio} />
          <circle className="arco" cx={50} cy={50} r={raio} transform="rotate(-90 50 50)"
            strokeDasharray={`${preenchido.toFixed(2)} ${(volta - preenchido).toFixed(2)}`} />
        </svg>
        <div className="anel-centro">
          <b className="num">{texto || Fmt.percentual(pct, 0)}</b>
          {rotulo && <span>{rotulo}</span>}
        </div>
      </div>
      {nota && <div className="anel-nota">{nota}</div>}
    </div>
  );
}

interface ItemRanking { id?: string; nome: string; massa: number; renda?: number; parte: number; nota?: string; aterro?: boolean }

export function Ranking({ itens, destacar = null, unidade = 'kg' }: { itens: ItemRanking[]; destacar?: string | null; unidade?: 'kg' | 'reais' }) {
  if (!itens.length) return <Vazio titulo="Sem dados ainda" texto="O ranking aparece quando houver massa comprovada." />;
  const maior = Math.max(...itens.map(i => i.massa), 1);
  return (
    <ol className="rank">
      {itens.map((item, i) => (
        <li key={i} className={`${destacar && item.id === destacar ? 'eu' : ''} ${item.aterro ? 'aterro' : ''}`}>
          <span className="pos num">{i + 1}</span>
          <span className="dados">
            <span className="linha1"><b>{item.nome}</b>
              <span className="num">{unidade === 'reais' ? Fmt.reais(item.renda) : Fmt.kg(item.massa)}</span></span>
            <span className="trilho"><span className="preenche" style={{ ['--p' as string]: `${((item.massa / maior) * 100).toFixed(1)}%` }}></span></span>
            <span className="linha2">{item.nota || ''}<span className="num">{Fmt.percentual(item.parte, 0)}</span></span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function BarraRecuperacao({ ambiental }: { ambiental: { taxaRecuperacao: number | null; reciclado: number; rejeito: number } }) {
  const taxa = ambiental.taxaRecuperacao || 0;
  const rejeito = 100 - taxa;
  return (
    <div className="recuperacao">
      <div className="barra-dupla" role="img" aria-label={`Recuperado ${Fmt.percentual(taxa, 0)}, rejeito ${Fmt.percentual(rejeito, 0)}`}>
        <span className="recuperado" style={{ ['--p' as string]: `${taxa.toFixed(1)}%` }}>
          {taxa >= 12 && <b>{Fmt.percentual(taxa, 0)}</b>}
        </span>
        <span className="rejeito" style={{ ['--p' as string]: `${rejeito.toFixed(1)}%` }}>
          {rejeito >= 12 && <b>{Fmt.percentual(rejeito, 0)}</b>}
        </span>
      </div>
      <div className="barra-dupla-legenda">
        <span><i className="amostra recuperado"></i><b className="num">{Fmt.kg(ambiental.reciclado)}</b> recuperado <em>{Fmt.percentual(taxa, 0)}</em></span>
        <span><i className="amostra rejeito"></i><b className="num">{Fmt.kg(ambiental.rejeito)}</b> para o aterro <em>{Fmt.percentual(rejeito, 0)}</em></span>
      </div>
    </div>
  );
}
