'use client';

/* Sub-navegação dentro de uma aba. Existe porque juntar duas telas numa aba só
   resolve a barra do topo, mas empurra o problema para dentro: sem um controle
   visível, o usuário não descobre a segunda vista. Reaproveita o estilo de
   `.filtros`, que já é a pastilha usada para alternar recortes de lista —
   mas o comportamento é de aba de verdade (troca a tela inteira), não de
   filtro (recorta a mesma lista): por isso segue o padrão ARIA de tabs
   completo — tabindex circulando só pela aba selecionada, setas movendo o
   foco, e cada botão associado ao painel que ele controla.

   O painel correspondente precisa existir no lugar de quem usa este
   componente, com `role="tabpanel"`, `id={idPainel(idBase, chave)}` e
   `aria-labelledby={idAba(idBase, chave)}` — ver `idAba`/`idPainel`. */

import { useRef } from 'react';

export function idAba(idBase: string, chave: string) { return `${idBase}-aba-${chave}`; }
export function idPainel(idBase: string, chave: string) { return `${idBase}-painel-${chave}`; }

export function SubAbas<T extends string>({ atual, opcoes, aoEscolher, rotulo, idBase }: {
  atual: T;
  opcoes: [T, string, number?, boolean?][];
  aoEscolher: (chave: T) => void;
  rotulo: string;
  idBase: string;
}) {
  const botoes = useRef<Array<HTMLButtonElement | null>>([]);

  function moverFoco(indiceAtual: number, direcao: 1 | -1) {
    const total = opcoes.length;
    const proximo = (indiceAtual + direcao + total) % total;
    const chave = opcoes[proximo][0];
    aoEscolher(chave);
    botoes.current[proximo]?.focus();
  }

  return (
    <div className="filtros sub-abas" role="tablist" aria-label={rotulo}>
      {opcoes.map(([chave, texto, n, novo], i) => (
        <button key={chave} ref={el => { botoes.current[i] = el; }}
          role="tab" id={idAba(idBase, chave)} aria-controls={idPainel(idBase, chave)}
          aria-selected={atual === chave} tabIndex={atual === chave ? 0 : -1}
          className={atual === chave ? 'on' : ''} onClick={() => aoEscolher(chave)}
          onKeyDown={e => {
            if (e.key === 'ArrowRight') { e.preventDefault(); moverFoco(i, 1); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); moverFoco(i, -1); }
          }}>
          {texto}{n != null && <span className="n num">{n}</span>}{novo && <span className="novo">novo</span>}
        </button>
      ))}
    </div>
  );
}
