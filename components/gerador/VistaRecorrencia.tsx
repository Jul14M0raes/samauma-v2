'use client';

/* Coleta recorrente, na área do estabelecimento.

   A tela tem duas metades e a ordem entre elas importa: primeiro o que o
   agendamento propõe para HOJE, com um botão de confirmar; depois a configuração
   dos agendamentos, que é coisa que se mexe uma vez e se esquece.

   A confirmação existe porque demanda publicada é compromisso com a rede: um
   agendamento que publicasse sozinho mandaria catador a endereço onde talvez não
   haja carga. Automatizar a digitação, nunca a decisão. */

import { useState, useSyncExternalStore } from 'react';

import { useRecado } from '@/components/layout/RecadoProvider';
import { Aviso, Cabecalho, Cartao, Pino, Vazio } from '@/components/ui/Basicos';
import { Catalogo, RESIDUOS } from '@/lib/dominio/catalogo';
import { Fmt } from '@/lib/dominio/formato';
import { NOME_DO_DIA, Recorrencia, type DiaDaSemana } from '@/lib/dominio/recorrencia';
import { Sessao } from '@/lib/dominio/sessao';
import { useDominio } from '@/state/hooks';
import { Contratos } from '@/lib/dados/contratos';

const DIAS_UTEIS: DiaDaSemana[] = [1, 2, 3, 4, 5];

