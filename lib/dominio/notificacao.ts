/* SAMAÚMA — minuta de notificação e dossiê do gerador.
   É minuta para o servidor revisar e assinar no processo próprio: o sistema não
   notifica nem aplica penalidade (RN-031, RNF-004). */

import { Catalogo } from './catalogo';
import { DemandaRegras as Demanda } from './demanda';
import { comDigito } from './credencial';
import { Fmt } from './formato';
import { exigeMtr } from './mtr';
import { competenciaAtual, Regulatorio } from './regulatorio';
import type { Demanda as TDemanda, Gerador, Situacao } from './tipos';

/** Prazo padrão para regularização, em dias corridos. */
export const PRAZO_REGULARIZACAO = 15;

export interface BaseLegal {
  norma: string;
  dispositivo: string;
  texto: string;
}

/* A fundamentação é escolhida pelo motivo apurado, e não despejada inteira:
   notificação que cita seis leis para um PGRS vencido é notificação que o
   advogado do gerador derruba por excesso. */
export const FUNDAMENTOS: Record<string, BaseLegal> = {
  pgrs: {
    norma: 'Lei Federal nº 12.305/2010',
    dispositivo: 'art. 20, combinado com o art. 21',
    texto: 'sujeita o estabelecimento à elaboração de Plano de Gerenciamento de Resíduos Sólidos e à sua disponibilização ao poder público.'
  },
  cadastro: {
    norma: 'Decreto Municipal nº 15.603/2018',
    dispositivo: 'que institui o Cadastro de Grandes Geradores',
    texto: 'obriga o estabelecimento que gera acima do limite fixado a integrar o cadastro municipal.'
  },
  coletaPublica: {
    norma: 'Decreto Municipal nº 15.603/2018',
    dispositivo: 'quanto à vedação de uso da coleta pública',
    texto: 'veda a utilização da coleta pública ao gerador acima do limite diário, cabendo-lhe custear coleta, transporte e destinação final.'
  },
  destinacao: {
    norma: 'Lei Federal nº 12.305/2010',
    dispositivo: 'art. 3º, incisos VII e VIII',
    texto: 'impõe a destinação final ambientalmente adequada dos resíduos gerados.'
  },
  mtr: {
    norma: 'Lei Federal nº 12.305/2010',
    dispositivo: 'art. 39, quanto ao controle da movimentação de resíduos',
    texto: 'exige o registro do transporte no Manifesto de Transporte de Resíduos, emitido pelo gerador.'
  }
};

export interface Achado {
  titulo: string;
  detalhe: string;
  fundamento: BaseLegal;
}

/* Os achados saem da situação já calculada, e não de uma segunda apuração:
   se a tela diz uma coisa e a notificação diz outra, o sistema perdeu. */
/* Referência da peça: gerador e competência, com dígito de conferência. */
function referencia(geradorId: string, competencia: string): string {
  return comDigito(`SAM-${geradorId.toUpperCase().replace(/-/g, '')}-${competencia}`);
}

export function achadosDoGerador(gerador: Gerador, demandas: TDemanda[]): Achado[] {
  const situacao = Regulatorio.situacao(gerador, demandas);
  const achados: Achado[] = [];
  const pgrs = situacao.pgrs;

  if (!gerador.pgrs) {
    achados.push({ titulo: 'Ausência de PGRS',
      detalhe: 'Não há Plano de Gerenciamento de Resíduos Sólidos registrado para o estabelecimento.',
      fundamento: FUNDAMENTOS.pgrs });
  } else if (pgrs?.vencido) {
    achados.push({ titulo: 'PGRS vencido',
      detalhe: `O plano ${pgrs.numero} está vencido há ${Math.abs(pgrs.dias)} dia(s).`,
      fundamento: FUNDAMENTOS.pgrs });
  } else if (pgrs?.vencendo) {
    achados.push({ titulo: 'PGRS a vencer',
      detalhe: `O plano ${pgrs.numero} vence em ${pgrs.dias} dia(s).`,
      fundamento: FUNDAMENTOS.pgrs });
  }

  if (!situacao.ultimaDestinacao) {
    achados.push({ titulo: 'Sem destinação comprovada',
      detalhe: 'Não há, no sistema, nenhuma carga com destinação comprovada para este estabelecimento.',
      fundamento: FUNDAMENTOS.destinacao });
  }

  if (!gerador.operador) {
    achados.push({ titulo: 'Sem contrato com cooperativa',
      detalhe: 'Não há contrato vigente com cooperativa, e o gerador acima do limite não pode utilizar a coleta pública.',
      fundamento: FUNDAMENTOS.coletaPublica });
  }

  /* Prazo vencido só é omissão do gerador quando a demanda nunca saiu do
     rascunho. Publicada e não coletada, a falha é da rede de coleta — imputar
     isso ao gerador seria notificá-lo por algo fora do controle dele, e é assim
     que uma notificação cai. O fato continua visível no dossiê. */
  const paradas = demandas.filter(d => d.status === 'CRIADA' && Demanda.atrasada(d));
  if (paradas.length) {
    achados.push({ titulo: 'Demanda em rascunho com prazo vencido',
      detalhe: `${paradas.length} demanda(s) permanecem como rascunho, sem publicação, com o prazo já vencido.`,
      fundamento: FUNDAMENTOS.destinacao });
  }

  const pendencias = demandas.filter(d => d.status === 'PENDENCIA_DIVERGENCIA');
  if (pendencias.length) {
    achados.push({ titulo: 'Divergências de pesagem em aberto',
      detalhe: `${pendencias.length} carga(s) com divergência entre a massa observada e a aferida, aguardando decisão.`,
      fundamento: FUNDAMENTOS.destinacao });
  }

  return achados;
}

