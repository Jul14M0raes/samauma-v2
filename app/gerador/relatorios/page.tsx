'use client';

import { Cabecalho, Cartao, Exportar, Kpi, Kpis, Pares } from '@/components/ui/Basicos';
import { GraficoRosca, Ranking } from '@/components/ui/Graficos';
import { useExportar } from '@/components/relatorio/useExportar';
import { agoraMs, Fmt, haDias } from '@/lib/dominio/formato';
import { Painel } from '@/lib/dominio/indicadores';
import { Sessao } from '@/lib/dominio/sessao';
import { useDominio } from '@/state/hooks';

export default function PaginaGeradorRelatorios() {
  useDominio();
  const { aoCsv, aoXls, aoPdf } = useExportar();
  const p = Painel.gerador(Sessao.gerador);
  const corte = haDias(30);
  const doMes = p.demandas.filter(d => d.status === 'COMPROVADA' && new Date(d.comprovante!.emitidoEm).getTime() >= corte);
  const ambientalMes = Painel.ambiental(doMes);
  const materiaisMes = Painel.porResiduo(doMes);
  const origem = Painel.porOrigem(p.demandas);

  return (
    <>
      <Cabecalho titulo="Relatórios" texto="Exportação do seu histórico completo, em planilha ou documento." />

      <Cartao titulo="Relatório mensal" sub={`Competência ${Fmt.mes(new Date(agoraMs()).toISOString())} · ${doMes.length} carga(s) comprovada(s)`}
        classe="acao-viva"
        acao={<Exportar escopo="mensal" aoCsv={e => aoCsv(e, { id: Sessao.gerador })} aoXls={e => aoXls(e, { id: Sessao.gerador })} aoPdf={e => aoPdf(e, { id: Sessao.gerador })} />}
        nota="O relatório mensal traz quantidade coletada, tipo de resíduo, quanto foi reciclado e o destino final de cada carga."
        corpo={
          <>
            <Kpis>
              <Kpi rotulo="Quantidade coletada" valor={Fmt.kg(ambientalMes.massa)} sub="pesada na balança do destino" />
              <Kpi rotulo="Quanto foi reciclado" valor={Fmt.kg(ambientalMes.reciclado)} sub={`${Fmt.percentual(ambientalMes.taxaRecuperacao, 0)} de recuperação`} tom="ok" />
              <Kpi rotulo="Rejeito ao aterro" valor={Fmt.kg(ambientalMes.rejeito)} sub="disposição final" tom="alerta" />
              <Kpi rotulo="Comprovantes" valor={doMes.length} sub="no período" tom="marca" />
            </Kpis>
            <div className="colunas dois-um" style={{ marginTop: 'var(--e4)' }}>
              <Cartao titulo="Tipo de resíduo" sub="Composição do mês" classe="sem-sombra" corpo={<GraficoRosca itens={materiaisMes} />} />
              <Cartao titulo="Destino final" sub="Declarado por quem recebeu" classe="sem-sombra"
                corpo={<Ranking itens={Painel.porDestino(doMes).map(d => ({ ...d, nota: d.destinoFinal }))} />} />
            </div>
          </>
        } />

      <Cartao titulo="Relatório ESG" sub="Ambiental, social e governança — a partir do que já foi medido neste cadastro"
        nota="Nenhum número aqui é declarado à parte: ambiental e governança vêm das demandas com comprovante; social vem da cooperativa que executou a coleta."
        corpo={(() => {
          const social = Painel.social(p.demandas);
          return (
            <div className="esg-pilares">
              <div className="esg-pilar">
                <p className="etiqueta">Ambiental</p>
                <Kpis>
                  <Kpi rotulo="Massa recuperada" valor={Fmt.toneladas(p.ambiental.reciclado)} sub={`${Fmt.percentual(p.ambiental.taxaRecuperacao ?? 0, 0)} de recuperação`} tom="ok" />
                  <Kpi rotulo="CO₂e evitado" valor={Fmt.kg(Math.round(p.ambiental.co2Evitado))} sub="pela massa recuperada" />
                  <Kpi rotulo="Rejeito ao aterro" valor={Fmt.kg(p.ambiental.rejeito)} sub="disposição final" tom="alerta" />
                </Kpis>
              </div>
              <div className="esg-pilar">
                <p className="etiqueta">Social</p>
                <Kpis>
                  <Kpi rotulo="Renda gerada" valor={Fmt.reais(social.renda)} sub={`${social.cooperados} cooperado(s) atendido(s)`} tom="marca" />
                  <Kpi rotulo="Renda média por cooperado" valor={Fmt.reais(social.rendaMediaPorCatador)} sub="no período" />
                </Kpis>
              </div>
              <div className="esg-pilar">
                <p className="etiqueta">Governança</p>
                <Kpis>
                  <Kpi rotulo="Situação regulatória" valor={p.situacao.rotulo} tom={p.situacao.tom as 'ok' | 'alerta' | 'erro'} />
                  <Kpi rotulo="Taxa de comprovação" valor={p.taxaComprovacao != null ? Fmt.percentual(p.taxaComprovacao, 0) : '—'} sub="das demandas cobráveis" />
                </Kpis>
              </div>
            </div>
          );
        })()} />

      <Cartao titulo="Prestação de contas" sub={`${p.total} demanda(s) registradas desde o início`}
        acao={<Exportar escopo="gerador" rotulo="Baixar tudo" aoCsv={e => aoCsv(e, { id: Sessao.gerador })} aoXls={e => aoXls(e, { id: Sessao.gerador })} aoPdf={e => aoPdf(e, { id: Sessao.gerador })} />}
        nota="A planilha traz uma linha por demanda, com a origem (contrato ou avulsa), massa observada e aferida, rejeito, MTR e comprovante."
        corpo={<Pares itens={[
          ['Demandas registradas', Fmt.numero(p.total)],
          ['Destinações comprovadas', Fmt.numero(p.comprovadas)],
          ['Previstas em contrato', `${origem.contrato.comprovadas} de ${origem.contrato.total} comprovada(s) · ${Fmt.kg(origem.contrato.massa)}`],
          ['Avulsas', `${origem.avulsa.comprovadas} de ${origem.avulsa.total} comprovada(s) · ${Fmt.kg(origem.avulsa.massa)}`],
          ['Massa destinada', Fmt.kg(p.ambiental.massa)],
          ['Massa recuperada', Fmt.kg(p.ambiental.reciclado)],
          ['Rejeito ao aterro', Fmt.kg(p.ambiental.rejeito)],
          ['Valor movimentado', Fmt.reais(p.financeiro.valor)],
          ['CO₂e evitado', Fmt.kg(Math.round(p.ambiental.co2Evitado))]
        ]} />} />
    </>
  );
}
