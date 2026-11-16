'use client';

/* SAMAÚMA — detalhe da demanda.
   A mesma tela para os quatro perfis: o ciclo, as medições, os dados e a
   trilha. O que muda é o bloco de ação — cada perfil só enxerga o que a matriz
   de permissões lhe dá. */

import { useState, useSyncExternalStore } from 'react';
import { BotaoConfirmar, Cartao, Aviso, Vazio, SituacaoDemanda, Voltar } from '@/components/ui/Basicos';
import { BarraRecuperacao } from '@/components/ui/Graficos';
import { useComprovante } from '@/components/comprovante/ComprovanteProvider';
import { BlocoMtr } from '@/components/demanda/BlocoMtr';
import { CodigoDaDemanda } from '@/components/demanda/ConferenciaEntrega';
import { SaidasDeErro } from '@/components/demanda/SaidasDeErro';
import { useRecado } from '@/components/layout/RecadoProvider';
import { lerDaBalanca, type LeituraBalanca } from '@/lib/servicos/balanca';
import { CanalRegistro } from '@/lib/dominio/canalRegistro';
import { CANAIS, Catalogo, ETAPAS, JANELA_EXECUCAO_HORAS, QUALIDADES, STATUS } from '@/lib/dominio/catalogo';
import { Parametros } from '@/lib/dominio/parametros';
import { DemandaRegras as Demanda } from '@/lib/dominio/demanda';
import { Fmt } from '@/lib/dominio/formato';
import { Sessao } from '@/lib/dominio/sessao';
import { Store } from '@/lib/dominio/store';
import type { Demanda as TDemanda, Perfil, QualidadeId } from '@/lib/dominio/tipos';
import { useDominio } from '@/state/hooks';
import { Demandas } from '@/lib/dados/demandas';

const VOLTA_POR_PERFIL: Record<Perfil, { para: string; rotulo: string }> = {
  gerador: { para: '/gerador/demandas', rotulo: 'Voltar para minhas demandas' },
  cooperativa: { para: '/cooperativa/demandas', rotulo: 'Voltar para as demandas' },
  prefeitura: { para: '/prefeitura/fiscalizacao', rotulo: 'Voltar para fiscalização' },
  gestao: { para: '/gestao/painel', rotulo: 'Voltar para o painel' }
};

type Recado = (t: string) => void;

export function DetalheDemanda({ perfil, id }: { perfil: Perfil; id: string }) {
  useDominio();
  const recado = useRecado();
  const demanda = Store.obter(id);

  if (!demanda) return <Vazio titulo="Demanda não encontrada" texto="Ela pode ter sido removida ao reiniciar a demonstração." />;

  const volta = VOLTA_POR_PERFIL[perfil];

  return (
    <>
      <Voltar para={volta.para} rotulo={volta.rotulo} />

      <div className="cabecalho detalhe" style={{ ['--material' as string]: Catalogo.corResiduo(demanda.residuo) }}>
        <div>
          <span className="codigo">DEMANDA {demanda.id.replace('DEM-', '#')}</span>
          <h2>{Catalogo.nomeResiduo(demanda.residuo)} · {demanda.gerador.nome}</h2>
          <p>{Catalogo.endereco(demanda.ponto)} · prazo {Fmt.prazo(demanda.prazo)} · {demanda.destino.nome}</p>
        </div>
        <div className="acoes"><SituacaoDemanda demanda={demanda} /></div>
      </div>

      <Cartao classe="sem-borda" corpo={<CicloNavegavel demanda={demanda} />} />

      <div className="colunas dois-um">
        <div className="pilha">
          <AcoesDoPerfil demanda={demanda} perfil={perfil} recado={recado} />
          {(perfil === 'gerador' || perfil === 'prefeitura') &&
            <BlocoMtr demanda={demanda} recado={recado} somenteLeitura={perfil === 'prefeitura'} />}
          <BlocoMedicoes demanda={demanda} />
          <BlocoDados demanda={demanda} />
        </div>
        <div className="pilha">
          {/* O código da carga acompanha a demanda em campo; depois de
              comprovada, quem vale é o comprovante. */}
          {perfil === 'cooperativa' && ['ACEITA', 'EM_COLETA', 'EM_TRANSPORTE'].includes(demanda.status) && (
            <CodigoDaDemanda demanda={demanda} />
          )}
          <BlocoTrilha demanda={demanda} />
        </div>
      </div>
    </>
  );
}

