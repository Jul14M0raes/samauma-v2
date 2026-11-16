/* Identificação dos cooperados no programa municipal e portaria (RF-014,
   RF-016). Mantida pela cooperativa, nunca pelo próprio cooperado. */

import { Carteiras as Armazem, type TipoPassagem } from '../dominio/carteira';
import { Sessao } from '../dominio/sessao';
import { autor, comando } from './comando';

export const Identificacao = {
  registrarPassagem: comando((codigo: string, tipo: TipoPassagem, cargaKg: number | null) =>
    Armazem.registrarPassagem(codigo, { localId: Sessao.destino.id, registradoPor: autor(), tipo, cargaKg })),
  emitir: comando((catadorId: string, motivo?: string) => Armazem.emitir(catadorId, { emitidaPor: autor(), motivo })),
  renovar: comando((numero: string) => Armazem.renovar(numero, { autor: autor() })),
  reativar: comando((numero: string) => Armazem.reativar(numero, { autor: autor() })),
  suspender: comando((numero: string, motivo: string) => Armazem.suspender(numero, { autor: autor(), motivo }))
};
