/* SAMAÚMA — Manifesto de Transporte de Resíduos (DOC-001, INT-001).
   O MTR é emitido no SINIR (decisão D-01). Aqui o sistema prepara os dados que
   o formulário pede e guarda os números do MTR e do CDF emitidos. */

import { Catalogo } from './catalogo';
import { DemandaRegras } from './demanda';
import { Fmt } from './formato';
import type { Demanda } from './tipos';

/** Endereço onde o gerador emite o manifesto. */
export const PORTAL_MTR = 'https://mtr.sinir.gov.br';

/* Classificação pela ABNT NBR 10004. É parâmetro de trabalho, não laudo: a
   classe definitiva de cada resíduo sai da caracterização do gerador, e a
   Secretaria pode corrigir esta tabela sem tocar em mais nada do sistema. */
export const CLASSE_RESIDUO: Record<string, { classe: string; nota: string }> = {
  papelao:  { classe: 'II-A', nota: 'Não perigoso, não inerte.' },
  papel:    { classe: 'II-A', nota: 'Não perigoso, não inerte.' },
  plastico: { classe: 'II-B', nota: 'Não perigoso, inerte.' },
  vidro:    { classe: 'II-B', nota: 'Não perigoso, inerte.' },
  metal:    { classe: 'II-B', nota: 'Não perigoso, inerte.' },
  oleo:     { classe: 'II-A', nota: 'Não perigoso, não inerte. Óleo comestível usado, não mineral.' },
  rejeito:  { classe: 'II-A', nota: 'Não perigoso, não inerte.' },

  organico: { classe: 'II-A', nota: 'Não perigoso, não inerte. Resíduo alimentar e de poda.' }
};

/* MTR emitido no SINIR e vinculado à demanda. Como é dado de sistema oficial,
   guarda fonte, data da consulta e identificador de origem (RN-027, RNF-006). */
export interface Mtr {
  numero: string;
  fonte: 'SINIR';
  /** Data de emissão informada a partir do SINIR. */
  emitidoEm: string;
  /** Quando o vínculo foi consultado e registrado no sistema. */
  consultadoEm: string;
  registradoPor: string;
  cdf: { numero: string; emitidoEm: string; registradoPor: string } | null;
}

export type SituacaoMtrId = 'NAO_EXIGIVEL' | 'PENDENTE' | 'EMITIDO' | 'CERTIFICADO';

export interface SituacaoMtr {
  id: SituacaoMtrId;
  rotulo: string;
  tom: string;
  motivo: string;
}

/* O Gerador vincula o MTR depois do recebimento confirmado e sem pendência
   aberta (RF-020, matriz de permissões MOD-005). */
export function exigeMtr(demanda: Demanda): boolean {
  return demanda.status === 'COMPROVADA';
}

export function situacaoMtr(demanda: Demanda): SituacaoMtr {
  if (!exigeMtr(demanda)) {
    return { id: 'NAO_EXIGIVEL', rotulo: 'Ainda não se aplica', tom: 'neutro',
      motivo: 'O MTR é vinculado depois do recebimento confirmado e sem pendência aberta.' };
  }
  if (!demanda.mtr) {
    return { id: 'PENDENTE', rotulo: 'MTR pendente', tom: 'alerta',
      motivo: `Carga comprovada sem MTR vinculado. A emissão é do gerador, em ${PORTAL_MTR}.` };
  }
  if (!demanda.mtr.cdf) {
    return { id: 'EMITIDO', rotulo: 'MTR emitido', tom: 'info',
      motivo: `Manifesto ${demanda.mtr.numero} vinculado. Falta o Certificado de Destinação Final.` };
  }
  return { id: 'CERTIFICADO', rotulo: 'Destinação certificada', tom: 'ok',
    motivo: `Manifesto ${demanda.mtr.numero} e CDF ${demanda.mtr.cdf.numero} registrados.` };
}