/* Pedido de informação não é achado de infração, e misturar os dois é o que faz
   notificação cair.

   O caso do MTR deixa isso evidente: a emissão acontece no SINIR, pelo gerador,
   e o sistema municipal só enxerga o número que alguém digitou de volta aqui.
   Ausência do número neste sistema não prova ausência de manifesto — prova que
   o sistema não foi informado. Notificar por infração nessa hipótese seria
   acusar sem fato apurado. */
/* Ocorrências que impediram a coleta de acontecer, somadas por estabelecimento.

   Existe porque, sem isto, o sistema pedia ao catador que registrasse a viagem
   perdida e depois jogava fora o registro: nenhuma tela lia a ocorrência. Na
   segunda vez, ele para de registrar -- e com razão.

   O que estas ocorrências NÃO são: achado de infração. Relato de uma parte não
   é fato apurado. O sistema sabe que o catador declarou portão fechado; não sabe
   se o portão estava fechado. É a mesma disciplina do MTR, em que a ausência do
   número prova que o sistema não foi informado, e não que o manifesto não
   existe. Por isso a obstrução entra como pedido de informação, e a decisão de
   apurar continua sendo da autoridade. */
export function obstrucoesDoGerador(demandas: TDemanda[]): {
  total: number; porTipo: Record<string, number>; demandas: string[];
} {
  const IMPEDITIVAS = ['FECHADO', 'ACESSO'];
  const porTipo: Record<string, number> = {};
  const atingidas: string[] = [];

  for (const d of demandas) {
    const relevantes = (d.ocorrencias || []).filter(o => IMPEDITIVAS.includes(o.tipo));
    if (!relevantes.length) continue;
    atingidas.push(d.id);
    for (const o of relevantes) porTipo[o.tipo] = (porTipo[o.tipo] || 0) + 1;
  }
  return {
    total: Object.values(porTipo).reduce((a, b) => a + b, 0),
    porTipo,
    demandas: atingidas
  };
}

export function solicitacoesDoGerador(gerador: Gerador, demandas: TDemanda[]): Achado[] {
  const pedidos: Achado[] = [];
  const semMtr = demandas.filter(d => exigeMtr(d) && !d.mtr);
  if (semMtr.length) {
    pedidos.push({ titulo: 'Número do MTR não informado',
      detalhe: `${semMtr.length} carga(s) saíram do estabelecimento sem que o número do Manifesto de ` +
        'Transporte de Resíduos fosse informado a este sistema. O manifesto pode ter sido emitido ' +
        'regularmente no SINIR; o que falta é o registro do número, para conciliação.',
      fundamento: FUNDAMENTOS.mtr });
  }
  const semColeta = demandas.filter(d => ['DISPONIVEL', 'ACEITA', 'EM_COLETA'].includes(d.status)
    && Demanda.atrasada(d));
  if (semColeta.length) {
    pedidos.push({ titulo: 'Demandas publicadas e não coletadas no prazo',
      detalhe: `${semColeta.length} demanda(s) foram publicadas e não tiveram a coleta concluída até o prazo. ` +
        'O registro é informativo: a conclusão depende da rede de coleta, e não do estabelecimento.',
      fundamento: FUNDAMENTOS.destinacao });
  }
  const obstrucao = obstrucoesDoGerador(demandas);
  /* Uma ocorrência isolada é imprevisto; repetição é padrão, e padrão merece
     pergunta. Duas é o limiar em que deixa de ser azar. */
  if (obstrucao.total >= 2) {
    const rotulos: Record<string, string> = { FECHADO: 'estabelecimento fechado', ACESSO: 'acesso bloqueado' };
    const detalhe = Object.entries(obstrucao.porTipo)
      .map(([tipo, n]) => `${n} vez(es) por ${rotulos[tipo] || tipo.toLowerCase()}`).join(' e ');
    pedidos.push({ titulo: 'Coletas impedidas no local, de forma repetida',
      detalhe: `Catadores registraram ${obstrucao.total} ocorrência(s) que impediram a coleta em ` +
        `${obstrucao.demandas.length} demanda(s): ${detalhe}. O registro é de quem esteve no endereço e ` +
        'não constitui apuração: pede-se ao estabelecimento que informe o horário e a forma de acesso ' +
        'em que a retirada pode ser feita.',
      fundamento: FUNDAMENTOS.destinacao });
  }

  return pedidos;
}

