'use client';

/* O MTR da carga (DOC-001). O Gerador emite no SINIR e vincula aqui depois do
   recebimento confirmado (RF-020); o Técnico da Prefeitura só visualiza
   (RF-024). O sistema monta o rascunho com o que já sabe e guarda o número com
   fonte, data de emissão e data da consulta (RNF-006). */

import { useState } from 'react';
import { Aviso, Cartao, Pino } from '@/components/ui/Basicos';
import { Fmt } from '@/lib/dominio/formato';
import { faltamNoRascunho, PORTAL_MTR, rascunhoMtr, situacaoMtr, transportadorDoMtr } from '@/lib/dominio/mtr';
import type { Demanda as TDemanda } from '@/lib/dominio/tipos';
import { Documentos } from '@/lib/dados/documentos';

export function BlocoMtr({ demanda, recado, somenteLeitura = false }: {
  demanda: TDemanda; recado: (t: string) => void; somenteLeitura?: boolean;
}) {
  const [numero, setNumero] = useState('');
  const [emissao, setEmissao] = useState('');
  const [cdf, setCdf] = useState('');
  const [abrirRascunho, setAbrirRascunho] = useState(false);

  const situacao = situacaoMtr(demanda);
  if (situacao.id === 'NAO_EXIGIVEL') return null;

  const campos = rascunhoMtr(demanda);
  const faltam = faltamNoRascunho(demanda);
  const transportador = transportadorDoMtr(demanda);

  return (
    <Cartao titulo="Manifesto de Transporte de Resíduos"
      sub={situacao.rotulo}
      acao={<Pino rotulo={situacao.rotulo} tom={situacao.tom} />}
      nota={`A emissão é do gerador, em ${PORTAL_MTR.replace('https://', '')}. O sistema não emite o manifesto: prepara os dados e guarda o número para cruzar com o comprovante municipal.`}
      corpo={<>
        <p className="texto">{situacao.motivo}</p>

        {transportador.impedimento && (
          <Aviso tom="alerta" titulo="Transportador sem CNPJ" texto={transportador.impedimento} />
        )}

        {!demanda.mtr && !somenteLeitura && (
          <>
            <div className="acoes-form" style={{ marginTop: 0 }}>
              <button className="btn sec sm" type="button" aria-expanded={abrirRascunho} onClick={() => setAbrirRascunho(!abrirRascunho)}>
                {abrirRascunho ? 'Fechar rascunho' : `Ver rascunho do manifesto${faltam ? ` · faltam ${faltam}` : ''}`}
              </button>
            </div>

            {abrirRascunho && (
              <div className="tabela-rolagem" style={{ marginTop: 'var(--e3)' }}>
                <table className="tabela">
                  <thead><tr><th>Campo do manifesto</th><th>Valor</th></tr></thead>
                  <tbody>
                    {campos.map((c, i) => (
                      <tr key={i}>
                        <td>{c.rotulo}{c.nota && <small>{c.nota}</small>}</td>
                        <td>{c.aPreencher
                          ? <Pino rotulo="a preencher" tom="alerta" />
                          : <b>{c.valor}</b>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <form onSubmit={async evento => {
              evento.preventDefault();
              try {
                await Documentos.vincularMtr(demanda.id, numero,
                  emissao ? new Date(emissao + 'T12:00:00').toISOString() : undefined);
                recado(`MTR ${numero} vinculado a esta carga.`);
                setNumero(''); setEmissao('');
              } catch (erro) { recado((erro as Error).message); }
            }}>
              <label className="rot" htmlFor="numero-mtr">Número do MTR emitido</label>
              <input id="numero-mtr" type="text" value={numero} autoComplete="off" className="mono"
                placeholder="ex.: 2026000123456" onChange={e => setNumero(e.target.value)} />
              <label className="rot" htmlFor="emissao-mtr">Data de emissão no SINIR</label>
              <input id="emissao-mtr" type="date" value={emissao} onChange={e => setEmissao(e.target.value)} />
              <div className="acoes-form">
                <button className="btn" type="submit" disabled={!numero.trim()}>Registrar MTR</button>
                <span className="ajuda">Emita no SINIR e cole o número aqui.</span>
              </div>
            </form>
          </>
        )}

        {demanda.mtr && (
          <>
            <dl className="pares">
              <div><dt>MTR</dt><dd className="mono">{demanda.mtr.numero}</dd></div>
              <div><dt>Fonte</dt><dd>{demanda.mtr.fonte}</dd></div>
              <div><dt>Emitido em</dt><dd>{Fmt.data(demanda.mtr.emitidoEm)}</dd></div>
              <div><dt>Consultado em</dt><dd>{Fmt.dataHora(demanda.mtr.consultadoEm)}</dd></div>
              <div><dt>Por</dt><dd>{demanda.mtr.registradoPor}</dd></div>
              {demanda.mtr.cdf && <>
                <div><dt>CDF</dt><dd className="mono">{demanda.mtr.cdf.numero}</dd></div>
                <div><dt>CDF registrado em</dt><dd>{Fmt.dataHora(demanda.mtr.cdf.emitidoEm)}</dd></div>
              </>}
            </dl>

            {!demanda.mtr.cdf && !somenteLeitura && (
              <form onSubmit={async evento => {
                evento.preventDefault();
                try {
                  await Documentos.registrarCdf(demanda.id, cdf);
                  recado(`CDF ${cdf} vinculado ao manifesto.`);
                  setCdf('');
                } catch (erro) { recado((erro as Error).message); }
              }}>
                <label className="rot" htmlFor="numero-cdf">Certificado de Destinação Final</label>
                <input id="numero-cdf" type="text" value={cdf} autoComplete="off" className="mono"
                  placeholder="número do CDF" onChange={e => setCdf(e.target.value)} />
                <div className="acoes-form">
                  <button className="btn sec" type="submit" disabled={!cdf.trim()}>Registrar CDF</button>
                  <span className="ajuda">Emitido pela cooperativa que recebeu a carga.</span>
                </div>
              </form>
            )}
          </>
        )}
      </>} />
  );
}