/* O ciclo como índice da trilha: cada etapa abre os eventos dela. */
function CicloNavegavel({ demanda }: { demanda: TDemanda }) {
  const [aberta, setAberta] = useState<number | null>(null);
  const atual = STATUS[demanda.status].etapa;
  const problema = ['PENDENCIA_DIVERGENCIA', 'PENDENCIA_EXECUCAO', 'NAO_ACEITA'].includes(demanda.status);
  const grupos = Demanda.trilhaPorEtapa(demanda);

  return (
    <>
      <ol className="ciclo navegavel">
        {ETAPAS.map((nome, i) => {
          const n = i + 1;
          const eventos = grupos[n] || [];
          const classe = [
            problema && n === atual ? 'problema' : n < atual ? 'feita' : n === atual ? 'atual' : '',
            aberta === n ? 'aberta' : '',
            eventos.length ? 'tem-registro' : ''
          ].filter(Boolean).join(' ');

          return (
            <li key={nome} className={classe}>
              <button type="button" aria-expanded={aberta === n} aria-controls={`etapa-painel-${n}`}
                onClick={() => setAberta(aberta === n ? null : n)}
                title={eventos.length ? `${eventos.length} registro(s) nesta etapa` : 'Etapa ainda sem registro'}>
                <span className="bolha">{n < atual ? '✓' : n}</span>
                <b>{nome}</b>
                {!!eventos.length && <span className="n num">{eventos.length}</span>}
              </button>
            </li>
          );
        })}
      </ol>

      {aberta !== null && (
        <div id={`etapa-painel-${aberta}`} role="region" aria-label={`Etapa ${aberta} · ${ETAPAS[aberta - 1]}`}>
          <Cartao titulo={`Etapa ${aberta} · ${ETAPAS[aberta - 1]}`}
            sub={grupos[aberta].length ? `${grupos[aberta].length} registro(s), com autoria e horário` : 'Ainda sem registro'}
            acao={<button className="btn sec sm" onClick={() => setAberta(null)}>Fechar</button>}
            corpo={grupos[aberta].length
              ? <ListaEventos eventos={grupos[aberta]} />
              : <Aviso titulo="Esta etapa ainda não aconteceu"
                  texto={aberta > atual
                    ? `${Demanda.proximaAcao(demanda).texto} — é o que falta para o ciclo chegar aqui.`
                    : 'O ciclo passou por aqui sem gerar registro próprio.'} />} />
        </div>
      )}
    </>
  );
}

function AcoesDoPerfil({ demanda, perfil, recado }: { demanda: TDemanda; perfil: Perfil; recado: Recado }) {
  const principal =
    perfil === 'gerador' ? <AcoesGerador demanda={demanda} recado={recado} />
      : perfil === 'cooperativa' ? <AcoesCooperativa demanda={demanda} recado={recado} />
        : perfil === 'prefeitura' ? <AcoesTecnico demanda={demanda} recado={recado} />
          : <Leitura demanda={demanda} />;
  return (
    <>
      {principal}
      <SaidasDeErro demanda={demanda} perfil={perfil} recado={recado} />
    </>
  );
}

function Leitura({ demanda }: { demanda: TDemanda }) {
  return demanda.status === 'COMPROVADA' ? <BlocoComprovado demanda={demanda} /> : <Esperando demanda={demanda} />;
}

function Esperando({ demanda }: { demanda: TDemanda }) {
  const proxima = Demanda.proximaAcao(demanda);
  const dono = proxima.perfil
    ? ({ gerador: 'o gerador', cooperativa: 'a cooperativa', prefeitura: 'a Prefeitura' } as Record<string, string>)[proxima.perfil]
    : null;
  return <Cartao corpo={<Aviso titulo={dono ? `Aguardando ${dono}` : 'Sem ação pendente'} texto={proxima.texto + '.'} />} />;
}

function BlocoComprovado({ demanda }: { demanda: TDemanda }) {
  const { abrir } = useComprovante();
  return (
    <Cartao titulo="Coleta comprovada" sub={`${demanda.comprovante!.codigo} · ${Fmt.dataHora(demanda.comprovante!.emitidoEm)}`} classe="acao-viva bom"
      corpo={
        <>
          <Aviso tom="bom" titulo="Existe prova verificável desta destinação"
            texto={`${Fmt.kg(demanda.verificadoKg)} aferidos por ${demanda.destino.nome}, com ${Fmt.kg(Demanda.reciclado(demanda))} recuperados e ${Fmt.kg(Demanda.rejeito(demanda))} de rejeito. Variação final de ${Fmt.percentual(demanda.comprovante!.divergencia)}${Demanda.conciliada(demanda) ? ', liberada pela Prefeitura' : ''}.`} />
          <div className="acoes-form">
            <button className="btn" onClick={() => abrir(demanda.id)}>Ver comprovante</button>
          </div>
        </>
      } />
  );
}

/* ------------------------------------------------------------ GERADOR */

