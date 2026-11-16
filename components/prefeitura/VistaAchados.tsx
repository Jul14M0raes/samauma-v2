'use client';

/* Fila de fiscalização. A regra de priorização já existia em
   `filaDeFiscalizacao`, testada, mas não tinha tela: quem abria o perfil da
   prefeitura via indicadores e listas, e não o trabalho do dia.

   A tela não reapura nada. Chama a mesma função do domínio, que ordena por
   situação, depois por número de achados e depois por massa sem prova de
   pesagem. Se a fila discordasse da ficha do gerador, o sistema teria duas
   verdades — por isso as duas leem da mesma origem. */

import { useRouter } from 'next/navigation';

import { Cabecalho, Cartao, Aviso, Kpi, Kpis, Pares, SituacaoGerador, Vazio } from '@/components/ui/Basicos';
import { GERADORES } from '@/lib/dominio/catalogo';
import { Fmt } from '@/lib/dominio/formato';
import { filaDeFiscalizacao, solicitacoesDoGerador } from '@/lib/dominio/notificacao';
import { Store } from '@/lib/dominio/store';
import { useDominio } from '@/state/hooks';

export function VistaAchados() {
  useDominio();
  const router = useRouter();

  const entradas = GERADORES.map(g => ({ gerador: g, demandas: Store.doGerador(g.id) }));
  const fila = filaDeFiscalizacao(entradas);
  const massaTotalSemProva = fila.reduce((s, l) => s + l.massaSemProva, 0);
  const achadosTotal = fila.reduce((s, l) => s + l.achados.length, 0);

  return (
    <>
      <Cabecalho titulo="Fiscalização"
        texto="Estabelecimentos com achado apurado ou com coletas repetidamente impedidas, ordenados por prioridade. A fila é a mesma apuração que aparece na ficha de cada um." />

      <Aviso tom="alerta" titulo="Achado não é notificação"
        texto="Cada linha reúne fatos que o sistema apurou a partir do próprio registro, ou relatos de quem esteve no endereço. Relato de uma parte pauta visita, não autua. A decisão de notificar, e o ato em si, permanecem da autoridade competente — o sistema prepara a minuta, não expede." />

      <Kpis>
        <Kpi rotulo="Na fila" valor={fila.length} sub={`de ${GERADORES.length} estabelecimento(s) cadastrado(s)`} tom={fila.length ? 'alerta' : 'ok'} />
        <Kpi rotulo="Achados apurados" valor={achadosTotal} sub="somados na fila inteira" />
        <Kpi rotulo="Massa sem prova de pesagem" valor={Fmt.kg(massaTotalSemProva)} sub="recebida sem balança identificada" tom="alerta" />
      </Kpis>

      {fila.length === 0
        ? <Vazio titulo="Nenhum achado apurado"
            texto="Nenhum estabelecimento cadastrado apresenta, no registro atual, fato que caracterize achado de infração." />
        : fila.map((linha, posicao) => {
            const solicitacoes = solicitacoesDoGerador(linha.gerador, Store.doGerador(linha.gerador.id));
            return (
              <Cartao key={linha.gerador.id}
                titulo={`${posicao + 1}. ${linha.nome}`}
                sub={[
                  `${linha.achados.length} achado(s)`,
                  linha.obstrucao.total ? `${linha.obstrucao.total} coleta(s) impedida(s)` : null,
                  `${Fmt.kg(linha.massaSemProva)} sem prova de pesagem`
                ].filter(Boolean).join(' · ')}
                acao={<button className="btn sec sm" onClick={() => router.push(`/prefeitura/geradores/${linha.gerador.id}`)}>Abrir ficha</button>}
                nota={solicitacoes.length
                  ? `Há também ${solicitacoes.length} pedido(s) de informação, que não são achado de infração e seguem por ofício, não por notificação.`
                  : undefined}
                corpo={
                  <>
                    <div style={{ marginBottom: 'var(--e3)' }}><SituacaoGerador situacao={linha.situacao} /></div>
                    {linha.achados.length
                      ? <Pares itens={linha.achados.map(a => [a.titulo, `${a.detalhe} · ${a.fundamento.norma}, ${a.fundamento.dispositivo}`])} />
                      : <Aviso titulo="Sem achado de infração"
                          texto="Este estabelecimento entrou na fila pelo padrão de coletas impedidas, e não por irregularidade apurada. A visita é de apuração, não de autuação." />}
                    {!!linha.obstrucao.total && (
                      <div style={{ marginTop: 'var(--e3)' }}>
                        <Aviso tom="alerta" titulo={`${linha.obstrucao.total} coleta(s) impedida(s) no local`}
                          texto={`Registrado por quem esteve no endereço, em ${linha.obstrucao.demandas.length} demanda(s). É relato de uma parte, não apuração: serve para pautar a visita, não para autuar.`} />
                      </div>
                    )}
                  </>
                } />
            );
          })}
    </>
  );
}
