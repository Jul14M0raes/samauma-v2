/* Parâmetros do município (RF-004), auditados com autor e valores. */

import { Parametros as Armazem, type IdParametro } from '../dominio/parametros';
import { autor, comando } from './comando';

export const Configuracao = {
  definir: comando((id: IdParametro, valor: number) => Armazem.definir(id, valor, autor())),
  definirPreco: comando((residuo: string, valor: number) => Armazem.definirPreco(residuo, valor, autor())),
  restaurar: comando(() => Armazem.restaurar(autor()))
};
