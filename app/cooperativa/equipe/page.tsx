'use client';

/* Minha equipe — faltava: `Painel.cooperativa()` já calculava o roster com
   produção por cooperado (`equipe`) e quem está em campo agora (`emCampo`),
   mas só era consumido pelo painel do catador (pra mostrar "minha equipe"
   do lado dele). A própria cooperativa não tinha onde ver isso.

   As duas listas viraram uma só: mostrar "quem está em campo" separado de
   "quanto cada um produziu" cortava a mesma pessoa em dois lugares, sem
   nunca responder "o que o Antônio está fazendo agora" numa olhada só. Por
   pessoa é o corte que combina com o nome da tela. A visão cruzada por
   urgência (o que vence primeiro, seja de quem for) já mora em "A caminho",
   que é a aba certa para isso. */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BotaoConfirmar, Cabecalho, Cartao, Kpi, Kpis, Pino, SituacaoDemanda, Vazio } from '@/components/ui/Basicos';
import { useRecado } from '@/components/layout/RecadoProvider';
import { Catalogo } from '@/lib/dominio/catalogo';
import { zonasDeCadastro } from '@/lib/dominio/formularios';
import { Fmt } from '@/lib/dominio/formato';
import { Painel } from '@/lib/dominio/indicadores';
import { Sessao } from '@/lib/dominio/sessao';
import { useDominio } from '@/state/hooks';
import { Cadastros } from '@/lib/dados/cadastros';

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] || '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase() || '—';
}

/* Um avatar por pessoa, não um só repetido pra equipe inteira — senão a
   cor do círculo não ajuda a achar ninguém, só decora. Cores da própria
   marca (nada novo), cicladas por posição no ranking: estável entre
   renders, sem precisar guardar preferência de ninguém. */
const CORES_AVATAR = ['var(--azul)', 'var(--teal)', 'var(--raiz)', 'color-mix(in srgb, var(--azul) 45%, var(--raiz))'];

export default function PaginaCooperativaEquipe() {
  useDominio();
  const router = useRouter();
  const recado = useRecado();
  const [abrindo, setAbrindo] = useState(false);
  const coopId = Sessao.destino.cooperativa || Sessao.destino.id;
  const p = Painel.cooperativa(coopId);

  if (!p) return <Vazio titulo="Sem equipe vinculada" texto="Esta unidade não é uma cooperativa com catadores cooperados." />;

  return (
    <>
      <Cabecalho titulo="Minha equipe" texto={`${p.cadastro.nome} · ${p.catadores} cooperado(s)`}
        acao={<button className="btn" onClick={() => setAbrindo(v => !v)}>
          {abrindo ? 'Fechar' : 'Admitir cooperado'}
        </button>} />

      {abrindo && <FormularioAdmissao aoConcluir={() => setAbrindo(false)} />}

      <Kpis>
        <Kpi rotulo="Catadores ativos" valor={p.catadores} sub="cooperados nesta unidade" tom="marca" />
        <Kpi rotulo="Em campo agora" valor={p.emCampo.length} sub="aceita, coletando ou a caminho" tom={p.emCampo.length ? 'alerta' : 'ok'} />
        <Kpi rotulo="Capacidade disponível" valor={Fmt.percentual(p.disponibilidade, 0)} sub="da rota semanal da equipe" />
        <Kpi rotulo="Pendências" valor={p.pendencias} sub="em conciliação na Prefeitura" tom={p.pendencias ? 'erro' : 'ok'} />
      </Kpis>

      <Cartao titulo="Cooperados" sub="Produção comprovada e o que cada um carrega agora, do maior pro menor"
        nota="A cooperativa organiza o trabalho; a coleta continua sendo de cada catador — a ordem aqui é só quem trouxe mais massa comprovada."
        corpo={
          <ul className="equipe-grade">
            {p.equipe.map((m, i) => {
              const ativos = p.emCampo.filter(d => d.catador?.id === m.id);
              const cadastro = Catalogo.catador(m.id);
              const desligado = !!cadastro?.desligamento;
              return (
                <li key={m.id} className="equipe-membro" style={desligado ? { opacity: 0.72 } : undefined}>
                  <div className="equipe-topo">
                    <span className="equipe-avatar" aria-hidden="true" style={{ ['--avatar-cor' as string]: CORES_AVATAR[i % CORES_AVATAR.length] }}>{iniciais(m.nome)}</span>
                    <div className="equipe-quem">
                      <b>{m.nome}</b>
                      <span className="equipe-desde">Cooperado desde {Fmt.data(m.desde)}</span>
                    </div>
                    {desligado
                      ? <Pino rotulo="Desligado" tom="neutro" />
                      : ativos.length
                        ? <Pino rotulo={`Em campo · ${ativos.length}`} tom="alerta" />
                        : <Pino rotulo="Livre agora" tom="ok" />}
                  </div>

                  {desligado && (
                    <p className="ajuda">
                      Desligado em {Fmt.data(cadastro!.desligamento!.quando)} · {cadastro!.desligamento!.motivo || 'sem motivo registrado'}.
                      A produção abaixo continua valendo na trilha.
                    </p>
                  )}

                  <div className="equipe-caixa">
                    <div><b className="num">{Fmt.kg(m.massa)}</b><span>comprovados</span></div>
                    <div><b className="num">{m.atendimentos}</b><span>atendimento(s)</span></div>
                  </div>

                  <div className="equipe-progresso">
                    <span className="equipe-trilho"><span className="equipe-preenche" style={{ ['--p' as string]: `${m.parte.toFixed(1)}%` }}></span></span>
                    <span className="equipe-percent num">{Fmt.percentual(m.parte, 0)} da equipe</span>
                  </div>

                  {ativos.length
                    ? (
                      <ul className="equipe-ativos">
                        {ativos.map(d => (
                          <li key={d.id}>
                            <button type="button" onClick={() => router.push(`/cooperativa/demandas/${d.id}`)}>{d.gerador.nome}</button>
                            <SituacaoDemanda demanda={d} />
                          </li>
                        ))}
                      </ul>
                    )
                    : <p className="equipe-livre">Sem carga em rota agora.</p>}

                  <div className="acoes-form">
                    {desligado
                      ? <button className="btn sec sm" onClick={async () => {
                          await Cadastros.religarCooperado(m.id);
                          recado(`${m.nome} voltou à equipe e já pode receber demanda.`);
                        }}>Religar</button>
                      : <BotaoConfirmar rotulo="Desligar" rotuloConfirmar="Confirmar desligamento"
                          pergunta={ativos.length
                            ? `${m.nome} tem ${ativos.length} carga(s) em rota. O desligamento não cancela essas cargas — só impede designação nova. Confirmar?`
                            : `Desligar ${m.nome}? Para de receber demanda nova; a produção já registrada continua valendo.`}
                          onConfirmar={async () => {
                            await Cadastros.desligarCooperado(m.id, ativos.length
                              ? 'Desligado com carga em rota'
                              : 'Desligado pela coordenação');
                            recado(`${m.nome} saiu da equipe. O histórico continua na trilha.`);
                          }} />}
                  </div>
                </li>
              );
            })}
          </ul>
        } />
    </>
  );
}