function AcoesGerador({ demanda, recado }: { demanda: TDemanda; recado: Recado }) {
  if (demanda.status === 'CRIADA') {
    return (
      <Cartao titulo="Encaminhar demanda" sub="Ainda não foi enviada à cooperativa." classe="acao-viva"
        corpo={
          <>
            <p className="texto">A demanda vai para <b>{demanda.destino.nome}</b>, que avalia se consegue atender.</p>
            <button className="btn" onClick={async () => {
              try { await Demandas.publicar(demanda.id); recado('Demanda encaminhada à cooperativa.'); }
              catch (erro) { recado((erro as Error).message); }
            }}>Encaminhar</button>
          </>
        } />
    );
  }
  if (demanda.status === 'NAO_ACEITA') {
    const ultimo = demanda.naoAceites[demanda.naoAceites.length - 1];
    return (
      <Cartao corpo={<Aviso tom="alerta" titulo="A cooperativa não conseguiu atender"
        texto={`${ultimo ? ultimo.motivo + ' ' : ''}O seu cadastro passa a sinalizar a necessidade de mais equipamento da cooperativa (RN-008).`} />} />
    );
  }
  if (demanda.status === 'COMPROVADA') return <BlocoComprovado demanda={demanda} />;
  return <Esperando demanda={demanda} />;
}

/* -------------------------------------------------------- COOPERATIVA */

function AcoesCooperativa({ demanda, recado }: { demanda: TDemanda; recado: Recado }) {
  const minha = demanda.destino.id === Sessao.destino.id;
  if (!minha) {
    return <Cartao corpo={<Aviso titulo="Demanda de outra cooperativa" texto={`Endereçada a ${demanda.destino.nome}.`} />} />;
  }
  switch (demanda.status) {
    case 'DISPONIVEL': return <BlocoAvaliar demanda={demanda} recado={recado} />;
    case 'NAO_ACEITA': return <BlocoReavaliar demanda={demanda} recado={recado} />;
    case 'ACEITA': return <BlocoDesignar demanda={demanda} recado={recado} />;
    case 'EM_COLETA': return <BlocoExecucao demanda={demanda} recado={recado} />;
    case 'PENDENCIA_EXECUCAO': return <BlocoRemarcar demanda={demanda} recado={recado} />;
    case 'EM_TRANSPORTE': return <BlocoRecebimento demanda={demanda} recado={recado} />;
    case 'COMPROVADA': return <BlocoComprovado demanda={demanda} />;
    default: return <Esperando demanda={demanda} />;
  }
}

/* RF-008: aceitar ou não aceitar, com motivo. */
function BlocoAvaliar({ demanda, recado }: { demanda: TDemanda; recado: Recado }) {
  const [motivo, setMotivo] = useState('');
  const [recusando, setRecusando] = useState(false);
  return (
    <Cartao titulo="Avaliar a demanda" sub={`${Fmt.litros(demanda.declaradoL)} declarados · cerca de ${Fmt.kg(Demanda.estimativaKg(demanda))} · prazo ${Fmt.prazo(demanda.prazo)}`}
      classe="acao-viva"
      nota="Não aceitar sinaliza no cadastro do gerador a necessidade de mais equipamento da cooperativa (RN-008)."
      corpo={recusando ? (
        <>
          <label className="rot" htmlFor="motivoNaoAceite">Por que a cooperativa não consegue atender</label>
          <input id="motivoNaoAceite" type="text" value={motivo} onChange={e => setMotivo(e.target.value)}
            placeholder="Ex.: caminhão em manutenção" />
          <div className="acoes-form">
            <button className="btn erro" disabled={!motivo.trim()} onClick={async () => {
              try { await Demandas.naoAceitar(demanda.id, motivo); recado('Demanda registrada como não aceita.'); }
              catch (erro) { recado((erro as Error).message); }
            }}>Não aceitar</button>
            <button className="btn sec" onClick={() => setRecusando(false)}>Voltar</button>
          </div>
        </>
      ) : (
        <div className="acoes-form">
          <button className="btn" onClick={async () => {
            try { await Demandas.aceitar(demanda.id); recado('Demanda aceita. Agora designe quem executa.'); }
            catch (erro) { recado((erro as Error).message); }
          }}>Consigo atender</button>
          <button className="btn sec" onClick={() => setRecusando(true)}>Não consigo atender</button>
        </div>
      )} />
  );
}

function BlocoReavaliar({ demanda, recado }: { demanda: TDemanda; recado: Recado }) {
  const ultimo = demanda.naoAceites[demanda.naoAceites.length - 1];
  return (
    <Cartao titulo="Demanda não aceita" sub={ultimo ? `Motivo: ${ultimo.motivo}` : undefined} classe="acao-viva"
      corpo={
        <div className="acoes-form">
          <button className="btn sec" onClick={async () => {
            try { await Demandas.reavaliar(demanda.id); recado('Avaliação reaberta.'); }
            catch (erro) { recado((erro as Error).message); }
          }}>Reavaliar depois de reforçar o equipamento</button>
        </div>
      } />
  );
}

