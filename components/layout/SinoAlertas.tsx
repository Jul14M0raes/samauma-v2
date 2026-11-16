'use client';

/* Sino de alertas: mostra o que os alertas de `lib/dominio/alertas` juntaram
   pro perfil atual. Fecha ao clicar fora, ao apertar Escape, ou ao escolher
   um item — o mesmo padrão de disclosure usado no resto do app. */

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Alerta } from '@/lib/dominio/alertas';

export function SinoAlertas({ alertas }: { alertas: Alerta[] }) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const aoClicarFora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('mousedown', aoClicarFora);
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('mousedown', aoClicarFora);
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto]);

  return (
    <div className="sino" ref={caixa}>
      <button type="button" className={`sino-botao ${alertas.length ? 'tem-alerta' : ''}`} aria-haspopup="true" aria-expanded={aberto}
        aria-label={alertas.length ? `Alertas, ${alertas.length} pendente(s)` : 'Alertas'}
        onClick={() => setAberto(a => !a)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 10a6 6 0 1 1 12 0c0 4 1.4 5.6 1.4 5.6H4.6S6 14 6 10Z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
        {alertas.length > 0 && <span className="sino-contagem">{alertas.length > 9 ? '9+' : alertas.length}</span>}
      </button>

      {aberto && (
        <div className="sino-painel" role="menu" aria-label="Alertas">
          <div className="sino-painel-topo"><b>Alertas</b></div>
          {alertas.length === 0
            ? <p className="sino-vazio">Nenhum alerta agora.</p>
            : (
              <ul>
                {alertas.map(a => (
                  <li key={a.id}>
                    <Link href={a.href} className={`sino-item ${a.tom}`} role="menuitem" onClick={() => setAberto(false)}>
                      <b>{a.titulo}</b>
                      <span>{a.texto}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
        </div>
      )}
    </div>
  );
}
