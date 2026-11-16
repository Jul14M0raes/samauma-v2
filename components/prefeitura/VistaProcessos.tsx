'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Aviso, Cabecalho, Exportar, Filtros } from '@/components/ui/Basicos';
import { Busca } from '@/components/ui/Busca';
import { filtrarPorTexto } from '@/lib/dominio/busca';
import { ListaDemandas } from '@/components/ui/Listas';
import { useExportar } from '@/components/relatorio/useExportar';
import { DemandaRegras } from '@/lib/dominio/demanda';
import { exigeMtr, PORTAL_MTR } from '@/lib/dominio/mtr';
import { Store } from '@/lib/dominio/store';
import type { Demanda } from '@/lib/dominio/tipos';
import { useDominio } from '@/state/hooks';

type Filtro = 'todas' | 'andamento' | 'transporte' | 'pendentes' | 'comprovadas' | 'semMtr' | 'semTiquete';

const GRUPOS: Record<Filtro, (d: Demanda) => boolean> = {
  todas: () => true,
  andamento: d => ['DISPONIVEL', 'ACEITA', 'EM_COLETA'].includes(d.status),
  transporte: d => d.status === 'EM_TRANSPORTE',
  pendentes: d => d.status === 'PENDENCIA_DIVERGENCIA',
  comprovadas: d => d.status === 'COMPROVADA',
  /* Carga que já saiu do gerador e não tem manifesto: é a fila que a SEMA
     precisa enxergar, porque o MTR é obrigação legal e o comprovante daqui
     não substitui. */
  semMtr: d => exigeMtr(d) && !d.mtr,
  /* Massa que nao se sustenta sozinha: a ancora de todo o sistema e a pesagem
     do destino, e sem instrumento identificado e tiquete ela e declaracao. */
  semTiquete: d => d.verificadoKg != null && DemandaRegras.forcaDaProva(d).id !== 'MEDIDA'
};

export function VistaProcessos() {
  useDominio();
  const router = useRouter();
  const { aoCsv, aoXls, aoPdf } = useExportar();
  /* O filtro deixou de viajar na URL quando esta tela virou sub-vista de
     Fiscalizacao: o endereco e da aba, e nao do recorte escolhido dentro dela. */
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [texto, setTexto] = useState('');
  const todas = Store.todas();

  const doFiltro = todas.filter(GRUPOS[filtro] || GRUPOS.todas);
  const lista = filtrarPorTexto(doFiltro, texto, d => [
    d.id, d.gerador.nome, d.residuo, d.catador?.nome, d.destino.nome, d.mtr
  ]);

  return (
    <>
      <Cabecalho titulo="Processos" texto="Cada linha é uma demanda de destinação, do cadastro ao comprovante."
        acao={<Exportar escopo="prefeitura" aoCsv={aoCsv} aoXls={aoXls} aoPdf={aoPdf} />} />
      <Filtros todas={todas} grupos={GRUPOS} atual={filtro}
        rotulos={[['todas', 'Todas'], ['andamento', 'Em coleta'], ['transporte', 'A caminho'], ['pendentes', 'Pendentes'], ['comprovadas', 'Comprovadas'], ['semMtr', 'Sem MTR'], ['semTiquete', 'Prova frágil']]}
        aoEscolher={setFiltro} />
      <Busca valor={texto} aoMudar={setTexto} achados={lista.length} total={doFiltro.length}
        rotulo="Buscar processo" placeholder="Número do processo, estabelecimento, resíduo, catador ou MTR" />
      {filtro === 'semMtr' && (
        <Aviso tom="alerta" titulo="Cargas em transporte ou recebidas sem Manifesto de Transporte de Resíduos"
          texto={`A emissão do MTR é do gerador, em ${PORTAL_MTR.replace('https://', '')}, e o comprovante do SAMAÚMA não substitui o manifesto. Esta fila mostra onde as duas obrigações ainda não se encontraram.`} />
      )}
      {filtro === 'semTiquete' && (
        <Aviso tom="alerta" titulo="Cargas cuja massa foi digitada sem evidência do instrumento"
          texto="A massa aferida no destino é a âncora do comprovante, do indicador de recuperação e da renda do catador. Sem identificação da balança, aferição do INMETRO e tíquete, ela vale como declaração de quem recebeu — não como medição comprovável numa auditoria." />
      )}
      <ListaDemandas demandas={lista}
        vazioTitulo={texto ? 'Nada encontrado' : 'Nenhum processo neste filtro'}
        vazioTexto={texto ? 'Nenhum processo deste recorte corresponde ao que foi digitado.' : 'Ajuste o filtro para ver outras situações.'}
        aoAbrir={id => router.push(`/prefeitura/demandas/${id}`)} />
    </>
  );
}
