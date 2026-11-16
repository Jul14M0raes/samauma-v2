'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

import { VistaRecorrencia } from '@/components/gerador/VistaRecorrencia';
import { Busca } from '@/components/ui/Busca';
import { Cabecalho, Exportar, Filtros } from '@/components/ui/Basicos';
import { idAba, idPainel, SubAbas } from '@/components/ui/SubAbas';
import { filtrarPorTexto } from '@/lib/dominio/busca';
import { ListaDemandas } from '@/components/ui/Listas';
import { useExportar } from '@/components/relatorio/useExportar';
import { EM_CURSO } from '@/lib/dominio/catalogo';
import { Painel } from '@/lib/dominio/indicadores';
import { Sessao } from '@/lib/dominio/sessao';
import type { Demanda } from '@/lib/dominio/tipos';
import { useDominio } from '@/state/hooks';

type Filtro = 'todas' | 'andamento' | 'rascunhos' | 'pendencias' | 'comprovadas';

const GRUPOS: Record<Filtro, (d: Demanda) => boolean> = {
  todas: () => true,
  andamento: d => EM_CURSO.includes(d.status),
  rascunhos: d => d.status === 'CRIADA',
  pendencias: d => d.status === 'PENDENCIA_DIVERGENCIA',
  comprovadas: d => d.status === 'COMPROVADA'
};

type Vista = 'demandas' | 'recorrente';

function Conteudo() {
  useDominio();
  const router = useRouter();
  const busca = useSearchParams();
  const { aoCsv, aoXls, aoPdf } = useExportar();
  /* Coleta recorrente mora aqui porque é a mesma coisa vista de outro ângulo:
     as demandas são o que já foi pedido; o agendamento é o que se repete.
     Vista, filtro e busca ficam na URL — não em `useState` local — para que
     voltar de um detalhe de demanda encontre a tela exatamente como foi
     deixada, em vez de resetada. */
  const vista = (busca.get('vista') as Vista) || 'demandas';
  const filtro = (busca.get('filtro') as Filtro) || 'todas';
  const texto = busca.get('busca') || '';

  /* O campo digita em estado local e só depois de uma pausa leva a busca para a
     URL, que continua sendo a fonte de verdade. */
  const [textoLocal, setTextoLocal] = useState(texto);
  const [textoDaUrl, setTextoDaUrl] = useState(texto);
  if (texto !== textoDaUrl) { setTextoDaUrl(texto); setTextoLocal(texto); }
  const pendente = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (pendente.current) clearTimeout(pendente.current); }, []);

  const p = Painel.gerador(Sessao.gerador);
  const doFiltro = p.demandas.filter(GRUPOS[filtro] || GRUPOS.todas);
  const lista = filtrarPorTexto(doFiltro, textoLocal, d => [d.id, d.residuo, d.destino.nome, d.bairro]);

  function atualizarParams(mudancas: Record<string, string>) {
    const params = new URLSearchParams(busca.toString());
    Object.entries(mudancas).forEach(([chave, valor]) => {
      if (valor) params.set(chave, valor); else params.delete(chave);
    });
    router.replace(`/gerador/demandas?${params.toString()}`);
  }

  function mudarBusca(t: string) {
    setTextoLocal(t);
    if (pendente.current) clearTimeout(pendente.current);
    pendente.current = setTimeout(() => atualizarParams({ busca: t }), 300);
  }

  const abas = (
    <SubAbas<Vista> idBase="demandas" atual={vista} aoEscolher={v => atualizarParams({ vista: v })} rotulo="Demandas e agendamentos"
      opcoes={[['demandas', 'Demandas', p.demandas.length], ['recorrente', 'Coleta recorrente']]} />
  );
  const painel = { role: 'tabpanel' as const, id: idPainel('demandas', vista), 'aria-labelledby': idAba('demandas', vista) };

  if (vista === 'recorrente') return <>{abas}<div {...painel}><VistaRecorrencia /></div></>;

  return (
    <>
      {abas}
      <div {...painel}>
        <Cabecalho titulo="Minhas demandas" texto="Cada linha é um pedido de destinação, do rascunho ao comprovante."
          acao={<><Link href="/gerador/nova" className="btn">Nova demanda</Link>
            <Exportar escopo="gerador" aoCsv={e => aoCsv(e, { id: Sessao.gerador })} aoXls={e => aoXls(e, { id: Sessao.gerador })} aoPdf={e => aoPdf(e, { id: Sessao.gerador })} /></>} />
        <Filtros todas={p.demandas} grupos={GRUPOS} atual={filtro}
          rotulos={[['todas', 'Todas'], ['andamento', 'Em andamento'], ['rascunhos', 'Rascunhos'], ['pendencias', 'Pendências'], ['comprovadas', 'Comprovadas']]}
          aoEscolher={f => atualizarParams({ filtro: f })} />
        <Busca valor={textoLocal} aoMudar={mudarBusca} achados={lista.length} total={doFiltro.length}
          rotulo="Buscar demanda" placeholder="Número, resíduo, destino ou bairro" />
        <ListaDemandas demandas={lista} visao="gerador"
          vazioTitulo="Nenhuma demanda neste filtro" vazioTexto="Crie uma demanda informando resíduo, quantidade, local e prazo."
          aoAbrir={id => router.push(`/gerador/demandas/${id}`)} />
      </div>
    </>
  );
}

export default function PaginaGeradorDemandas() {
  return <Suspense fallback={null}><Conteudo /></Suspense>;
}
