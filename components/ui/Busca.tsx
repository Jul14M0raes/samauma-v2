'use client';

/* Campo de busca das listas. Mostra quantos itens sobraram porque uma lista que
   encolhe sem dizer o quanto deixa a dúvida de a busca ter funcionado. */

export function Busca({ valor, aoMudar, placeholder, achados, total, rotulo }: {
  valor: string;
  aoMudar: (v: string) => void;
  placeholder: string;
  achados: number;
  total: number;
  rotulo: string;
}) {
  return (
    <div className="busca">
      <label className="rot vis-oculto" htmlFor="campoBusca">{rotulo}</label>
      <div className="busca-campo">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 4 4" strokeLinecap="round" />
        </svg>
        <input id="campoBusca" type="search" value={valor} placeholder={placeholder}
          onChange={e => aoMudar(e.target.value)} autoComplete="off" />
        {!!valor && <button type="button" className="busca-limpar" onClick={() => aoMudar('')} aria-label="Limpar busca">×</button>}
      </div>
      {!!valor && <span className="busca-conta">{achados} de {total}</span>}
    </div>
  );
}
