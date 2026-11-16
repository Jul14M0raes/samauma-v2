'use client';

/* SAMAÚMA — comprovante como sobreposição global.
   Tela compartilhada entre os quatro perfis, aberta por cima de qualquer rota
   — por isso vive num Provider no layout raiz, e não numa rota própria. */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Store } from '@/lib/dominio/store';
import { baixarComprovante, comprovanteHtml } from '@/lib/servicos/comprovante';
import { LOGO_URL } from '../ui/Basicos';

interface ComprovanteContexto {
  abrir: (id: string) => void;
}

const ComprovanteContext = createContext<ComprovanteContexto>({ abrir: () => {} });

export function useComprovante() {
  return useContext(ComprovanteContext);
}

export function ComprovanteProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState<string | null>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const fecharBtn = useRef<HTMLButtonElement>(null);
  const focoAnterior = useRef<HTMLElement | null>(null);

  const abrir = useCallback((novoId: string) => setId(novoId), []);
  const fechar = useCallback(() => setId(null), []);

  useEffect(() => {
    if (!id) return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') { fechar(); return; }
      if (evento.key !== 'Tab' || !caixa.current) return;
      /* Trap de foco: Tab no último elemento volta ao primeiro, e vice-versa
         com Shift+Tab — sem isso, com o modal aberto, o foco escapa para a
         página por trás. */
      const focaveis = caixa.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focaveis.length) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (evento.shiftKey && document.activeElement === primeiro) { evento.preventDefault(); ultimo.focus(); }
      else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primeiro.focus(); }
    };
    document.addEventListener('keydown', aoTeclar);

    /* Foco entra no modal ao abrir, e volta pra quem o abriu ao fechar —
       sem isso, quem navega por teclado/leitor de tela some da tela. */
    focoAnterior.current = document.activeElement as HTMLElement | null;
    fecharBtn.current?.focus();

    return () => {
      document.removeEventListener('keydown', aoTeclar);
      focoAnterior.current?.focus();
    };
  }, [id, fechar]);

  const demanda = id ? Store.obter(id) : null;

  return (
    <ComprovanteContext.Provider value={{ abrir }}>
      {children}
      <div ref={caixa} className="sobreposicao" hidden={!demanda} role="dialog" aria-modal="true" aria-label="Comprovante simplificado"
        onClick={evento => { if (evento.target === evento.currentTarget) fechar(); }}>
        <div className="folha">
          <div className="folha-topo">
            <b>Comprovante simplificado</b>
            <div className="acoes">
              <button className="btn sec sm" onClick={() => demanda && baixarComprovante(demanda, location.origin + LOGO_URL)}>Baixar</button>
              <button className="btn sec sm" onClick={() => {
                document.body.classList.add('somente-comprovante');
                window.print();
                document.body.classList.remove('somente-comprovante');
              }}>Imprimir</button>
              <button ref={fecharBtn} className="btn fantasma sm" onClick={fechar}>Fechar</button>
            </div>
          </div>
          <div id="folhaConteudo" dangerouslySetInnerHTML={{ __html: demanda ? comprovanteHtml(demanda, LOGO_URL) : '' }} />
        </div>
      </div>
    </ComprovanteContext.Provider>
  );
}
