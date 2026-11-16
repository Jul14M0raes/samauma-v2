/* SAMAÚMA — a porta de escrita das telas (backend-ready).

   Toda alteração de dado sai de uma tela por um comando de `lib/dados`. Hoje o
   comando chama o domínio no navegador (localStorage); com backend, o corpo
   vira uma chamada à API com o mesmo contrato, descrito em
   `docs/tecnico/contratos-de-dados.md`. Os comandos já são assíncronos para
   que as telas não mudem quando isso acontecer.

   O autor de cada ato vem da sessão, nunca da tela (RN-026). */

import { Sessao } from '../dominio/sessao';

export const autor = (): string => Sessao.autor;

/* Cooperativa da sessão: a organização em nome de quem a Cooperativa age. */
export function cooperativaDaSessao(): string {
  const id = Sessao.destino.cooperativa;
  if (!id) throw new Error('A sessão não está vinculada a uma cooperativa.');
  return id;
}

/* Envolve uma operação síncrona do domínio numa Promise: erro de regra vira
   rejeição com a mesma mensagem. */
export function comando<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => Promise<R> {
  return async (...args: A) => fn(...args);
}
