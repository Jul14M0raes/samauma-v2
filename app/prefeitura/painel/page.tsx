'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cabecalho, Cartao, Aviso, Kpi, Kpis } from '@/components/ui/Basicos';
import { BarraRecuperacao, GraficoRosca, Ranking } from '@/components/ui/Graficos';
import { ListaDemandas } from '@/components/ui/Listas';
import { MapaDinamico as Mapa } from '@/components/mapa/MapaDinamico';
import { AtividadesRecentes, TabelaGeradores } from '@/components/prefeitura/AtividadesTabela';
import { GraficoConformidade } from '@/components/prefeitura/PainelPecas';
import { COOPERATIVAS } from '@/lib/dominio/catalogo';
import { Fluxos } from '@/lib/dominio/fluxos';
import { Parametros } from '@/lib/dominio/parametros';
import { Fmt, somar } from '@/lib/dominio/formato';
import { Painel } from '@/lib/dominio/indicadores';
import { Sessao } from '@/lib/dominio/sessao';
import { Store } from '@/lib/dominio/store';
import { useDominio } from '@/state/hooks';

export default function PaginaPrefeituraPainel() {
  useDominio();
  const router = useRouter();
  const p = Painel.municipio();
  const totalGeradores = p.geradores.length;
  const regularizados = p.geradores.filter(g => g.situacao.id === 'REGULAR').length;
  const cooperativasAtivas = p.cooperativas.length;

  const semana = p.serie.slice(-7);
  const semanaAnterior = p.serie.slice(0, 7);
  const recicladoSemana = somar(semana, 'reciclado');
  const recicladoSemanaAnterior = somar(semanaAnterior, 'reciclado');
  const variacaoTonelada = recicladoSemanaAnterior ? ((recicladoSemana - recicladoSemanaAnterior) / recicladoSemanaAnterior) * 100 : null;
  const economiaSemana = (recicladoSemana / 1000) * Parametros.tarifaAterro;
  const economiaSemanaAnterior = (recicladoSemanaAnterior / 1000) * Parametros.tarifaAterro;
  const variacaoEconomia = economiaSemanaAnterior ? ((economiaSemana - economiaSemanaAnterior) / economiaSemanaAnterior) * 100 : null;

  const pendencias = Store.pendentes();
  /* RF-030: o Painel de gestão vê a versão completa, só leitura; o Técnico vê
     a resumida e navega para as fichas e processos. */
  const gestao = Sessao.perfil === 'gestao';

  return (
    <>
      {/* A base legal e a origem de cada numero ficam a um clique do painel: e a
          primeira coisa que a Procuradoria pergunta, e antes disso estava
          escondida no fim da tela de relatorios. */}
      <Cabecalho titulo="Visão geral" texto="Acompanhe os principais indicadores e atividades do sistema."
        chips={['Porto Velho / RO', `${p.serie[0].rotulo} – ${p.serie[p.serie.length - 1].rotulo}`]}
        acao={gestao ? undefined : <Link className="btn sec sm" href="/prefeitura/metodologia">Metodologia e base legal</Link>} />

      <Kpis classe="cinco">
        <Kpi icone="predio" cor="var(--azul)" rotulo="Geradores regularizados" valor={regularizados} sub={`de ${totalGeradores} cadastrados`} />
        <Kpi icone="tonelada" cor="var(--ouro-fundo)" rotulo="Toneladas desviadas de aterro" valor={Fmt.toneladas(p.ambiental.reciclado)} variacao={variacaoTonelada} pontos={semana.map(d => d.reciclado)} />
        <Kpi icone="moeda" cor="var(--ok)" rotulo="Economia realizada" valor={Fmt.reais(p.financeiro.custoAterroEvitado)} variacao={variacaoEconomia} pontos={semana.map(d => d.reciclado)} />
        <Kpi icone="grupo" cor="var(--raiz)" rotulo="Cooperativas ativas" valor={cooperativasAtivas} sub={`de ${COOPERATIVAS.length} cadastradas`} />
        <Kpi icone="recibo" cor="var(--teal)" rotulo="Comprovantes emitidos" valor={p.comprovadas} sub={`${p.pendentes} pendência(s) em aberto`} />
        <Kpi icone="relogio" cor="var(--erro)" rotulo="Demandas atrasadas" valor={p.atrasadas} sub="prazo vencido sem coleta" />
      </Kpis>

      <div className="colunas duas">
        <Cartao titulo="Para onde vai o resíduo do município" sub="Massa comprovada, separada entre o que voltou ao ciclo e o que foi aterrado"
          nota="Massa coletada não é massa reciclada: o rejeito da triagem e o resíduo indiferenciado seguem para o aterro sanitário."
          corpo={
            <>
              <BarraRecuperacao ambiental={p.ambiental} />
              <div className="micro-kpis">
                <div><b className="num">{Fmt.toneladas(p.ambiental.massaAterrada)}</b><span>enviada direto ao aterro</span></div>
                <div><b className="num">{p.ambiental.cargasAterro}</b><span>cargas de rejeito</span></div>
                <div><b className="num">{Fmt.kg(Math.round(p.ambiental.co2Evitado))}</b><span>CO₂e evitado</span></div>
              </div>
            </>
          } />
        <Cartao titulo="Composição do destino" sub="Recuperado × enviado ao aterro"
          corpo={
            <GraficoRosca itens={[
              { nome: 'Recuperado', kg: p.ambiental.reciclado, cor: 'var(--verde)', parte: p.ambiental.taxaRecuperacao || 0 },
              { nome: 'Para o aterro', kg: p.ambiental.rejeito, cor: 'var(--tinta3)', parte: 100 - (p.ambiental.taxaRecuperacao || 0) }
            ]} />
          } />
      </div>

      <div className="painel-secao">
        <p className="painel-secao-titulo">Território e conformidade</p>
        <div className="colunas painel-linha">
          <Cartao titulo="Mapa de geradores" sub="Situação regulatória por ponto de coleta"
            acao={<button className="btn sec sm" onClick={() => router.push(gestao ? '/gestao/mapa' : '/prefeitura/mapa')}>Ver todos</button>}
            corpo={<Mapa itens={p.geradores} aoClicar={gestao ? undefined : id => router.push(`/prefeitura/geradores/${id}`)} />} />
          <Cartao titulo="Conformidade ao longo do tempo" sub={`Últimos ${p.serie.length} dias`} corpo={<GraficoConformidade serie={p.serie} />} />
          <Cartao titulo="Atividades recentes"
            acao={gestao ? undefined : <button className="btn sec sm" onClick={() => router.push('/prefeitura/fiscalizacao')}>Ver todas</button>}
            corpo={<AtividadesRecentes demandas={Store.todas()} />} />
        </div>
      </div>

      <div className="painel-secao">
        <p className="painel-secao-titulo">Quem gera e quem coleta</p>

      {gestao && (<>
      {/* Circularidade, num cartão só.

          Aqui havia três: "os quatro fluxos", "do aterro desviado ao ciclo
          fechado" e "separação na origem". Foram somados um a um, cada
          um justificado sozinho, e o resultado foi um painel de quatorze
          cartões numa rolagem -- onde ninguém acha nada.

          Os três respondiam à mesma pergunta em três recortes: o material
          voltou mesmo à produção? A explicação de regime de cada fluxo saiu
          daqui e ficou só na metodologia, que é onde ela é consultada; o que
          resta é o número. */}
      <Cartao titulo="Do aterro desviado ao ciclo fechado"
        sub="Destinação comprovada não é o mesmo que reciclagem comprovada"
        acao={gestao ? undefined : <Link className="btn sec sm" href="/prefeitura/metodologia">Regime de cada fluxo</Link>}
        nota="A recuperação é estimada pela tabela de perda de triagem. A destinação depois do recebimento fica fora do piloto (RN-035)."
        corpo={(() => {
          const sep = Painel.separacao(Store.todas());
          const porFluxo = Fluxos.apurar(Store.todas());
          const ambiental = Painel.ambiental(Store.todas());

          return (
            <>
              <Kpis>
                <Kpi rotulo="Recuperação estimada"
                  valor={ambiental.taxaRecuperacao != null ? Fmt.percentual(ambiental.taxaRecuperacao) : '—'}
                  sub="por tabela de perda de triagem" destaque />
                <Kpi rotulo="Separação na origem"
                  valor={sep.indice != null ? Fmt.percentual(sep.indice, 0) : '—'}
                  sub={`${Fmt.kg(sep.perdaEvitavelKg)} perdidos por mistura`}
                  tom={sep.indice != null && sep.indice >= 50 ? 'ok' : 'alerta'} />
              </Kpis>

              {/* Massa por fluxo, uma linha cada. O regime jurídico de cada um
                  está na metodologia; aqui fica só o que muda todo mês. */}
              <div className="micro-kpis">
                {porFluxo.filter(l => l.massa > 0).map(l => (
                  <div key={l.fluxo.id}>
                    <b className="num" style={{ color: l.fluxo.cor }}>{Fmt.toneladas(l.massa)}</b>
                    <span>{l.fluxo.nome.toLowerCase()}</span>
                  </div>
                ))}
              </div>

            </>
          );
        })()} />

      <Cartao titulo="Inclusão produtiva" sub="Por onde a massa comprovada do município passou"
        classe="acao-viva"
        nota="A Lei nº 12.305/2010 põe a inclusão de catadores entre os objetivos da Política Nacional. Aqui, a parte da massa comprovada de estabelecimentos com contrato vigente com cooperativa. O escopo dos indicadores do município segue em aberto na doc (MOD-007)."
        corpo={(() => {
          const i = Painel.inclusaoProdutiva();
          return (
            <>
              <Kpis>
                <Kpi rotulo="Com contrato com cooperativa" valor={Fmt.percentual(i.taxaInclusao, 0)}
                  sub={`${Fmt.toneladas(i.massaIncluida)} de ${Fmt.toneladas(i.total)}`} tom="ok" destaque />
                <Kpi rotulo="Cooperativas" valor={Fmt.toneladas(i.cooperativa.massa)}
                  sub={`${Fmt.percentual(i.cooperativa.parte, 0)} · ${i.cooperativa.geradores} estabelecimento(s)`} />
                <Kpi rotulo="Sem contrato vigente" valor={Fmt.toneladas(i.semOperador.massa)}
                  sub={`${Fmt.percentual(i.semOperador.parte, 0)} · ${i.semOperador.geradores} estabelecimento(s)`} tom="alerta" />
              </Kpis>
            </>
          );
        })()} />

      </>)}

      <Cartao titulo="Indicadores principais" sub="Sem número digitado — tudo deriva das demandas registradas"
        corpo={
          <Kpis classe="cinco">
            <Kpi icone="crescer" cor="var(--ok)" rotulo="Taxa de comprovação" valor={Fmt.percentual(p.taxaComprovacao, 0)} sub="do que foi criado" />
            <Kpi icone="relogio" cor="var(--azul)" rotulo="Ciclo médio" valor={Fmt.duracao(p.cicloMedio)} sub="da criação ao comprovante" />
            <Kpi icone="caminhao" cor="var(--ouro-fundo)" rotulo="Demandas em andamento" valor={p.emAndamento} sub={`${p.emTransporte} a caminho`} />
            <Kpi icone="balanca" cor="var(--teal)" rotulo="Divergência média" valor={Fmt.percentual(p.divergenciaMedia)} sub="observado × aferido" />
            <Kpi icone="moeda" cor="var(--raiz)" rotulo="Renda gerada p/ cooperados" valor={Fmt.reais(p.social.renda)} sub={`${p.social.cooperados} cooperado(s)`} />
            <Kpi icone="pessoa" cor="var(--lima)" rotulo="Renda média por cooperado" valor={Fmt.reais(p.social.rendaMediaPorCatador)} sub={`${p.social.catadoresAtivos} ativos`} />
          </Kpis>
        } />

      <div className="colunas dois-um">
        <Cartao titulo="Maiores geradores" sub="Por massa destinada com prova"
          acao={gestao ? undefined : <button className="btn sec sm" onClick={() => router.push('/prefeitura/cadastros')}>Ver todos</button>}
          corpo={<TabelaGeradores geradores={p.geradores} />} />
        <Cartao titulo="Desempenho das cooperativas" sub="Massa comprovada no período"
          corpo={<Ranking itens={p.cooperativas.slice().sort((a, b) => b.massa - a.massa)
            .map(c => ({ ...c, nota: `${c.catadores} cooperado(s) · ${c.atendimentos} atendimento(s)` }))} />} />
      </div>

      {pendencias.length ? (
        <Cartao titulo="Onde existe problema" sub={`${pendencias.length} divergência(s) acima da tolerância`} classe="destaque-erro"
          nota="Divergência não é punição: as medições ficam intactas e a decisão é humana (RN-023, RN-025)."
          corpo={<ListaDemandas demandas={pendencias} aoAbrir={gestao ? undefined : id => router.push(`/prefeitura/demandas/${id}`)} />} />
      ) : (
        <Cartao titulo="Pendências" corpo={<Aviso tom="bom" titulo="Sem divergências abertas" texto="Todas as cargas fecharam dentro da tolerância." />} />
      )}
      </div>

    </>
  );
}
