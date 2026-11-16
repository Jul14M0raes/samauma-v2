'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Cabecalho, Exportar, Filtros, Kpi, Kpis } from '@/components/ui/Basicos';
import { Busca } from '@/components/ui/Busca';
import { filtrarPorTexto } from '@/lib/dominio/busca';
import { ListaGeradores } from '@/components/ui/Listas';
import { useExportar } from '@/components/relatorio/useExportar';
import { Fmt, somar } from '@/lib/dominio/formato';
import { Painel } from '@/lib/dominio/indicadores';
import { useDominio } from '@/state/hooks';

type Gerador = ReturnType<typeof Painel.geradores>[number];
type Filtro = 'atencao' | 'irregular' | 'pendente' | 'renovar' | 'regular' | 'todos';

const GRUPOS: Record<Filtro, (g: Gerador) => boolean> = {
  atencao: g => g.situacao.id !== 'REGULAR',
  irregular: g => g.situacao.id === 'IRREGULAR',
  pendente: g => g.situacao.id === 'PENDENTE',
  renovar: g => g.situacao.id === 'A_RENOVAR',
  regular: g => g.situacao.id === 'REGULAR',
  todos: () => true
};

export function VistaGeradores() {
  useDominio();
  const router = useRouter();
  const { aoCsv, aoXls, aoPdf } = useExportar();
  /* Filtro em estado local: o endereco pertence a aba Cadastros, nao ao recorte. */
  const [filtro, setFiltro] = useState<Filtro>('atencao');
  const [texto, setTexto] = useState('');
  const geradores = Painel.geradores();

  const doFiltro = geradores.filter(GRUPOS[filtro] || GRUPOS.todos);
  const lista = filtrarPorTexto(doFiltro, texto, g => [g.nome, g.cnpj, g.ramo, g.bairro, g.zona, g.situacao.rotulo]);

  return (
    <>
      <Cabecalho titulo="Grandes geradores" texto="Situação regulatória calculada a partir do PGRS, das pendências e da última destinação comprovada."
        acao={<Exportar escopo="prefeitura" aoCsv={aoCsv} aoXls={aoXls} aoPdf={aoPdf} />} />

      <Kpis>
        <Kpi rotulo="Irregulares" valor={geradores.filter(GRUPOS.irregular).length} sub="sem PGRS válido ou sem destinar" tom="erro" destaque />
        <Kpi rotulo="Pendentes" valor={geradores.filter(GRUPOS.pendente).length} sub="com demanda aguardando decisão" tom="marca" />
        <Kpi rotulo="A renovar" valor={geradores.filter(GRUPOS.renovar).length} sub="PGRS perto do vencimento" tom="alerta" />
        <Kpi rotulo="Regulares" valor={geradores.filter(GRUPOS.regular).length} sub="com plano válido e destinação em dia" tom="ok" />
        <Kpi rotulo="Massa dos irregulares" valor={Fmt.toneladas(somar(geradores.filter(GRUPOS.irregular), 'massa'))} sub="já destinada com prova" />
      </Kpis>

      <Filtros todas={geradores} grupos={GRUPOS} atual={filtro}
        rotulos={[['atencao', 'Precisam de atenção'], ['irregular', 'Irregulares'], ['pendente', 'Pendentes'], ['renovar', 'A renovar'], ['regular', 'Regulares'], ['todos', 'Todos']]}
        aoEscolher={setFiltro} />

      <Busca valor={texto} aoMudar={setTexto} achados={lista.length} total={doFiltro.length}
        rotulo="Buscar estabelecimento" placeholder="Nome, CNPJ, ramo, bairro ou zona" />

      <ListaGeradores geradores={lista} aoAbrir={id => router.push(`/prefeitura/geradores/${id}`)} />
    </>
  );
}
