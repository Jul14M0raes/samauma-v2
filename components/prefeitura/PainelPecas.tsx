/* SAMAÚMA — gráfico de conformidade ao longo do tempo, do painel da
   Prefeitura. O ícone com centelha
   (KPI) e o indicador compacto foram absorvidos por `Kpi` em
   `components/ui/Basicos` — aqui fica só o que é específico deste gráfico. */

'use client';

import { useState } from 'react';
import { Fmt } from '@/lib/dominio/formato';

interface DiaSerie { rotulo: string; kg: number; reciclado: number }
interface Ponto { x: number; y: number }

/* Toneladas acumuladas dia a dia, calculado fora do corpo do componente pelo
   mesmo motivo do deslocamento da rosca (ver `components/ui/Graficos.tsx`). */
function acumularToneladas(serie: DiaSerie[]): number[] {
  let acumulado = 0;
  return serie.map(d => (acumulado += d.reciclado) / 1000);
}

/* Curva suave, sem estourar o dado. Catmull-Rom fazia a linha ultrapassar o
   ponto mais alto nas reversões bruscas — a taxa diária balança bastante de
   um dia pro outro, e a curva chegava a passar de 100% visualmente, o que é
   impossível pro dado real. Hermite monótona (Fritsch-Carlson) garante que
   a curva nunca sai da faixa entre dois pontos consecutivos. */
function suavizar(pontos: Ponto[]): string {
  const n = pontos.length;
  if (n < 2) return '';
  if (n === 2) return `M ${pontos[0].x},${pontos[0].y} L ${pontos[1].x},${pontos[1].y}`;

  const dx: number[] = [], declive: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pontos[i + 1].x - pontos[i].x;
    declive[i] = (pontos[i + 1].y - pontos[i].y) / dx[i];
  }

  const tangente: number[] = [declive[0]];
  for (let i = 1; i < n - 1; i++) {
    tangente[i] = declive[i - 1] * declive[i] <= 0 ? 0 : (declive[i - 1] + declive[i]) / 2;
  }
  tangente[n - 1] = declive[n - 2];

  for (let i = 0; i < n - 1; i++) {
    if (declive[i] === 0) { tangente[i] = 0; tangente[i + 1] = 0; continue; }
    const a = tangente[i] / declive[i], b = tangente[i + 1] / declive[i];
    const h = Math.hypot(a, b);
    if (h > 3) {
      const t = 3 / h;
      tangente[i] = t * a * declive[i];
      tangente[i + 1] = t * b * declive[i];
    }
  }

  let d = `M ${pontos[0].x},${pontos[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pontos[i], p1 = pontos[i + 1];
    const c1x = p0.x + dx[i] / 3, c1y = p0.y + tangente[i] * dx[i] / 3;
    const c2x = p1.x - dx[i] / 3, c2y = p1.y - tangente[i + 1] * dx[i] / 3;
    d += ` C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p1.x.toFixed(2)},${p1.y.toFixed(2)}`;
  }
  return d;
}

export function GraficoConformidade({ serie }: { serie: DiaSerie[] }) {
  const [aceso, setAceso] = useState<number | null>(null);
  const taxas = serie.map(d => d.kg ? (d.reciclado / d.kg) * 100 : 0);
  const acumulados = acumularToneladas(serie);
  const maiorAcumulado = Math.max(...acumulados, 1);

  const largura = 100, base = 82;
  const passo = largura / (serie.length - 1);
  const coords = (valores: number[], max: number) => valores.map((v, i) => ({ x: i * passo, y: base - (v / max) * base }));

  const pTaxa = coords(taxas, 100);
  const pMassa = coords(acumulados, maiorAcumulado);
  const areaMassa = `${suavizar(pMassa)} L ${largura.toFixed(1)},${base} L 0,${base} Z`;

  const i = aceso ?? serie.length - 1;
  const ponto = pMassa[i];

  return (
    <div className="conformidade">
      <div className="conformidade-linha">
        <span className="eixo-y esquerda"><span>100%</span><span>50%</span><span>0%</span></span>
        <span className="meio">
          <svg viewBox={`0 0 ${largura} 90`} preserveAspectRatio="none" role="img" aria-label="Conformidade ao longo do tempo"
            onMouseMove={e => {
              const r = e.currentTarget.getBoundingClientRect();
              const fracao = (e.clientX - r.left) / r.width;
              setAceso(Math.max(0, Math.min(serie.length - 1, Math.round(fracao * (serie.length - 1)))));
            }}
            onMouseLeave={() => setAceso(null)}>
            <defs><linearGradient id="conf-gradiente" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--ouro-fundo)" stopOpacity=".22" />
              <stop offset="1" stopColor="var(--ouro-fundo)" stopOpacity="0" />
            </linearGradient></defs>
            {[0, 1, 2, 3].map(k => <line key={k} className="grade" x1={0} x2={largura} y1={(base / 3) * k} y2={(base / 3) * k} />)}
            <path className="area" d={areaMassa} fill="url(#conf-gradiente)" />
            <path className="linha ouro" d={suavizar(pMassa)} />
            <path className="linha verde" d={suavizar(pTaxa)} />
            {aceso != null && <line className="guia" x1={ponto.x} x2={ponto.x} y1={0} y2={base} />}
            <circle className="ponto-linha ouro" cx={pMassa[i].x} cy={pMassa[i].y} r={aceso != null ? 2.2 : 1.6} />
            <circle className="ponto-linha verde" cx={pTaxa[i].x} cy={pTaxa[i].y} r={aceso != null ? 2.2 : 1.6} />
          </svg>
          {aceso != null && (
            <div className="conformidade-dica" style={{ left: `${(ponto.x / largura) * 100}%` }}>
              <b>{serie[i].rotulo}</b>
              <span><i className="amostra ouro"></i>{Fmt.toneladas(acumulados[i] * 1000)} acumulado</span>
              <span><i className="amostra verde"></i>{Fmt.percentual(taxas[i], 0)} de recuperação</span>
            </div>
          )}
        </span>
        <span className="eixo-y direita"><span>{Fmt.toneladas(maiorAcumulado * 1000)}</span><span>{Fmt.toneladas(maiorAcumulado * 500)}</span><span>0 t</span></span>
      </div>
      <div className="conformidade-legenda">
        <span><i className="amostra verde"></i>Taxa de recuperação diária</span>
        <span><i className="amostra ouro"></i>Toneladas desviadas, acumulado no período</span>
      </div>
      <div className="conformidade-eixo">
        <span>{serie[0].rotulo}</span><span>{serie[Math.floor(serie.length / 2)].rotulo}</span><span>{serie[serie.length - 1].rotulo}</span>
      </div>
    </div>
  );
}