export interface Minuta {
  gerador: Gerador;
  situacao: Situacao;
  /** Infrações apuradas a partir de fato que o sistema conhece. */
  achados: Achado[];
  /** Informação que falta ao sistema — pedido, não imputação. */
  solicitacoes: Achado[];
  prazo: number;
  vencimentoEm: string;
  competencia: string;
  /** Referência para juntada; não é número de processo, que vem do SEI. */
  referencia: string;
  emitidaEm: string;
}

export function minutaDeNotificacao(gerador: Gerador, demandas: TDemanda[],
                                    opcoes: { prazo?: number } = {}): Minuta {
  const prazo = opcoes.prazo ?? PRAZO_REGULARIZACAO;
  const agora = new Date();
  const vencimento = new Date(agora.getTime() + prazo * 24 * 60 * 60 * 1000);

  return {
    gerador,
    situacao: Regulatorio.situacao(gerador, demandas),
    achados: achadosDoGerador(gerador, demandas),
    solicitacoes: solicitacoesDoGerador(gerador, demandas),
    prazo,
    vencimentoEm: vencimento.toISOString(),
    competencia: competenciaAtual(agora),
    referencia: referencia(gerador.id, competenciaAtual(agora)),
    emitidaEm: agora.toISOString()
  };
}

export interface LinhaDossie {
  demanda: TDemanda;
  massa: string;
  prova: string;
  manifesto: string;
  comprovante: string;
}

export interface Dossie {
  gerador: Gerador;
  situacao: Situacao;
  achados: Achado[];
  solicitacoes: Achado[];
  linhas: LinhaDossie[];
  totais: { cargas: number; comprovadas: number; massa: number; comMtr: number; comTiquete: number };
  emitidoEm: string;
  referencia: string;
}

/** O histórico consolidado do gerador, no formato de juntada ao processo. */
export function dossieDoGerador(gerador: Gerador, demandas: TDemanda[]): Dossie {
  const ordenadas = demandas.slice()
    .sort((a, b) => new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime());

  const linhas: LinhaDossie[] = ordenadas.map(d => ({
    demanda: d,
    massa: d.verificadoKg != null ? Fmt.kg(d.verificadoKg)
      : d.coletadoKg != null ? `${Fmt.kg(d.coletadoKg)} (campo)` : '—',
    prova: Demanda.forcaDaProva(d).rotulo,
    manifesto: d.mtr ? d.mtr.numero + (d.mtr.cdf ? ` · CDF ${d.mtr.cdf.numero}` : '') : '—',
    comprovante: d.comprovante ? d.comprovante.codigo : '—'
  }));

  const comprovadas = ordenadas.filter(d => d.status === 'COMPROVADA');
  return {
    gerador,
    situacao: Regulatorio.situacao(gerador, demandas),
    achados: achadosDoGerador(gerador, demandas),
    solicitacoes: solicitacoesDoGerador(gerador, demandas),
    linhas,
    totais: {
      cargas: ordenadas.length,
      comprovadas: comprovadas.length,
      massa: comprovadas.reduce((soma, d) => soma + (d.verificadoKg || 0), 0),
      comMtr: ordenadas.filter(d => d.mtr).length,
      comTiquete: ordenadas.filter(d => Demanda.forcaDaProva(d).id === 'MEDIDA').length
    },
    emitidoEm: new Date().toISOString(),
    referencia: referencia(gerador.id, competenciaAtual())
  };
}

/** Geradores que hoje comportam minuta, ordenados por gravidade. */
export function filaDeFiscalizacao(lista: { gerador: Gerador; demandas: TDemanda[] }[]) {
  return lista
    .map(({ gerador, demandas }) => {
      const achados = achadosDoGerador(gerador, demandas);
      const situacao = Regulatorio.situacao(gerador, demandas);
      const massaSemProva = demandas
        .filter(d => d.verificadoKg != null && Demanda.forcaDaProva(d).id !== 'MEDIDA')
        .reduce((soma, d) => soma + (d.verificadoKg || 0), 0);
      const obstrucao = obstrucoesDoGerador(demandas);
      return { gerador, situacao, achados, massaSemProva, obstrucao,
        nome: Catalogo.gerador(gerador.id)?.nome || gerador.nome };
    })
    /* Entra na fila quem tem achado apurado OU padrão de obstrução. O segundo
       caso não acusa ninguém: é estabelecimento onde a coleta repetidamente não
       aconteceu, e isso merece uma visita mesmo que a situação esteja regular. */
    .filter(l => l.achados.length > 0 || l.obstrucao.total >= 2)
    .sort((a, b) => a.situacao.ordem - b.situacao.ordem
      || b.achados.length - a.achados.length
      || b.obstrucao.total - a.obstrucao.total
      || b.massaSemProva - a.massaSemProva);
}
