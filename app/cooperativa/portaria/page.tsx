'use client';

/* A portaria do galpão.

   É a tela mais operacional do sistema: alguém de pé, com fila na frente,
   precisa saber em dois segundos se a pessoa entra ou não. Por isso o campo de
   leitura já nasce com o foco, aceita tanto o QR lido por bipador quanto o
   código digitado à mão, e a resposta vem em bloco grande e colorido.

   A mesma tela cuida das carteiras da equipe, porque quem descobre que a
   carteira venceu é justamente quem está no portão — e a renovação precisa
   acontecer ali, não num pedido por e-mail que trava a pessoa do lado de fora. */

import { useEffect, useRef, useState } from 'react';
import { Aviso, BotaoConfirmar, Cabecalho, Cartao, Filtros, Kpi, Kpis, Pino, Vazio } from '@/components/ui/Basicos';
import { useRecado } from '@/components/layout/RecadoProvider';
import {
  Carteiras, codigoDeVerificacao, situacaoDaCarteira,
  type Carteira, type LeituraCarteira
} from '@/lib/dominio/carteira';
import { Catalogo } from '@/lib/dominio/catalogo';
import { Fmt } from '@/lib/dominio/formato';
import { Sessao } from '@/lib/dominio/sessao';
import { useDominio } from '@/state/hooks';
import { Identificacao } from '@/lib/dados/carteiras';

type Grupo = 'todas' | 'ativas' | 'atencao';