/* RF-009: designar quem da equipe executa. */
function BlocoDesignar({ demanda, recado }: { demanda: TDemanda; recado: Recado }) {
  const [quem, setQuem] = useState('');
  const coopId = Sessao.destino.cooperativa!;
  const equipe = Catalogo.equipeAtiva(coopId);
  return (
    <Cartao titulo="Designar quem executa" sub={`${Catalogo.endereco(demanda.ponto)} · prazo ${Fmt.prazo(demanda.prazo)}`} classe="acao-viva"
      corpo={equipe.length ? (
        <div className="campo-linha">
          <label className="rot" htmlFor="quemDesignar">Cooperado</label>
          <select id="quemDesignar" value={quem} onChange={e => setQuem(e.target.value)}>
            <option value="">Escolha o cooperado</option>
            {equipe.map(c => <option key={c.id} value={c.id}>{c.nome} · {c.zona}</option>)}
          </select>
          <div className="acoes-form">
            <button className="btn" disabled={!quem} onClick={async () => {
              try { await Demandas.designar(demanda.id, quem); recado('Cooperado designado. A coleta está em execução.'); }
              catch (erro) { recado((erro as Error).message); }
            }}>Designar</button>
          </div>
        </div>
      ) : <Aviso tom="alerta" titulo="Sem cooperado ativo" texto="Cadastre a equipe antes de designar." />} />
  );
}

/* RF-011, RF-012: registrar a coleta em campo, sob o acesso da cooperativa. */
function BlocoExecucao({ demanda, recado }: { demanda: TDemanda; recado: Recado }) {
  const [pesoDigitado, setPesoDigitado] = useState<string>(String(Demanda.estimativaKg(demanda)));
  const canal = useSyncExternalStore(CanalRegistro.subscribe, CanalRegistro.getSnapshot, CanalRegistro.getSnapshot).atual;
  const pesada = demanda.coletadoKg != null;
  const fotografada = !!demanda.foto;
  const ponto = Catalogo.ponto(demanda.ponto)!;

  function aoEscolherFoto(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files && evento.target.files[0];
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = () => {
      const imagem = new Image();
      imagem.onload = async () => {
        const escala = Math.min(1, 320 / Math.max(imagem.width, imagem.height));
        const tela = document.createElement('canvas');
        tela.width = Math.round(imagem.width * escala);
        tela.height = Math.round(imagem.height * escala);
        tela.getContext('2d')!.drawImage(imagem, 0, 0, tela.width, tela.height);
        await Demandas.anexarFoto(demanda.id, tela.toDataURL('image/jpeg', 0.6));
        recado('Registro fotográfico anexado à demanda.');
      };
      imagem.onerror = async () => {
        await Demandas.anexarFoto(demanda.id, 'demonstrativa');
        recado('Não foi possível processar essa imagem — foto demonstrativa anexada no lugar.');
      };
      imagem.src = leitor.result as string;
    };
    leitor.onerror = () => recado('Não foi possível ler a foto. Tente outro arquivo.');
    leitor.readAsDataURL(arquivo);
  }

  const passo = (n: number, titulo: string, texto: string, estadoPasso: string, controle: React.ReactNode) => (
    <li className={`passo ${estadoPasso}`}>
      <span className="n">{estadoPasso === 'feito' ? '✓' : n}</span>
      <span className="texto"><b>{titulo}</b><span>{texto}</span></span>
      <span className="controle">{controle}</span>
    </li>
  );

  return (
    <Cartao titulo="Registrar a coleta" sub={`${demanda.catador?.nome || 'Cooperado'} · ${demanda.gerador.nome} · ${ponto.acesso}`} classe="acao-viva"
      nota="A massa observada é gravada uma vez e não muda (RN-023). Se a balança registrar outro valor, as duas ficam na trilha."
      corpo={
        <>
          <div className="campo-linha">
            <label className="rot" htmlFor="canalRegistro">Por onde o registro é feito</label>
            <select id="canalRegistro" value={canal} onChange={e => CanalRegistro.escolher(e.target.value)}>
              {Object.entries(CANAIS).map(([id, c]) => <option key={id} value={id}>{c.nome}</option>)}
            </select>
          </div>
          <ol className="execucao">
            {passo(1, 'Registrar a massa observada', pesada
              ? `${Fmt.kg(demanda.coletadoKg)} registrados. Declarado: ${Fmt.litros(demanda.declaradoL)}.`
              : `O gerador declarou ${Fmt.litros(demanda.declaradoL)}.`,
              pesada ? 'feito' : 'ativo',
              pesada ? null : (
                <>
                  <input type="number" min={1} value={pesoDigitado} aria-label="Massa observada em kg" onChange={e => setPesoDigitado(e.target.value)} />
                  <button className="btn sec" onClick={async () => {
                    const kg = Number(pesoDigitado);
                    if (!kg || kg <= 0) { recado('Informe um peso válido.'); return; }
                    try { await Demandas.registrarPeso(demanda.id, kg, canal); recado(`${Fmt.kg(kg)} registrados.`); }
                    catch (erro) { recado((erro as Error).message); }
                  }}>Salvar</button>
                </>
              ))}

            {passo(2, 'Adicionar foto', fotografada ? 'Evidência anexada à demanda.' : 'Registro fotográfico da carga (opcional, fortalece a prova).',
              fotografada ? 'feito' : 'ativo',
              <>
                {fotografada
                  ? (demanda.foto!.startsWith('data:')
                    ? // eslint-disable-next-line @next/next/no-img-element
                    <img className="foto" src={demanda.foto!} alt="Registro fotográfico da carga" />
                    : <span className="foto-vazia">foto demonstrativa</span>)
                  : <span className="foto-vazia">sem foto</span>}
                <input type="file" accept="image/*" hidden id={`campoFoto-${demanda.id}`} onChange={aoEscolherFoto} />
                <button className="btn sec" onClick={() => document.getElementById(`campoFoto-${demanda.id}`)?.click()}>{fotografada ? 'Trocar' : 'Anexar'}</button>
              </>)}

            {passo(3, 'Fechar a carga', `A carga segue para ${demanda.destino.nome}, que pesa e confirma o recebimento.`,
              pesada ? 'ativo' : '',
              <BotaoConfirmar classe="btn" rotulo="Fechar a carga" rotuloConfirmar="Fechar"
                pergunta={`Fechar a carga e enviar a ${demanda.destino.nome}?`}
                disabled={!pesada}
                onConfirmar={async () => {
                  try { await Demandas.fecharCarga(demanda.id); recado('Carga em transporte. Confirme o recebimento ao pesar.'); }
                  catch (erro) { recado((erro as Error).message); }
                }} />)}
          </ol>
        </>
      } />
  );
}

