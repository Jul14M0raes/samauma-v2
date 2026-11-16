/* Documentos emitidos (doc 09; DOC-001). O Gerador vincula o MTR emitido no
   SINIR (RF-020); o CDF fecha o manifesto do lado de quem recebeu. */

import { Store } from '../dominio/store';
import { autor, comando } from './comando';

export const Documentos = {
  vincularMtr: comando((id: string, numero: string, emitidoEm?: string) =>
    Store.registrarMtr(id, { numero, emitidoEm, registradoPor: autor() })),
  registrarCdf: comando((id: string, numero: string) => Store.registrarCdf(id, { numero, registradoPor: autor() }))
};
