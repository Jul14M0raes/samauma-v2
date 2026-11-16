'use client';

/* Ocorrência em campo: estabelecimento fechado, material trocado, acesso
   bloqueado. A cooperativa registra o que impediu ou atrapalhou a coleta; o
   registro vai para a trilha e não muda o estado da demanda. Fica recolhido
   abaixo da ação principal, porque é exceção. */

import { useState } from 'react';

import { Cartao } from '@/components/ui/Basicos';
import type { Demanda as TDemanda, Perfil, TipoOcorrencia } from '@/lib/dominio/tipos';
import { Demandas } from '@/lib/dados/demandas';

const OCORRENCIAS: [TipoOcorrencia, string][] = [
  ['FECHADO', 'Estabelecimento fechado'],
  ['MATERIAL_DIVERGENTE', 'Material diferente do combinado'],
  ['ACESSO', 'Acesso bloqueado'],
  ['VOLUME', 'Volume diferente do declarado'],
  ['OUTRO', 'Outra']
];

export function SaidasDeErro({ demanda, perfil, recado }: {
  demanda: TDemanda; perfil: Perfil; recado: (t: string) => void;
}) {
  const [aberta, setAberta] = useState(false);
  const [texto, setTexto] = useState('');
  const [tipo, setTipo] = useState<TipoOcorrencia>('FECHADO');

  const emCampo = ['ACEITA', 'EM_COLETA', 'PENDENCIA_EXECUCAO'].includes(demanda.status);
  if (perfil !== 'cooperativa' || !emCampo) return null;

  const registrar = async () => {
    try {
      await Demandas.registrarOcorrencia(demanda.id, tipo, texto);
      recado('Ocorrência registrada na trilha da demanda.');
      setAberta(false); setTexto('');
    } catch (erro) {
      recado((erro as Error).message);
    }
  };

  return (
    <Cartao titulo="Se algo deu errado em campo" sub="Registre a ocorrência em vez de contornar o sistema"
      nota="A ocorrência não muda o estado da demanda: registra o que impediu a coleta, com autor e horário."
      corpo={aberta ? (
        <>
          <div className="campo-linha">
            <label className="rot" htmlFor="tipoOcorrencia">O que aconteceu</label>
            <select id="tipoOcorrencia" value={tipo} onChange={e => setTipo(e.target.value as TipoOcorrencia)}>
              {OCORRENCIAS.map(([v, r]) => <option key={v} value={v}>{r}</option>)}
            </select>
          </div>
          <div className="campo-linha" style={{ marginTop: 'var(--e3)' }}>
            <label className="rot" htmlFor="notaOcorrencia">Descreva a ocorrência</label>
            <input id="notaOcorrencia" type="text" value={texto} onChange={e => setTexto(e.target.value)}
              placeholder="Escreva o que houve" />
          </div>
          <div className="acoes-form" style={{ marginTop: 'var(--e3)' }}>
            <button className="btn" disabled={!texto.trim()} onClick={registrar}>Registrar</button>
            <button className="btn sec" onClick={() => { setAberta(false); setTexto(''); }}>Voltar</button>
          </div>
        </>
      ) : (
        <div className="filtros">
          <button onClick={() => setAberta(true)}>Registrar ocorrência</button>
        </div>
      )} />
  );
}
