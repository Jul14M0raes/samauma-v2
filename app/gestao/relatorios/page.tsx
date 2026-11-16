'use client';

/* RF-027: o Painel de gestão exporta o relatório do município em .xls e .pdf. */

import { useExportar } from '@/components/relatorio/useExportar';
import { Cabecalho, Cartao, Exportar, Kpi, Kpis } from '@/components/ui/Basicos';
import { Fmt } from '@/lib/dominio/formato';
import { Painel } from '@/lib/dominio/indicadores';
import { useDominio } from '@/state/hooks';

export default function PaginaGestaoRelatorios() {
  useDominio();
  const { aoCsv, aoXls, aoPdf } = useExportar();
  const m = Painel.municipio();
  return (
    <>
      <Cabecalho titulo="Relatórios" texto="Exportação dos processos do município." />
      <Cartao titulo="Relatório municipal de destinação"
        sub={`${m.total} processo(s) · ${m.comprovadas} com destinação comprovada`}
        acao={<Exportar escopo="prefeitura" rotulo="Baixar" aoCsv={aoCsv} aoXls={aoXls} aoPdf={aoPdf} />}
        corpo={
          <Kpis>
            <Kpi rotulo="Massa recebida" valor={Fmt.toneladas(m.ambiental.massa)} sub="aferida na balança" tom="marca" />
            <Kpi rotulo="Taxa de comprovação" valor={Fmt.percentual(m.taxaComprovacao, 0)} sub="do que foi declarado" tom="ok" />
            <Kpi rotulo="Pendências" valor={m.pendentes} sub="aguardando o Técnico" tom={m.pendentes ? 'erro' : 'ok'} />
          </Kpis>
        } />
    </>
  );
}
