/* SAMAÚMA — situação regulatória do estabelecimento (EST-002, RF-005).
   Calculada, nunca digitada: sai do cadastro, do PGRS e das demandas
   (RN-036 a RN-039). A única entrada humana é a classificação de
   inconformidade grave pelo Técnico (RN-037), que leva a Irregular. Toda
   condição devolve o motivo em texto. */

import { SITUACOES } from './catalogo';
import { Cadastro } from './cadastro';
import { Fmt, somar } from './formato';
import { Parametros } from './parametros';
import type { Aderencia, Demanda as TDemanda, Gerador, PgrsResolvido, Situacao, SituacaoId } from './tipos';

const DIA = 86400000;

/* PGRS vale 12 meses a partir da emissão (RN-003). */
export const VALIDADE_PGRS_MESES = 12;

/** Competência corrente no formato AAAAMM. */
export function competenciaAtual(agora: Date = new Date()): string {
  return `${agora.getFullYear()}${String(agora.getMonth() + 1).padStart(2, '0')}`;
}

/* O que falta no cadastro para ele estar completo (RN-004). */
export function faltasNoCadastro(gerador: Gerador): string[] {
  return [
    !gerador.cnpj && 'CNPJ',
    !gerador.endereco && 'endereço',
    !gerador.razaoSocial && 'razão social',
    !gerador.responsavelTecnico && 'responsável técnico',
    !gerador.operador && 'contrato vigente com cooperativa'
  ].filter(Boolean) as string[];
}

export const Regulatorio = {
  pgrs(gerador: Gerador | null, agora: Date = new Date()): PgrsResolvido | null {
    if (!gerador || !gerador.pgrs) return null;
    const vence = new Date(gerador.pgrs.emitidoEm);
    vence.setMonth(vence.getMonth() + VALIDADE_PGRS_MESES);
    const dias = Math.floor((vence.getTime() - agora.getTime()) / DIA);
    return {
      numero: gerador.pgrs.numero,
      emitidoEm: gerador.pgrs.emitidoEm,
      validade: vence.toISOString(),
      dias,
      vencido: dias < 0,
      vencendo: dias >= 0 && dias <= Parametros.antecedenciaPgrsDias
    };
  },

  /* Precedência: vale a pior condição (Irregular > Pendente > A renovar >
     Regular). A precedência entre RN-038 e RN-039 segue em aberto na doc. */
  situacao(gerador: Gerador | null, demandas: TDemanda[], agora: Date = new Date()): Situacao {
    const motivos: string[] = [];
    const plano = Regulatorio.pgrs(gerador, agora);
    const ultima = demandas
      .filter(d => d.status === 'COMPROVADA')
      .map(d => d.comprovante!.emitidoEm)
      .sort().reverse()[0] || null;

    let id: SituacaoId = 'REGULAR';
    const rebaixar = (nivel: SituacaoId, motivo: string) => {
      motivos.push(motivo);
      if (SITUACOES[nivel].ordem < SITUACOES[id].ordem) id = nivel;
    };

    /* RN-036: cadastro incompleto, PGRS não enviado ou vencido. */
    const faltas = gerador ? faltasNoCadastro(gerador) : ['cadastro'];
    if (faltas.length) rebaixar('IRREGULAR', `Cadastro incompleto: falta ${faltas.join(', ')}.`);
    if (!plano) {
      rebaixar('IRREGULAR', 'PGRS não enviado.');
    } else if (plano.vencido) {
      rebaixar('IRREGULAR', `PGRS ${plano.numero} vencido há ${Math.abs(plano.dias)} dias.`);
    } else if (plano.vencendo) {
      /* RN-033: antecedência configurável, 30 dias de início (D-05). */
      rebaixar('A_RENOVAR', `PGRS ${plano.numero} vence em ${plano.dias} dias.`);
    }

    /* RN-037: inconformidade grave, classificada pela Prefeitura. */
    const inconformidade = gerador ? Cadastro.inconformidadeVigente(gerador.id) : null;
    if (inconformidade) rebaixar('IRREGULAR', `Inconformidade grave classificada pela Prefeitura: ${inconformidade.fundamento}`);

    /* RN-038: demanda em processo de aprovação (pendência aguardando decisão). */
    const emAnalise = demandas.filter(d => d.status === 'PENDENCIA_DIVERGENCIA' && d.pendencia?.estado === 'ABERTA').length;
    if (emAnalise) rebaixar('PENDENTE', `${emAnalise} demanda(s) com divergência aguardando decisão da Prefeitura.`);

    /* RN-039: cadastro completo, PGRS válido e sem inconformidade grave. */
    if (!motivos.length) motivos.push('Cadastro completo, PGRS válido e sem inconformidade grave.');

    return {
      ...(SITUACOES[id] as { id: SituacaoId; rotulo: string; tom: string; ordem: number }),
      motivos, pgrs: plano, ultimaDestinacao: ultima, inconformidade
    };
  },

  aderencia(gerador: Gerador | null, demandas: TDemanda[]): Aderencia | null {
    if (!gerador || !gerador.volumeMes) return null;
    const corte = Date.now() - 30 * DIA;
    const massa = somar(
      demandas.filter(d => d.status === 'COMPROVADA' && new Date(d.comprovante!.emitidoEm).getTime() >= corte),
      d => d.verificadoKg || 0
    );
    return { declarado: gerador.volumeMes, destinado: massa, parte: (massa / gerador.volumeMes) * 100 };
  },

  /* RF-021, DOC-002: conteúdo do QR de regularização pela decisão D-06 —
     situação, responsável técnico, última coleta e PGRS. O sistema não sabe
     quando o PGRS é documento particular (caso em que sai do QR); por ora entra
     sempre. Texto puro: sem servidor, não há endereço de consulta a apontar. */
  conteudoQr(gerador: Gerador, situacao: Situacao): string {
    const plano = situacao.pgrs;
    return [
      'SAMAÚMA · regularização',
      `${gerador.nome} · ${gerador.cnpj}`,
      `Situação: ${situacao.rotulo}`,
      `Resp. técnico: ${gerador.responsavelTecnico || 'não informado'}`,
      `Última coleta: ${situacao.ultimaDestinacao ? Fmt.data(situacao.ultimaDestinacao) : 'nenhuma'}`,
      plano ? `${plano.numero} válido até ${Fmt.data(plano.validade)}` : 'PGRS não enviado'
    ].join('\n');
  }
};