export interface CampoManifesto {
  rotulo: string;
  valor: string;
  /** Verdadeiro quando o sistema não tem como preencher e o gerador precisa informar. */
  aPreencher?: boolean;
  nota?: string;
}

export interface Transportador {
  nome: string;
  cnpj: string | null;
  impedimento: string | null;
}

/* No MTR o transportador é identificado por CNPJ: é a cooperativa que atende. */
export function transportadorDoMtr(demanda: Demanda): Transportador {
  const coop = Catalogo.cooperativa(Catalogo.destino(demanda.destino.id)?.cooperativa);
  if (coop) return { nome: coop.razao, cnpj: coop.cnpj, impedimento: null };
  return { nome: '—', cnpj: null, impedimento: 'A demanda ainda não tem cooperativa.' };
}

/**
 * O rascunho do manifesto: o que o gerador copia para o formulário do SINIR.
 * O valor está em não redigitar o que o sistema já sabe.
 */
export function rascunhoMtr(demanda: Demanda): CampoManifesto[] {
  const gerador = Catalogo.gerador(demanda.gerador.id);
  const destino = Catalogo.destino(demanda.destino.id);
  const transportador = transportadorDoMtr(demanda);
  const classe = CLASSE_RESIDUO[demanda.residuo];
  const massa = demanda.verificadoKg ?? demanda.coletadoKg;

  return [
    { rotulo: 'Gerador', valor: gerador?.nome || demanda.gerador.nome },
    { rotulo: 'CNPJ do gerador', valor: gerador?.cnpj || '', aPreencher: !gerador?.cnpj },
    { rotulo: 'Endereço da coleta', valor: Catalogo.endereco(demanda.ponto) },
    { rotulo: 'Transportador', valor: transportador.nome,
      aPreencher: !transportador.cnpj,
      nota: transportador.impedimento || undefined },
    { rotulo: 'CNPJ do transportador', valor: transportador.cnpj || '',
      aPreencher: !transportador.cnpj },
    { rotulo: 'Destinador', valor: destino?.nome || demanda.destino.nome },
    { rotulo: 'CNPJ do destinador', valor: destino?.cnpj || '', aPreencher: !destino?.cnpj },
    { rotulo: 'Licença do destinador', valor: destino?.licenca || '', aPreencher: !destino?.licenca },
    { rotulo: 'Resíduo', valor: Catalogo.nomeResiduo(demanda.residuo) },
    { rotulo: 'Classe (NBR 10004)', valor: classe?.classe || '',
      aPreencher: !classe, nota: classe?.nota },
    { rotulo: 'Código na Lista Brasileira de Resíduos', valor: '',
      aPreencher: true,
      nota: 'O código depende da caracterização do resíduo e da atividade do gerador. ' +
        'O sistema não preenche por conta própria para não induzir a erro no manifesto.' },
    { rotulo: 'Quantidade', valor: massa != null ? Fmt.kg(massa) : '', aPreencher: massa == null,
      nota: massa === demanda.verificadoKg
        ? 'Massa aferida na balança da cooperativa.'
        : 'Massa observada na coleta; ainda sem pesagem.' },
    { rotulo: 'Unidade', valor: 'quilograma' },
    { rotulo: 'Tecnologia de destinação', valor: DemandaRegras.destinoFinal(demanda) },
    { rotulo: 'Data do transporte', valor: Fmt.data(demanda.recebidaEm || demanda.prazo) },
    { rotulo: 'Referência no SAMAÚMA', valor: DemandaRegras.codigoVerificacao(demanda),
      nota: 'Campo livre do manifesto. Anotar aqui é o que permite cruzar o MTR com a carga depois.' }
  ];
}

/** Quantos campos o gerador ainda precisa completar à mão. */
export function faltamNoRascunho(demanda: Demanda): number {
  return rascunhoMtr(demanda).filter(c => c.aPreencher).length;
}
