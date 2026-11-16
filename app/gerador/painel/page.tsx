'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cabecalho, Cartao, Kpi, Kpis, SituacaoGerador, Vazio } from '@/components/ui/Basicos';
import { Anel, BarraRecuperacao, GraficoRosca, GraficoSerie, Ranking } from '@/components/ui/Graficos';
import { ListaColetas } from '@/components/ui/Listas';
import { Aviso } from '@/components/ui/Basicos';
import { Fmt } from '@/lib/dominio/formato';
import { Painel } from '@/lib/dominio/indicadores';
import { Sessao } from '@/lib/dominio/sessao';
import { Store } from '@/lib/dominio/store';
import type { Situacao } from '@/lib/dominio/tipos';
import { useDominio } from '@/state/hooks';

export default function PaginaGeradorPainel() {
  useDominio();
  const router = useRouter();
  const abrir = (id: string) => router.push(`/gerador/demandas/${id}`);
  const p = Painel.gerador(Sessao.gerador);

  return (
    <>
      <Cabecalho titulo="Painel do gerador"
        texto={`${p.cadastro.nome} · ${p.cadastro.ramo} · ${p.ponto ? p.ponto.bairro + ' · ' + p.ponto.zona : ''}`}
        acao={<Link href="/gerador/nova" className="btn">Nova demanda</Link>} />

      <BlocoSituacao p={p} />

      <Kpis classe="cinco">
        <Kpi rotulo="Massa destinada" valor={Fmt.toneladas(p.ambiental.massa)} sub="confirmada por quem recebeu" tom="marca" destaque />
        <Kpi rotulo="Efetivamente reciclada" valor={Fmt.toneladas(p.ambiental.reciclado)} sub={`${Fmt.percentual(p.ambiental.taxaRecuperacao, 0)} do que saiu daqui`} tom="ok" />
        <Kpi rotulo="Em andamento" valor={p.emAberto + p.emTransporte} sub={`${p.emTransporte} a caminho do destino`} />
        <Kpi rotulo="Pendências" valor={p.pendencias} sub="em conciliação na Prefeitura" tom={p.pendencias ? 'erro' : 'ok'} />
        <Kpi rotulo="Atrasadas" valor={p.atrasadas} sub="com prazo vencido sem coleta" tom={p.atrasadas ? 'alerta' : 'ok'} />
      </Kpis>

      <div className="colunas dois-um">
        <Cartao titulo="Próxima coleta" sub={p.proxima ? 'Demanda em campo agora' : 'Nada agendado'}
          acao={<Link href="/gerador/demandas" className="btn sec sm">Ver demandas</Link>}
          corpo={p.proxima
            ? <>
              <ListaColetas demandas={[p.proxima]} aoAbrir={abrir} />
              <Aviso titulo="Cooperativa contratada" texto={p.operador ? `${p.operador.nome} — ${p.operador.detalhe}.` : 'Sem contrato vigente com cooperativa: o cadastro fica incompleto (RN-004).'} />
            </>
            : <Vazio titulo="Nenhuma coleta em campo" texto="Crie uma demanda quando houver material acumulado." />} />
        <Cartao titulo="Volume declarado" sub="Declarado no cadastro × destinado com prova"
          corpo={
            <>
              <Anel valor={p.aderencia ? Math.min(100, p.aderencia.parte) : 0} rotulo="do declarado" tom="azul"
                nota={p.aderencia ? `${Fmt.kg(p.aderencia.destinado)} destinados de ${Fmt.kg(p.aderencia.declarado)} declarados por mês` : 'sem volume declarado no cadastro'} />
              <div className="micro-kpis">
                <div><b className="num">{Fmt.duracao(p.cicloMedio)}</b><span>ciclo médio</span></div>
              </div>
            </>
          }
          nota="Precisão compara a quantidade que você estima com o peso registrado na balança do destinatário." />
      </div>

      <Cartao titulo="O que aconteceu com o seu resíduo" sub="Massa recebida, separada entre o que voltou ao ciclo e o que foi aterrado"
        nota="Coletar não é reciclar: parte do material é separada como rejeito na triagem e segue para o aterro sanitário."
        corpo={
          <>
            <BarraRecuperacao ambiental={p.ambiental} />
            <div className="micro-kpis">
              <div><b className="num">{Fmt.kg(Math.round(p.ambiental.co2Evitado))}</b><span>CO₂e evitado</span></div>
              <div><b className="num">{Fmt.kg(p.ambiental.massaAterrada)}</b><span>enviado direto ao aterro</span></div>
              <div><b className="num">{Fmt.reais(p.financeiro.custoAterroEvitado)}</b><span>custo de aterro evitado</span></div>
            </div>
          </>
        } />

      <div className="colunas dois-um">
        <Cartao titulo="Destinação dia a dia" sub="Últimos 14 dias" corpo={<GraficoSerie serie={p.serie} />} />
        <Cartao titulo="Composição" sub="Por tipo de resíduo" corpo={<GraficoRosca itens={p.materiais} />} />
      </div>

      <Cartao titulo="Para onde o material foi" sub="Unidades que receberam, confirmaram e declararam o destino final"
        corpo={<Ranking itens={p.destinos.map(d => ({ ...d, nota: `${d.destinoFinal} · ${d.n} carga(s)` }))} />} />
      <BlocoSeparacao />
    </>
  );
}