/* RF-031, RN-041: justificar e remarcar dentro de 96 horas. */
function BlocoRemarcar({ demanda, recado }: { demanda: TDemanda; recado: Recado }) {
  const [justificativa, setJustificativa] = useState('');
  const [data, setData] = useState('');
  const dentro = Demanda.dentroDaJanelaDeExecucao(demanda);
  const limite = demanda.execucao ? Fmt.dataHora(demanda.execucao.prazoJustificativa) : '—';

  if (!dentro) {
    return (
      <Cartao corpo={<Aviso tom="problema" titulo={`Janela de ${JANELA_EXECUCAO_HORAS} horas encerrada em ${limite}`}
        texto="O encaminhamento de coleta não executada depois desse prazo segue pendente de definição na doc (RN-034)." />} />
    );
  }
  return (
    <Cartao titulo="Coleta não executada" sub={`Justifique e remarque até ${limite}`} classe="acao-viva"
      corpo={
        <>
          <div className="form">
            <div className="largo">
              <label className="rot" htmlFor="justificativaExecucao">Justificativa</label>
              <input id="justificativaExecucao" type="text" value={justificativa} onChange={e => setJustificativa(e.target.value)} />
            </div>
            <div>
              <label className="rot" htmlFor="novaData">Nova data da coleta</label>
              <input id="novaData" type="date" value={data} onChange={e => setData(e.target.value)} />
            </div>
          </div>
          <div className="acoes-form">
            <button className="btn" disabled={!justificativa.trim() || !data} onClick={async () => {
              try {
                await Demandas.remarcar(demanda.id, justificativa, new Date(data + 'T17:00:00').toISOString());
                recado('Coleta remarcada. Designe de novo quem executa.');
              } catch (erro) { recado((erro as Error).message); }
            }}>Justificar e remarcar</button>
          </div>
        </>
      } />
  );
}

/* Leitura plausível da balança, estável por demanda; algumas cargas caem fora
   da tolerância de propósito, para a demonstração. */
function leituraSugerida(demanda: TDemanda): number {
  const semente = [...demanda.id].reduce((soma, letra) => soma + letra.charCodeAt(0), 0);
  const desvio = ((semente % 17) - 6) / 100;
  return Math.max(1, Math.round((demanda.coletadoKg || 0) * (1 + desvio)));
}