export default function PaginaPortaria() {
  useDominio();
  const recado = useRecado();
  const campo = useRef<HTMLInputElement>(null);

  const unidade = Sessao.destino;
  const cooperativaId = unidade.cooperativa;
  const coop = Catalogo.cooperativa(cooperativaId);

  const [codigo, setCodigo] = useState('');
  const [carga, setCarga] = useState('');
  const [leitura, setLeitura] = useState<LeituraCarteira | null>(null);
  const [grupo, setGrupo] = useState<Grupo>('todas');

  useEffect(() => { campo.current?.focus(); }, []);

  const presentes = Carteiras.presentes(unidade.id);
  const movimento = Carteiras.passagensDoLocal(unidade.id);
  const equipe = cooperativaId ? Carteiras.daCooperativa(cooperativaId) : [];

  const hoje = new Date().toDateString();
  const movimentoHoje = movimento.filter(p => new Date(p.quando).toDateString() === hoje);
  const cargaHoje = movimentoHoje.reduce((soma, p) => soma + (p.cargaKg || 0), 0);

  function conferir(evento: React.FormEvent) {
    evento.preventDefault();
    if (!codigo.trim()) return;
    setLeitura(Carteiras.consultar(codigo, unidade.id));
  }

  async function registrar(tipo: 'ENTRADA' | 'SAIDA') {
    try {
      const kg = carga.trim() ? Number(carga) : null;
      if (kg != null && (!Number.isFinite(kg) || kg < 0)) {
        recado('Informe uma carga válida em quilos, ou deixe o campo vazio.');
        return;
      }
      const passagem = await Identificacao.registrarPassagem(codigo, tipo, kg);
      recado(`${tipo === 'ENTRADA' ? 'Entrada' : 'Saída'} de ${passagem.catadorNome} registrada às ${Fmt.hora(passagem.quando)}.`);
      setCodigo('');
      setCarga('');
      setLeitura(null);
      campo.current?.focus();
    } catch (erro) {
      recado(erro instanceof Error ? erro.message : 'Não foi possível registrar a passagem.');
    }
  }

  async function renovar(carteira: Carteira) {
    await Identificacao.renovar(carteira.numero);
    recado(`Carteira ${carteira.numero} renovada por mais 24 meses.`);
  }

  async function segundaVia(carteira: Carteira) {
    await Identificacao.emitir(carteira.catadorId, 'Segunda via emitida na portaria.');
    recado(`Segunda via emitida. A via anterior deixou de valer agora.`);
  }

  async function reativar(carteira: Carteira) {
    try {
      await Identificacao.reativar(carteira.numero);
      recado('Carteira reativada.');
    } catch (erro) {
      recado(erro instanceof Error ? erro.message : 'Não foi possível reativar a carteira.');
    }
  }

  async function suspender(carteira: Carteira, motivo: string) {
    try {
      await Identificacao.suspender(carteira.numero, motivo);
      recado('Carteira suspensa com o motivo registrado.');
    } catch (erro) {
      recado(erro instanceof Error ? erro.message : 'Não foi possível suspender a carteira.');
    }
  }

  const grupos: Record<Grupo, (c: Carteira) => boolean> = {
    todas: () => true,
    ativas: c => situacaoDaCarteira(c).id === 'ATIVA',
    atencao: c => !situacaoDaCarteira(c).liberada || situacaoDaCarteira(c).id === 'A_VENCER'
  };

  return (
    <>
      <Cabecalho titulo="Portaria" texto={`Controle de entrada e saída · ${unidade.nome}`} />

      {!cooperativaId && (
        <Aviso titulo="Unidade sem cooperativa vinculada"
          texto="A leitura de carteira funciona normalmente; a gestão de carteiras da equipe aparece nas unidades ligadas a uma cooperativa." />
      )}

      <Kpis>
        <Kpi rotulo="No galpão agora" valor={presentes.length} sub="entraram e ainda não saíram" tom="marca" destaque />
        <Kpi rotulo="Movimento de hoje" valor={movimentoHoje.length} sub="leituras registradas" />
        <Kpi rotulo="Carga declarada hoje" valor={Fmt.kg(cargaHoje)} sub="somada nas saídas" />
        <Kpi rotulo="Carteiras da equipe" valor={equipe.length}
          sub={`${equipe.filter(c => !situacaoDaCarteira(c).liberada).length} sem autorizar passagem`} />
      </Kpis>

      <div className="portaria">
        <Cartao titulo="Ler carteira" sub="Aponte o bipador para o QR ou digite o código"
          nota="A leitura é registrada mesmo quando a carteira não autoriza a entrada: a recusa também é informação."
          corpo={
            <div className="portaria-leitor">
              <form onSubmit={conferir}>
                <label className="rot" htmlFor="codigo-carteira">Código da carteira</label>
                <input id="codigo-carteira" ref={campo} type="text" value={codigo}
                  placeholder="PVH-CAT-2026-0001-XX" autoComplete="off"
                  onChange={e => { setCodigo(e.target.value); setLeitura(null); }} />
                <div className="acoes-form">
                  <button className="btn" type="submit">Conferir</button>
                  {codigo && <button className="btn fantasma sm" type="button"
                    onClick={() => { setCodigo(''); setLeitura(null); campo.current?.focus(); }}>Limpar</button>}
                </div>
              </form>

              {leitura && <RespostaLeitura leitura={leitura} />}

              {leitura?.encontrada && leitura.situacao && (
                <>
                  <div>
                    <label className="rot" htmlFor="carga-passagem">Carga declarada (kg) · opcional</label>
                    <input id="carga-passagem" type="number" min="0" step="1" value={carga}
                      placeholder="ex.: 240" onChange={e => setCarga(e.target.value)} />
                  </div>
                  <div className="acoes-form">
                    {leitura.dentro
                      ? <button className="btn" onClick={() => registrar('SAIDA')}>Registrar saída</button>
                      : <button className="btn" disabled={!leitura.situacao.liberada}
                          onClick={() => registrar('ENTRADA')}>Registrar entrada</button>}
                    {!leitura.dentro && !leitura.situacao.liberada && (
                      <p className="ajuda">Entrada bloqueada. Renove ou reative a carteira na lista da equipe.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          } />

        <Cartao titulo="No galpão agora" sub="Quem entrou e ainda não registrou saída"
          corpo={presentes.length === 0
            ? <Vazio titulo="Galpão vazio" texto="Ninguém com entrada aberta neste momento." />
            : <ul className="portaria-presentes">
                {presentes.map(p => (
                  <li key={p.id}>
                    <div><b>{p.catadorNome}</b><br /><span className="mono">{p.carteira}</span></div>
                    <span>desde {Fmt.hora(p.quando)}</span>
                  </li>
                ))}
              </ul>} />
      </div>

      {cooperativaId && (
        <Cartao titulo={`Carteiras da equipe · ${coop ? coop.nome : ''}`}
          sub="Emissão, renovação, segunda via e suspensão"
          acao={<Filtros todas={equipe} grupos={grupos} atual={grupo} aoEscolher={setGrupo}
            rotulos={[['todas', 'Todas'], ['ativas', 'Ativas'], ['atencao', 'Precisam de ação']]} />}
          nota="Suspensão exige motivo escrito. O catador vê o mesmo texto na tela dele."
          corpo={<TabelaEquipe carteiras={equipe.filter(grupos[grupo])}
            aoRenovar={renovar} aoSegundaVia={segundaVia} aoSuspender={suspender} aoReativar={reativar} />} />
      )}

      <Cartao titulo="Movimento do local"
        sub={movimento.length > 30 ? `Mostrando as 30 mais recentes de ${movimento.length} leituras` : 'Todas as leituras registradas nesta unidade'}
        corpo={movimento.length === 0
          ? <Vazio titulo="Nenhuma leitura ainda" texto="O movimento aparece assim que a primeira carteira for lida aqui." />
          : <div className="tabela-rolagem">
              <table className="tabela">
                <thead><tr><th>Quando</th><th>Catador</th><th>Carteira</th><th>Movimento</th><th className="dir">Carga</th><th>Situação na leitura</th></tr></thead>
                <tbody>
                  {movimento.slice(0, 30).map(p => (
                    <tr key={p.id}>
                      <td>{Fmt.dataHora(p.quando)}</td>
                      <td><b>{p.catadorNome}</b></td>
                      <td className="mono">{p.carteira}</td>
                      <td><Pino rotulo={p.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'} tom={p.tipo === 'ENTRADA' ? 'ok' : 'neutro'} /></td>
                      <td className="num dir">{p.cargaKg == null ? '—' : Fmt.kg(p.cargaKg)}</td>
                      <td>{p.situacaoNaLeitura.replace('_', ' ').toLowerCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>} />
    </>
  );
}

function RespostaLeitura({ leitura }: { leitura: LeituraCarteira }) {
  if (!leitura.encontrada || !leitura.carteira || !leitura.situacao) {
    return (
      <div className="portaria-resposta erro" role="status">
        <div className="quem"><b>Não confere</b></div>
        <p>{leitura.recado}</p>
      </div>
    );
  }
  const catador = leitura.catador;
  const coop = Catalogo.cooperativa(leitura.carteira.vinculo);
  return (
    <div className={`portaria-resposta ${leitura.situacao.liberada ? 'ok' : 'erro'}`} role="status">
      <div className="quem">
        <b>{catador ? catador.nome : leitura.carteira.catadorId}</b>
        <Pino rotulo={leitura.situacao.rotulo} tom={leitura.situacao.tom} />
      </div>
      <p>{coop ? `Cooperado da ${coop.nome}` : 'Catador autônomo'} · {catador?.zona || '—'}<br />
        <span className="mono">{codigoDeVerificacao(leitura.carteira.numero)}</span></p>
      <p>{leitura.situacao.motivo}</p>
      {leitura.dentro && leitura.ultima && (
        <p><b>Já está dentro</b> desde {Fmt.hora(leitura.ultima.quando)}. A próxima leitura registra a saída.</p>
      )}
    </div>
  );
}

function TabelaEquipe({ carteiras, aoRenovar, aoSegundaVia, aoSuspender, aoReativar }: {
  carteiras: Carteira[];
  aoRenovar: (c: Carteira) => void;
  aoSegundaVia: (c: Carteira) => void;
  aoSuspender: (c: Carteira, motivo: string) => void;
  aoReativar: (c: Carteira) => void;
}) {
  if (!carteiras.length) return <Vazio titulo="Nenhuma carteira neste filtro" texto="Troque o filtro para ver as demais." />;
  return (
    <div className="tabela-rolagem">
      <table className="tabela">
        <thead><tr><th>Catador</th><th>Registro</th><th>Válida até</th><th>Situação</th><th>Ações</th></tr></thead>
        <tbody>
          {carteiras.map(c => {
            const situacao = situacaoDaCarteira(c);
            const catador = Catalogo.catador(c.catadorId);
            return (
              <tr key={c.numero}>
                <td><b>{catador ? catador.nome : c.catadorId}</b><small>via {c.via} · {catador?.zona}</small></td>
                <td className="mono">{codigoDeVerificacao(c.numero)}</td>
                <td>{Fmt.data(c.validaAte)}</td>
                <td><Pino rotulo={situacao.rotulo} tom={situacao.tom} /><small>{situacao.motivo}</small></td>
                <td>
                  <div className="acoes">
                    <BotaoConfirmar classe="btn sec sm" rotulo="Renovar" rotuloConfirmar="Renovar"
                      pergunta={`Renovar a carteira de ${catador ? catador.nome : c.catadorId} por 24 meses?`}
                      onConfirmar={() => aoRenovar(c)} />
                    <BotaoConfirmar classe="btn sec sm" rotulo="2ª via" rotuloConfirmar="Emitir 2ª via"
                      pergunta="A via anterior deixa de valer agora. Emitir 2ª via?"
                      onConfirmar={() => aoSegundaVia(c)} />
                    {c.estado === 'SUSPENSA' ? (
                      <BotaoConfirmar classe="btn sec sm" rotulo="Reativar" rotuloConfirmar="Reativar"
                        pergunta="Reativar esta carteira?" onConfirmar={() => aoReativar(c)} />
                    ) : (
                      <BotaoConfirmar classe="btn sec sm" rotulo="Suspender" rotuloConfirmar="Suspender"
                        pergunta="Motivo da suspensão:"
                        campo={{ rotulo: 'Motivo da suspensão', placeholder: 'Fica visível para o catador e a fiscalização', obrigatorio: true }}
                        onConfirmar={motivo => aoSuspender(c, motivo!)} />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
