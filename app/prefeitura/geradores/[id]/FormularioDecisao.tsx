'use client';

/* Classificação manual de inconformidade grave (RN-037, RF-005).
   Decisão sempre humana e com fundamento: leva o estabelecimento a Irregular.
   Revogar é um evento novo; o histórico inteiro fica visível. O caminho de
   regularização além da revogação segue em aberto na doc. */

import { useState } from 'react';
import { Cadastro } from '@/lib/dominio/cadastro';
import { Fmt } from '@/lib/dominio/formato';
import type { Gerador } from '@/lib/dominio/tipos';
import { Cadastros } from '@/lib/dados/cadastros';

export function FormularioDecisao({ gerador, aoFechar, recado }: {
  gerador: Gerador; aoFechar: () => void; recado: (t: string) => void;
}) {
  const [fundamento, setFundamento] = useState('');
  const vigente = Cadastro.inconformidadeVigente(gerador.id);
  const historico = Cadastro.historicoDeInconformidade(gerador.id);

  return (
    <>
      <div className="form">
        <div className="largo">
          <label className="rot" htmlFor="decFundamento">
            {vigente ? 'Fundamento da revogação' : 'Fundamento da inconformidade grave'}
          </label>
          <input type="text" id="decFundamento" value={fundamento}
            onChange={e => setFundamento(e.target.value)}
            placeholder={vigente ? 'Termo de ajustamento cumprido no processo 2026/0148' : 'Descarte irregular constatado em vistoria de 12/09'} />
          <div className="ajuda">Obrigatório. Sem fundamento registrado não há decisão.</div>
        </div>
      </div>
      <div className="acoes-form">
        {vigente ? (
          <button className="btn" disabled={fundamento.trim().length < 5} onClick={async () => {
            const ok = await Cadastros.revogarInconformidade(gerador.id, fundamento);
            recado(ok ? 'Inconformidade revogada. A situação volta ao que os dados dizem.' : 'Informe o fundamento.');
            if (ok) aoFechar();
          }}>Revogar inconformidade</button>
        ) : (
          <button className="btn erro" disabled={fundamento.trim().length < 5} onClick={async () => {
            const ok = await Cadastros.classificarInconformidade(gerador.id, fundamento);
            recado(ok ? 'Inconformidade grave classificada. O estabelecimento passa a Irregular.' : 'Informe o fundamento.');
            if (ok) aoFechar();
          }}>Classificar inconformidade grave</button>
        )}
        <button className="btn sec" onClick={aoFechar}>Cancelar</button>
      </div>
      {historico.length > 0 && (
        <ul className="lista-motivos" style={{ marginTop: 'var(--e3)' }}>
          {historico.map((h, i) => (
            <li key={i}><b>{h.acao === 'CLASSIFICADA' ? 'Classificada' : 'Revogada'}</b> — {h.fundamento}
              <br /><small className="fonte-dado">{h.por}, {Fmt.dataHora(h.quando)}</small></li>
          ))}
        </ul>
      )}
    </>
  );
}
