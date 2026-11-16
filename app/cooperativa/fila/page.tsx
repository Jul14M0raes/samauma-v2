'use client';

/* A caminho (RF-029): cargas em transporte para o galpão da cooperativa, que
   confirma o recebimento (RF-013), e a previsão do que ainda vem. */

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Aviso, Cabecalho, Cartao, Kpi, Kpis } from '@/components/ui/Basicos';
import { ListaDemandas } from '@/components/ui/Listas';
import { BlocoCapacidade } from '@/components/cooperativa/BlocoCapacidade';
import { FaixaPerfil } from '@/components/ui/Basicos';
import { Fmt } from '@/lib/dominio/formato';
import { Busca } from '@/components/ui/Busca';
import { filtrarPorTexto } from '@/lib/dominio/busca';
import { Painel } from '@/lib/dominio/indicadores';
import { Sessao } from '@/lib/dominio/sessao';
import { useDominio } from '@/state/hooks';

function FaixaDestino({ p }: { p: ReturnType<typeof Painel.destino> }) {
  return (
    <FaixaPerfil nome={p.unidade.nome} papel={`${p.unidade.tipo} · licença ${p.unidade.licenca}`}
      medidas={[
        [p.aCaminho.length, 'a caminho'],
        [Fmt.kg(p.esperado), 'esperados'],
        [Fmt.kg(p.recebidoHoje), 'recebidos hoje'],
        [Fmt.toneladas(p.massa), 'total confirmado']
      ]} />
  );
}

export default function PaginaCooperativaFila() {
  useDominio();
  const router = useRouter();
  const [texto, setTexto] = useState('');
  const p = Painel.destino(Sessao.destino.id);
  const lista = filtrarPorTexto(p.aCaminho, texto, d => [d.id, d.gerador.nome, d.residuo, d.catador?.nome]);

  return (
    <>
      <Cabecalho titulo="Cargas a caminho" texto="Confirme o peso da balança. É essa confirmação que concilia as medições e emite o comprovante." />
      <FaixaDestino p={p} />
      <BlocoCapacidade p={p} />
      {p.aCaminho.length > 0 && (
        <Aviso titulo="O que fazer com cada carga"
          texto="Abra a carga, informe a massa da balança e quanto do material é rejeito. O sistema compara com a massa observada na coleta e emite o comprovante — ou abre pendência para a Prefeitura." />
      )}
      <Cartao titulo="O que ainda vem" sub="Demandas desta cooperativa que ainda não saíram"
        acao={<Link href="/cooperativa/demandas" className="btn sec sm">Demandas existentes</Link>}
        nota="Aceita é compromisso assumido; disponível ainda aguarda a sua avaliação. As duas não se somam. A massa é estimada pelo volume declarado."
        corpo={
          <>
            <Kpis>
              <Kpi rotulo="Compromissada" valor={Fmt.kg(p.previsao.compromissada.massa)}
                sub={`${p.previsao.compromissada.cargas} aceita(s) ou em coleta`} tom="marca" />
              <Kpi rotulo="Possível" valor={Fmt.kg(p.previsao.possivel.massa)}
                sub={`${p.previsao.possivel.cargas} aguardando avaliação`} tom="alerta" />
              <Kpi rotulo="Criadas pelo gerador" valor={p.previsao.rascunho.cargas}
                sub="ainda não encaminhadas" />
              <Kpi rotulo="Já em trânsito" valor={Fmt.kg(p.esperado)}
                sub={`${p.aCaminho.length} carga(s) a caminho`} tom="ok" />
            </Kpis>
            {!!p.previsao.compromissada.cargas && (
              <ListaDemandas demandas={p.previsao.compromissada.demandas} visao="destinatario"
                vazioTitulo="" vazioTexto=""
                aoAbrir={id => router.push(`/cooperativa/demandas/${id}`)} />
            )}
          </>
        } />

      <Busca valor={texto} aoMudar={setTexto} achados={lista.length} total={p.aCaminho.length}
        rotulo="Buscar carga" placeholder="Número, estabelecimento, resíduo ou cooperado" />
      <ListaDemandas demandas={lista} visao="destinatario"
        vazioTitulo="Nenhuma carga a caminho" vazioTexto="Quando a equipe fechar uma carga em campo, ela entra nesta fila."
        aoAbrir={id => router.push(`/cooperativa/demandas/${id}`)} />
    </>
  );
}