/* RF-013: a cooperativa, como unidade receptora, confirma o recebimento. */
function BlocoRecebimento({ demanda, recado }: { demanda: TDemanda; recado: Recado }) {
  const [recebido, setRecebido] = useState(() => String(leituraSugerida(demanda)));
  const [rejeito, setRejeito] = useState('');
  const [destinoFinal, setDestinoFinal] = useState('');
  const [lote, setLote] = useState('');
  const [nota, setNota] = useState('');
  const [balanca, setBalanca] = useState('');
  const [afericao, setAfericao] = useState('');
  const [tiquete, setTiquete] = useState<string | null>(null);
  const [qualidade, setQualidade] = useState<QualidadeId | ''>('');
  const [lendo, setLendo] = useState(false);
  const [daBalanca, setDaBalanca] = useState<LeituraBalanca | null>(null);

  const leitura = Number(recebido) || leituraSugerida(demanda);
  const residuo = Catalogo.residuo(demanda.residuo)!;
  const rejeitoTotal = residuo.fluxo === 'REJEITO';
  const rejeitoSugerido = rejeito !== '' ? Number(rejeito) : (rejeitoTotal ? leitura : Math.round(leitura * residuo.perdaTriagem));
  const destinacaoPadrao = Demanda.destinoFinal(demanda);

  return (
    <Cartao titulo="Confirmar recebimento" sub={`${demanda.catador ? demanda.catador.nome : 'Cooperado'} observou ${Fmt.kg(demanda.coletadoKg)} na coleta`} classe="acao-viva"
      corpo={
        <>
          <div className="form">
            <div>
              <label className="rot" htmlFor="campoRecebido">Massa na balança (kg)</label>
              <div className="campo-com-botao">
                <input type="number" id="campoRecebido" min={1} value={recebido}
                  onChange={e => { setRecebido(e.target.value); setDaBalanca(null); }} />
                <button type="button" className="btn sec sm" disabled={lendo}
                  onClick={async () => {
                    setLendo(true);
                    try {
                      const r = await lerDaBalanca(demanda.coletadoKg || 0, demanda.id);
                      setRecebido(String(r.kg));
                      setBalanca(r.balanca);
                      setAfericao(r.afericao);
                      setDaBalanca(r);
                      recado(`Balança leu ${Fmt.kg(r.kg)} · registro ${r.leitura}.`);
                    } finally { setLendo(false); }
                  }}>{lendo ? 'Lendo…' : 'Ler da balança'}</button>
              </div>
              <div className="ajuda">{daBalanca
                ? `Leitura do instrumento, registro ${daBalanca.leitura}. Se você editar o campo, ele volta a valer como digitado.`
                : `Observado na coleta: ${Fmt.kg(demanda.coletadoKg)}. Variação acima de ${Fmt.percentual(Parametros.atual().tolerancia, 0)} abre pendência para a Prefeitura.`}</div>
            </div>
            <div>
              <label className="rot" htmlFor="campoRejeito">Rejeito para o aterro (kg)</label>
              <input type="number" id="campoRejeito" min={0} value={rejeitoSugerido} readOnly={rejeitoTotal} onChange={e => setRejeito(e.target.value)} />
              <div className="ajuda">{rejeitoTotal
                ? 'Rejeito indiferenciado: toda a carga segue para o aterro.'
                : `O que a triagem não aproveita segue para o aterro. Perda típica deste material: ${Fmt.percentual(residuo.perdaTriagem * 100, 0)}.`}</div>
            </div>
            <div>
              <label className="rot" htmlFor="campoDestinoFinal">Destinação declarada (RN-014)</label>
              <input type="text" id="campoDestinoFinal" value={destinoFinal || destinacaoPadrao} onChange={e => setDestinoFinal(e.target.value)} />
            </div>
            <div>
              <label className="rot" htmlFor="campoLote">Lote interno (opcional)</label>
              <input type="text" id="campoLote" placeholder="gerado automaticamente" value={lote} onChange={e => setLote(e.target.value)} />
            </div>
            <div>
              <label className="rot" htmlFor="campoBalanca">Balança utilizada (RN-012)</label>
              <input type="text" id="campoBalanca" placeholder="marca, modelo ou patrimônio" value={balanca} onChange={e => setBalanca(e.target.value)} />
            </div>
            <div>
              <label className="rot" htmlFor="campoAfericao">Aferição do INMETRO</label>
              <input type="text" id="campoAfericao" placeholder="nº da verificação ou validade" value={afericao} onChange={e => setAfericao(e.target.value)} />
            </div>
            <div className="largo">
              <label className="rot" htmlFor="campoTiquete">Tíquete da balança (RN-013)</label>
              <input type="file" id="campoTiquete" accept="image/*" capture="environment"
                onChange={e => {
                  const arquivo = e.target.files?.[0];
                  if (!arquivo) { setTiquete(null); return; }
                  const leitor = new FileReader();
                  leitor.onload = () => setTiquete(String(leitor.result));
                  leitor.readAsDataURL(arquivo);
                }} />
              <div className="ajuda">{tiquete
                ? 'Tíquete anexado: esta carga passa a ter medição comprovada.'
                : 'Sem tíquete, a massa vale como declaração de quem recebeu, não como medição comprovável.'}</div>
            </div>
            <div className="largo">
              <label className="rot" htmlFor="campoQualidade">Separação com que a carga chegou</label>
              <select id="campoQualidade" value={qualidade} onChange={e => setQualidade(e.target.value as QualidadeId | '')}>
                <option value="">Não avaliada</option>
                {QUALIDADES.map(q => (
                  <option key={q.id} value={q.id}>{q.rotulo} · perda típica {Fmt.percentual(q.perda * 100, 0)}</option>
                ))}
              </select>
            </div>
            <div className="largo">
              <label className="rot" htmlFor="campoNotaDestino">Observação (opcional)</label>
              <input type="text" id="campoNotaDestino" placeholder="Carga íntegra, material segregado, tíquete 4471..." value={nota} onChange={e => setNota(e.target.value)} />
            </div>
          </div>
          <div className="acoes-form">
            <BotaoConfirmar rotulo="Confirmar recebimento" rotuloConfirmar="Confirmar"
              pergunta={`Confirmar ${Fmt.kg(leitura)} na balança? Isto emite o comprovante ou abre pendência — não dá para desfazer.`}
              disabled={!leitura || leitura <= 0}
              onConfirmar={async () => {
                try {
                  const d = await Demandas.receber(demanda.id, {
                    kg: leitura, rejeitoKg: rejeitoSugerido, destinoFinal: destinoFinal || destinacaoPadrao,
                    lote, nota, balanca, afericao, tiquete,
                    qualidade: qualidade || undefined,
                    /* Só vale como leitura de instrumento se o número ainda for o da balança. */
                    origemPesagem: daBalanca && daBalanca.kg === leitura ? 'INSTRUMENTO' : 'DIGITADA',
                    leitura: daBalanca && daBalanca.kg === leitura ? daBalanca.leitura : null
                  });
                  recado(d.status === 'PENDENCIA_DIVERGENCIA'
                    ? 'Variação acima da tolerância: pendência aberta para a Prefeitura.'
                    : `Recebimento confirmado. ${Fmt.kg(Demanda.reciclado(d))} recuperados e comprovante emitido.`);
                } catch (erro) { recado((erro as Error).message); }
              }} />
          </div>
        </>
      } />
  );
}