/* Como a sua carga chega na triagem.

   É o único indicador do painel que não fala do que o estabelecimento já fez,
   e sim do que ele pode fazer melhor amanhã — com um saco a mais no depósito.
   A perda aqui é a evitável: a inerente ao material não entra, porque cobrar
   do gerador uma perda que ninguém evita seria injusto e ele pararia de ler. */
function BlocoSeparacao() {
  const sep = Painel.separacao(Store.doGerador(Sessao.gerador));
  if (!sep.cargas) return null;

  const bom = sep.indice != null && sep.indice >= 50;
  return (
    <Cartao titulo="Como o seu material chega na triagem"
      sub="Avaliado no portão da unidade receptora, carga a carga"
      nota="Material misturado ou molhado vira rejeito mesmo sendo reciclável. Esta é a parte da perda que a separação no seu depósito evita — a perda natural do material não entra nesta conta."
      corpo={
        <>
          <Kpis>
            <Kpi rotulo="Cargas separadas na origem" valor={Fmt.percentual(sep.indice, 0)}
              sub={`${sep.limpas} de ${sep.cargas} cargas`} tom={bom ? 'ok' : 'alerta'} destaque />
            <Kpi rotulo="Massa perdida por mistura" valor={Fmt.kg(sep.perdaEvitavelKg)}
              sub="material reciclável que virou rejeito" tom="alerta" />
            <Kpi rotulo="Valor que se perdeu no caminho" valor={Fmt.reais(sep.custoEvitavel)}
              sub="deixou de ser realizado pela triagem" tom="erro" />
            <Kpi rotulo="Cargas contaminadas" valor={sep.contaminadas}
              sub={`${sep.misturadas} misturada(s)`} tom={sep.contaminadas ? 'erro' : 'ok'} />
          </Kpis>
          {!bom && (
            <Aviso tom="alerta" titulo="Boa parte das suas cargas chega misturada"
              texto="Separar o seco do molhado no próprio depósito é o que faz esse material chegar inteiro à reciclagem. O ganho aparece aqui no mês seguinte." />
          )}
        </>
      } />
  );
}

function BlocoSituacao({ p }: { p: ReturnType<typeof Painel.gerador> }) {
  const s = p.situacao as Situacao;
  return (
    <section className={`cartao situacao-regulatoria ${s.tom}`}>
      <div className="cartao-corpo">
        <div className="situacao-topo">
          <div className="situacao-quem">
            <span className="etiqueta">Situação regulatória</span>
            <div className="situacao-pino"><SituacaoGerador situacao={s} /></div>
            <ul className="motivos">{s.motivos.map((m, i) => <li key={i}>{m}</li>)}</ul>
          </div>
        </div>
      </div>
    </section>
  );
}
