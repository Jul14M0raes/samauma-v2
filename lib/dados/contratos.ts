/* Contrato GGR × Cooperativa (doc 09; DOC-006, RF-006): as coletas previstas
   em contrato. A agenda propõe e o Gerador confirma; nada é publicado sozinho. */

import { Recorrencia } from '../dominio/recorrencia';
import { Sessao } from '../dominio/sessao';
import { comando } from './comando';

type DadosAgenda = Parameters<typeof Recorrencia.criar>[1];

export const Contratos = {
  preverColeta: comando((dados: DadosAgenda) => Recorrencia.criar(Sessao.gerador, dados)),
  confirmar: comando((agendamentoId: string) => Recorrencia.confirmar(agendamentoId)),
  alternar: comando((agendamentoId: string) => Recorrencia.alternar(agendamentoId)),
  remover: comando((agendamentoId: string) => Recorrencia.remover(agendamentoId))
};
