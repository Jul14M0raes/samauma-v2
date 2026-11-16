'use client';

/* Demandas existentes (FL-004): o que a cooperativa avalia (RF-008), designa
   com rota sugerida (RF-009, RF-010), executa em campo e, quando a coleta não
   acontece no prazo, justifica e remarca em 96 horas (RF-031). */

import { useRouter } from 'next/navigation';
import { Aviso, Cabecalho, Cartao, Kpi, Kpis } from '@/components/ui/Basicos';
import { ListaDemandas } from '@/components/ui/Listas';
import { DemandaRegras as Demanda } from '@/lib/dominio/demanda';
import { Fmt } from '@/lib/dominio/formato';
import { Sessao } from '@/lib/dominio/sessao';
import { Store } from '@/lib/dominio/store';
import { useDominio } from '@/state/hooks';

export default function PaginaCooperativaDemandas() {
  useDominio();
  const router = useRouter();
  const minhas = Store.paraDestino(Sessao.destino.id);
  const abrir = (id: string) => router.push(`/cooperativa/demandas/${id}`);

  const paraAvaliar = minhas.filter(d => d.status === 'DISPONIVEL');
  const naoAceitas = minhas.filter(d => d.status === 'NAO_ACEITA');
  const paraDesignar = Demanda.ordemDeRota(minhas.filter(d => d.status === 'ACEITA'));
  const emCampo = minhas.filter(d => d.status === 'EM_COLETA');
  const execucao = minhas.filter(d => d.status === 'PENDENCIA_EXECUCAO');

  return (
    <>
      <Cabecalho titulo="Demandas existentes" texto="Avalie o que consegue atender, designe quem executa e registre a coleta em campo." />

      <Kpis>
        <Kpi rotulo="Para avaliar" valor={paraAvaliar.length} sub="aguardando a sua decisão" tom={paraAvaliar.length ? 'alerta' : 'ok'} destaque />
        <Kpi rotulo="Para designar" valor={paraDesignar.length} sub="aceitas, sem cooperado" tom="marca" />
        <Kpi rotulo="Em coleta" valor={emCampo.length} sub="com cooperado em campo" />
        <Kpi rotulo="Não executadas" valor={execucao.length} sub="prazo vencido" tom={execucao.length ? 'erro' : 'ok'} />
      </Kpis>

      {!!execucao.length && (
        <Cartao titulo="Coletas não executadas" sub="Justifique e remarque dentro de 96 horas (RN-041)" classe="destaque-erro"
          corpo={<ListaDemandas demandas={execucao} visao="destinatario" aoAbrir={abrir} vazioTitulo="" vazioTexto="" />} />
      )}

      <Cartao titulo="Para avaliar" sub="Aceite o que a cooperativa consegue atender; o que não conseguir, registre com o motivo"
        corpo={<ListaDemandas demandas={paraAvaliar} visao="destinatario" aoAbrir={abrir}
          vazioTitulo="Nada para avaliar" vazioTexto="Quando um gerador declarar uma coleta para esta cooperativa, ela aparece aqui." />} />

      <Cartao titulo="Rota sugerida para designar" sub="Ordem por zona, distância e prazo"
        nota="Sugestão simples, só por zona, distância e prazo. Horário e capacidade do caminhão entram quando as regras complementares de rota forem definidas (decisão D-02)."
        corpo={paraDesignar.length ? (
          <ol className="lista-rota">
            {paraDesignar.map((d, i) => (
              <li key={d.id}>
                <button type="button" className="linha-rota" onClick={() => abrir(d.id)}>
                  <b className="num">{i + 1}</b>
                  <span>{d.gerador.nome} · {d.bairro} ({d.zona})</span>
                  <small>{Fmt.litros(d.declaradoL)} · {d.km.toLocaleString('pt-BR')} km · prazo {Fmt.prazo(d.prazo)}</small>
                </button>
              </li>
            ))}
          </ol>
        ) : <Aviso titulo="Nada para designar" texto="As demandas aceitas aparecem aqui, na ordem sugerida de rota." />} />

      <Cartao titulo="Em coleta" sub="Registre a massa observada, a foto e feche a carga"
        corpo={<ListaDemandas demandas={emCampo} visao="destinatario" aoAbrir={abrir}
          vazioTitulo="Nenhuma coleta em campo" vazioTexto="Designe um cooperado para iniciar a coleta." />} />

      {!!naoAceitas.length && (
        <Cartao titulo="Não aceitas" sub="Sinalizam necessidade de mais equipamento (RN-008)"
          corpo={<ListaDemandas demandas={naoAceitas} visao="destinatario" aoAbrir={abrir} vazioTitulo="" vazioTexto="" />} />
      )}
    </>
  );
}