/* ------------------------------------------------ PREFEITURA · TÉCNICO */

/* RF-019, RN-024, RN-025: liberar ou manter, sempre com justificativa. */
function AcoesTecnico({ demanda, recado }: { demanda: TDemanda; recado: Recado }) {
  const [justificativa, setJustificativa] = useState('');

  if (demanda.status === 'PENDENCIA_DIVERGENCIA' && demanda.pendencia?.estado === 'ABERTA') {
    const decidir = async (resultado: 'LIBERADA' | 'MANTIDA') => {
      try {
        await Demandas.decidirPendencia(demanda.id, resultado, justificativa);
        recado(resultado === 'LIBERADA' ? 'Carga liberada e comprovante emitido.' : 'Divergência mantida.');
      } catch (erro) { recado((erro as Error).message); }
    };
    return (
      <Cartao titulo="Decidir a pendência de divergência" sub={`Variação de ${Fmt.percentual(Demanda.divergencia(demanda))} entre a massa observada e a aferida`} classe="acao-viva"
        nota="O critério objetivo para esta decisão ainda não foi definido pela Prefeitura (Contradições e Pontos em Aberto). A decisão fica registrada com autoria, horário e justificativa."
        corpo={
          <>
            <Aviso tom="problema" titulo="As medições originais não mudam"
              texto={`Observado na coleta: ${Fmt.kg(demanda.coletadoKg)}. Aferido na balança: ${Fmt.kg(demanda.verificadoKg)}. Declarado pelo gerador: ${Fmt.litros(demanda.declaradoL)}. Liberar comprova a carga com a massa aferida; manter não libera.`} />
            <label className="rot" htmlFor="justificativaDecisao">Justificativa (obrigatória)</label>
            <input id="justificativaDecisao" type="text" value={justificativa} onChange={e => setJustificativa(e.target.value)} />
            <div className="acoes-form">
              <button className="btn" disabled={!justificativa.trim()} onClick={() => decidir('LIBERADA')}>Liberar a carga</button>
              <button className="btn erro" disabled={!justificativa.trim()} onClick={() => decidir('MANTIDA')}>Manter a divergência</button>
            </div>
          </>
        } />
    );
  }
  return <Leitura demanda={demanda} />;
}

/* ------------------------------------------------------------ BLOCOS */