/* Admissão de cooperado pela própria coordenação.

   O cadastro público já criava catador; o que faltava era a cooperativa poder
   admitir alguém sem mandar a pessoa preencher formulário de rua. É a mesma
   máquina de cadastro (`Cadastro.criar`), com a cooperativa já preenchida e
   as validações intactas — inclusive a de nome repetido, que é o que evita
   dois "João Silva" indistinguíveis na designação. */
function FormularioAdmissao({ aoConcluir }: { aoConcluir: () => void }) {
  const recado = useRecado();
  const [dados, setDados] = useState<Record<string, string>>({
    nome: '', veiculo: '', zona: '', metaSemanal: '150'
  });
  const [erros, setErros] = useState<Record<string, string>>({});

  const mudar = (campo: string, valor: string) => {
    setDados(d => ({ ...d, [campo]: valor }));
    setErros(e => ({ ...e, [campo]: '' }));
  };

  async function admitir() {
    const { registro, erros: falhas } = await Cadastros.admitirCooperado(dados);
    if (!registro) { setErros(falhas); return; }
    recado(`${registro.nome} entrou na equipe.`);
    aoConcluir();
  }

  return (
    <Cartao titulo="Admitir cooperado" sub="Entra na equipe e já pode receber demanda"
      nota="A pessoa passa a existir para todo o sistema: aparece na fila de designação e na identificação do programa municipal. O cooperado trabalha sob a cooperativa e não tem acesso próprio ao sistema."
      corpo={
        <>
          <div className="form">
            <div>
              <label className="rot" htmlFor="admNome">Nome completo</label>
              <input type="text" id="admNome" value={dados.nome}
                onChange={e => mudar('nome', e.target.value)} placeholder="Maria de Souza" />
              {erros.nome && <div className="ajuda erro">{erros.nome}</div>}
            </div>
            <div>
              <label className="rot" htmlFor="admVeiculo">Veículo ou equipamento</label>
              <input type="text" id="admVeiculo" value={dados.veiculo}
                onChange={e => mudar('veiculo', e.target.value)} placeholder="Carroça, triciclo, caminhonete…" />
              {erros.veiculo && <div className="ajuda erro">{erros.veiculo}</div>}
            </div>
            <div>
              <label className="rot" htmlFor="admZona">Zona de trabalho</label>
              <select id="admZona" value={dados.zona} onChange={e => mudar('zona', e.target.value)}>
                <option value="">Selecione…</option>
                {zonasDeCadastro().map(z => <option key={z} value={z}>{z}</option>)}
              </select>
              {erros.zona && <div className="ajuda erro">{erros.zona}</div>}
            </div>
            <div>
              <label className="rot" htmlFor="admMeta">Meta semanal (kg)</label>
              <input type="number" id="admMeta" min={1} value={dados.metaSemanal}
                onChange={e => mudar('metaSemanal', e.target.value)} />
              <div className="ajuda">Combinada com a pessoa. Serve para calcular a capacidade da equipe, não para cobrar.</div>
              {erros.metaSemanal && <div className="ajuda erro">{erros.metaSemanal}</div>}
            </div>
          </div>
          <div className="acoes-form">
            <button className="btn" onClick={admitir}>Admitir na equipe</button>
            <button className="btn sec" onClick={aoConcluir}>Cancelar</button>
          </div>
        </>
      } />
  );
}