export function VistaRecorrencia() {
  useDominio();
  useSyncExternalStore(Recorrencia.subscribe, Recorrencia.getSnapshot, Recorrencia.getSnapshot);
  const recado = useRecado();
  const geradorId = Sessao.gerador;

  const [residuo, setResiduo] = useState(RESIDUOS.filter(r => r.recuperavel)[0].id);
  const [quantidade, setQuantidade] = useState('');
  const [dias, setDias] = useState<DiaDaSemana[]>([]);
  const [observacao, setObservacao] = useState('');

  const agendamentos = Recorrencia.doGerador(geradorId);
  const propostas = Recorrencia.propostasDoDia(geradorId);
  const pendentes = propostas.filter(p => !p.jaCriada);

  const alternarDia = (d: DiaDaSemana) =>
    setDias(atual => atual.includes(d) ? atual.filter(x => x !== d) : [...atual, d]);

  const criar = async () => {
    try {
      await Contratos.preverColeta({
        residuo, declaradoL: Number(String(quantidade).replace(',', '.')),
        dias, observacao
      });
      setQuantidade(''); setDias([]); setObservacao('');
      recado('Coleta prevista em contrato registrada. Nos dias escolhidos, ela aparece aqui para você confirmar.');
    } catch (erro) { recado((erro as Error).message); }
  };

  return (
    <>
      <Cabecalho titulo="Coletas previstas em contrato"
        texto="Os dias de coleta combinados com a cooperativa (RF-006). Confirme em um toque nos dias em que há carga." />

      <Cartao titulo="Coletas de hoje" sub={new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        classe={pendentes.length ? 'acao-viva' : ''}
        nota="A confirmação é sua porque quem sabe se há carga hoje é quem está no estabelecimento. Confirmada, a demanda vai para a cooperativa contratada."
        corpo={propostas.length === 0
          ? <Aviso titulo="Nada agendado para hoje"
              texto={agendamentos.length
                ? 'Nenhum dos seus agendamentos cai no dia de hoje.'
                : 'Crie um agendamento abaixo para que as coletas que se repetem apareçam aqui.'} />
          : <div className="lista-propostas">
              {propostas.map(p => {
                const r = Catalogo.residuo(p.agendamento.residuo);
                return (
                  <div key={p.agendamento.id} className="proposta">
                    <div>
                      <b>{r?.nome || p.agendamento.residuo}</b>
                      <small>{Fmt.litros(p.agendamento.declaradoL)} · {p.agendamento.id}</small>
                    </div>
                    {p.jaCriada
                      ? <Pino rotulo="Confirmada hoje" tom="ok" />
                      : <button className="btn" onClick={async () => {
                          try {
                            const d = await Contratos.confirmar(p.agendamento.id);
                            recado(`Demanda ${d.id} encaminhada a ${d.destino.nome}.`);
                          } catch (erro) { recado((erro as Error).message); }
                        }}>Confirmar coleta</button>}
                  </div>
                );
              })}
            </div>} />

      <Cartao titulo="Coletas do contrato" sub={`${agendamentos.length} configurada(s)`}
        nota="O contrato é firmado fora do sistema (DOC-006). Aqui ele só propõe a coleta no dia certo; nada é publicado sozinho."
        corpo={agendamentos.length === 0
          ? <Vazio titulo="Nenhum agendamento" texto="Crie o primeiro abaixo." />
          : <div className="tabela-rolagem">
              <table className="tabela">
                <thead><tr><th>Código</th><th>Resíduo</th><th>Declarado</th><th>Dias</th><th>Situação</th><th></th></tr></thead>
                <tbody>
                  {agendamentos.map(a => (
                    <tr key={a.id}>
                      <td className="mono">{a.id}</td>
                      <td><b>{Catalogo.residuo(a.residuo)?.nome || a.residuo}</b>{a.observacao && <small>{a.observacao}</small>}</td>
                      <td className="num">{Fmt.litros(a.declaradoL)}</td>
                      <td>{a.dias.map(d => NOME_DO_DIA[d].slice(0, 3)).join(' · ')}</td>
                      <td><Pino rotulo={a.ativo ? 'Ativo' : 'Pausado'} tom={a.ativo ? 'ok' : 'neutro'} /></td>
                      <td>
                        <div className="acoes-form" style={{ marginTop: 0 }}>
                          <button className="btn sec sm" onClick={() => Contratos.alternar(a.id)}>
                            {a.ativo ? 'Pausar' : 'Retomar'}
                          </button>
                          <button className="btn sec sm" onClick={async () => {
                            await Contratos.remover(a.id);
                            recado('Agendamento removido. As coletas já feitas continuam no histórico.');
                          }}>Remover</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>} />

      <Cartao titulo="Novo agendamento" sub="O que se repete na sua operação"
        nota="A quantidade é declarada em litros (RN-006). A massa é registrada na coleta e conferida na balança da cooperativa."
        corpo={
          <>
            <div className="form">
              <div>
                <label className="rot" htmlFor="agd-residuo">Resíduo</label>
                <select id="agd-residuo" value={residuo} onChange={e => setResiduo(e.target.value)}>
                  {RESIDUOS.filter(r => r.recuperavel).map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="rot" htmlFor="agd-kg">Quantidade por coleta (litros)</label>
                <input id="agd-kg" type="number" min={1} value={quantidade} inputMode="decimal"
                  onChange={e => setQuantidade(e.target.value)} />
              </div>
            </div>

            <div className="campo-linha" style={{ marginTop: 'var(--e3)' }}>
              <span className="rot">Dias em que costuma haver carga</span>
              <div className="filtros">
                {NOME_DO_DIA.map((nome, i) => (
                  <button key={nome} type="button"
                    className={dias.includes(i as DiaDaSemana) ? 'on' : ''}
                    aria-pressed={dias.includes(i as DiaDaSemana)}
                    onClick={() => alternarDia(i as DiaDaSemana)}>{nome.slice(0, 3)}</button>
                ))}
                <button type="button" className={DIAS_UTEIS.every(d => dias.includes(d)) && dias.length === DIAS_UTEIS.length ? 'on' : ''}
                  aria-pressed={DIAS_UTEIS.every(d => dias.includes(d)) && dias.length === DIAS_UTEIS.length}
                  onClick={() => setDias(DIAS_UTEIS)}>Seg a sex</button>
              </div>
            </div>

            <div className="campo-linha" style={{ marginTop: 'var(--e3)' }}>
              <label className="rot" htmlFor="agd-obs">Observação de acesso (opcional)</label>
              <input id="agd-obs" type="text" value={observacao} onChange={e => setObservacao(e.target.value)}
                placeholder="Ex.: doca lateral, das 6h às 11h" />
            </div>

            <div className="acoes-form" style={{ marginTop: 'var(--e3)' }}>
              <button className="btn" onClick={criar} disabled={!dias.length || !quantidade}>
                Criar agendamento
              </button>
              <span className="ajuda">Você confirma cada coleta no dia; nada é publicado automaticamente.</span>
            </div>
          </>
        } />
    </>
  );
}