function BlocoMedicoes({ demanda }: { demanda: TDemanda }) {
  const divergencia = Demanda.divergencia(demanda);
  const dentro = Demanda.dentroDaTolerancia(demanda);
  const recebida = demanda.verificadoKg != null;

  return (
    <Cartao titulo="As três medições da carga" sub="Declarada, observada e aferida (RN-020). Nenhuma é alterada depois de registrada."
      corpo={
        <>
          <div className="medicoes">
            <div className="medicao"><span className="quem">Gerador</span><b className="num">{Fmt.litros(demanda.declaradoL)}</b><span className="origem">declarado</span></div>
            <div className="medicao"><span className="quem">Coleta</span><b className="num">{Fmt.kg(demanda.coletadoKg)}</b><span className="origem">{demanda.coletadoKg == null ? 'aguardando coleta' : 'observado'}</span></div>
            <div className="medicao final"><span className="quem">Balança</span><b className="num">{Fmt.kg(demanda.verificadoKg)}</b>
              <span className="origem">{!recebida ? 'aguardando recebimento' : 'aferido'}</span></div>
          </div>
          {recebida && (
            <>
              <div className={`divergencia ${dentro ? '' : 'acima'}`}>
                <b>Variação de {Fmt.percentual(divergencia)} entre observado e aferido</b>
                <span>{dentro
                  ? `Dentro da tolerância de ${Fmt.percentual(Parametros.atual().tolerancia, 0)}.`
                  : `Acima da tolerância de ${Fmt.percentual(Parametros.atual().tolerancia, 0)}.`}
                  {' '}A comparação com o volume declarado em litros segue em aberto na doc.</span>
              </div>
              {demanda.pendencia && demanda.pendencia.decisoes.length > 0 && (
                <Aviso tom={demanda.pendencia.estado === 'LIBERADA' ? 'bom' : 'problema'}
                  titulo={demanda.pendencia.estado === 'LIBERADA' ? 'Divergência liberada pela Prefeitura' : 'Divergência mantida pela Prefeitura'}
                  texto={demanda.pendencia.decisoes.map(d => `${d.justificativa} (${d.autor}, ${Fmt.dataHora(d.quando)})`).join(' ')} />
              )}
              <div className="destino-material">
                <span className="etiqueta">Destinação declarada</span>
                <BarraRecuperacao ambiental={{ reciclado: Demanda.reciclado(demanda) || 0, rejeito: Demanda.rejeito(demanda) || 0, taxaRecuperacao: Demanda.taxaRecuperacao(demanda) }} />
                <p>{Demanda.destinoFinal(demanda)}</p>
              </div>
            </>
          )}
        </>
      } />
  );
}

function BlocoDados({ demanda }: { demanda: TDemanda }) {
  const ponto = Catalogo.ponto(demanda.ponto)!;
  return (
    <Cartao titulo="Dados da demanda" corpo={
      <>
        <div className="campos">
          <div className="campo"><div className="rot">Gerador</div><div className="val">{demanda.gerador.nome}
            <small>{Catalogo.gerador(demanda.gerador.id)?.cnpj || ''}</small></div></div>
          <div className="campo"><div className="rot">Resíduo</div><div className="val">{Catalogo.nomeResiduo(demanda.residuo)}
            <small>{demanda.origem === 'CONTRATO' ? 'prevista em contrato' : 'coleta avulsa'}</small></div></div>
          <div className="campo"><div className="rot">Quantidade declarada</div><div className="val num">{Fmt.litros(demanda.declaradoL)}</div></div>
          <div className="campo"><div className="rot">Ponto de coleta</div><div className="val">{ponto.bairro}
            <small>{ponto.zona} · {ponto.acesso}</small></div></div>
          <div className="campo"><div className="rot">Prazo</div><div className="val">{Fmt.data(demanda.prazo)}<small>{Fmt.prazo(demanda.prazo)}</small></div></div>
          <div className="campo"><div className="rot">Cooperado designado</div><div className="val">{demanda.catador ? demanda.catador.nome : '—'}
            <small>{demanda.catador ? 'executa sob o acesso da cooperativa' : 'ainda sem designação'}</small></div></div>
          <div className="campo"><div className="rot">Cooperativa receptora</div><div className="val">{demanda.destino.nome}
            <small>{demanda.recebidaEm ? 'recebido em ' + Fmt.dataHora(demanda.recebidaEm) : 'recebe e pesa a carga'}</small></div></div>
          <div className="campo"><div className="rot">Lote</div><div className="val mono">{demanda.lote ? demanda.lote : '—'}
            <small>{demanda.lote ? 'registro interno da cooperativa' : 'gerado no recebimento'}</small></div></div>
        </div>
        {demanda.observacao && <Aviso titulo="Observação do gerador" texto={demanda.observacao} />}
      </>
    } />
  );
}

function ListaEventos({ eventos }: { eventos: TDemanda['eventos'] }) {
  return (
    <ol className="trilha">
      {eventos.slice().reverse().map((e, i) => (
        <li key={i} data-autor={e.autor}>
          <span className="quando">{Fmt.dataHora(e.quando)} · <span className="autor">{e.autor}</span></span>
          <b>{e.titulo}</b>
          <p>{e.detalhe}</p>
        </li>
      ))}
    </ol>
  );
}

function BlocoTrilha({ demanda }: { demanda: TDemanda }) {
  return (
    <Cartao titulo="Trilha do ciclo" sub={`${demanda.eventos.length} registro(s), com autoria e horário`} classe="grudenta"
      corpo={<ListaEventos eventos={demanda.eventos} />} />
  );
}
