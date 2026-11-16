'use client';

/* Relatórios do município. A exportação municipal já existia no controle
   `Exportar` das telas de Processos e Geradores, mas quem procura relatório
   procura uma aba chamada Relatórios — e não achava. Esta tela reúne as saídas
   do município num lugar previsível, sem duplicar regra: usa o mesmo escopo
   `prefeitura` do serviço de relatório. */

import Link from 'next/link';
import { useState } from 'react';

import { VistaParametros } from '@/components/prefeitura/VistaParametros';
import { useExportar } from '@/components/relatorio/useExportar';
import { idAba, idPainel, SubAbas } from '@/components/ui/SubAbas';
import { Cabecalho, Cartao, Exportar, Kpi, Kpis, Pares } from '@/components/ui/Basicos';
import { GraficoRosca, Ranking } from '@/components/ui/Graficos';
import { Fmt } from '@/lib/dominio/formato';
import { Painel } from '@/lib/dominio/indicadores';
import { useDominio } from '@/state/hooks';

type Vista = 'relatorios' | 'parametros';

export default function PaginaPrefeituraRelatorios() {
  useDominio();
  const { aoCsv, aoXls, aoPdf } = useExportar();
  /* Parâmetros moram aqui porque são a outra metade da mesma pergunta: os
     relatórios dizem quanto deu, e os parâmetros dizem com que régua foi
     medido. Ficar numa aba própria só engordaria o menu de novo. */
  const [vista, setVista] = useState<Vista>('relatorios');
  const m = Painel.municipio();

  const abas = (
    <SubAbas<Vista> idBase="relatorios-mun" atual={vista} aoEscolher={setVista} rotulo="Relatórios e parâmetros"
      opcoes={[['relatorios', 'Relatórios'], ['parametros', 'Parâmetros']]} />
  );
  const painel = { role: 'tabpanel' as const, id: idPainel('relatorios-mun', vista), 'aria-labelledby': idAba('relatorios-mun', vista) };

  if (vista === 'parametros') {
    return (
      <>
        {abas}
        <div {...painel}><VistaParametros /></div>
      </>
    );
  }

  return (
    <>
      {abas}
      <div {...painel}>
      <Cabecalho titulo="Relatórios" texto="Exportação de todos os processos do município, em planilha ou documento." />

      <Cartao titulo="Relatório municipal de destinação"
        sub={`${m.total} processo(s) registrado(s) · ${m.comprovadas} com destinação comprovada`}
        classe="acao-viva"
        acao={<Exportar escopo="prefeitura" rotulo="Baixar" aoCsv={aoCsv} aoXls={aoXls} aoPdf={aoPdf} />}
        nota="O CSV traz uma linha por demanda, com 27 colunas: origem, resíduo, território, peso de campo, peso de balança, rejeito, recuperação, divergência, catador, destino e comprovante. Abre em português sem conversão manual."
        corpo={
          <Kpis>
            <Kpi rotulo="Massa recebida" valor={Fmt.toneladas(m.ambiental.massa)} sub="medida em balança do destino" tom="marca" destaque />
            <Kpi rotulo="Massa recuperada" valor={Fmt.toneladas(m.ambiental.reciclado)}
              sub={`${Fmt.percentual(m.ambiental.taxaRecuperacao, 0)} de recuperação`} tom="ok" />
            <Kpi rotulo="Rejeito" valor={Fmt.toneladas(m.ambiental.rejeito)} sub="disposição final em aterro" tom="alerta" />
            <Kpi rotulo="Taxa de comprovação" valor={Fmt.percentual(m.taxaComprovacao, 0)}
              sub={`${m.emAndamento} processo(s) em andamento`} />
          </Kpis>
        } />

      <div className="colunas dois-um">
        <Cartao titulo="Composição por resíduo" sub="Sobre a massa comprovada"
          corpo={<GraficoRosca itens={m.materiais} />} />
        <Cartao titulo="Massa por zona" sub="Distribuição territorial"
          corpo={<Ranking itens={m.zonas.map(z => ({ ...z, nota: z.n + ' carga(s)' }))} />} />
      </div>

      <Cartao titulo="Apuração consolidada" sub="Números do município no período registrado"
        nota="Massa recebida e recuperada são medidas. Taxa de recuperação e CO₂e evitado são calculados a partir delas, pelos parâmetros publicados na tela de Metodologia."
        corpo={<Pares itens={[
          ['Processos registrados', Fmt.numero(m.total)],
          ['Destinações comprovadas', Fmt.numero(m.comprovadas)],
          ['Pendências abertas', Fmt.numero(m.pendentes)],
          ['Massa recebida', Fmt.kg(m.ambiental.massa)],
          ['Massa recuperada', Fmt.kg(m.ambiental.reciclado)],
          ['Rejeito ao aterro', Fmt.kg(m.ambiental.rejeito)],
          ['CO₂e evitado', Fmt.kg(Math.round(m.ambiental.co2Evitado))],
          ['Valor movimentado pelos catadores', Fmt.reais(m.financeiro.valor)],
          ['Catadores com atendimento registrado', Fmt.numero(m.social.catadoresAtivos)]
        ]} />} />

      <Cartao titulo="Como cada número é apurado" sub="Metodologia, fontes e base legal"
        nota="Nenhum número do sistema aparece sem a natureza declarada: medido, declarado, calculado ou parâmetro de trabalho."
        acao={<Link className="btn sec sm" href="/prefeitura/metodologia">Abrir metodologia</Link>}
        corpo={<Pares itens={[
          ['Natureza do dado', 'O que é medido em balança e o que é estimado'],
          ['Parâmetros por material', 'Preços de referência e perda de triagem'],
          ['Base legal', 'Normas que sustentam cada regra de situação'],
          ['Origem dos dados territoriais', 'Fontes das coordenadas e da malha do município']
        ]} />} />

      <Cartao titulo="Outras exportações do município" sub="Disponíveis nas telas de origem"
        nota="Cada exportação fica na tela que responde por aquele dado, para que a planilha saia com o mesmo filtro que está na tela."
        corpo={<Pares itens={[
          ['Registro municipal de carteiras', 'Prefeitura · Catadores'],
          ['Processos com filtro aplicado', 'Prefeitura · Processos'],
          ['Estabelecimentos por situação', 'Prefeitura · Geradores']
        ]} />} />
      </div>
    </>
  );
}
