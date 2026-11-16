/* SAMAÚMA — código verificável.

   Três coisas no sistema precisam ser conferidas no campo, por gente diferente,
   sem login e às vezes sem sinal: a carteira do catador, o selo do gerador e a
   demanda de coleta. As três usam o mesmo mecanismo daqui — um código legível,
   dois caracteres de conferência e um endereço público — porque quem confere é
   a mesma pessoa: o porteiro, o fiscal, o cliente do supermercado.

   O que o dígito faz: pega erro de digitação e cópia apressada. O que ele não
   faz: impedir falsificação. Quem quiser forjar um código consegue; por isso a
   prova nunca é o papel, é a conferência em linha, e é ela que o QR abre. */

import { ALFABETO_CODIGO } from './formato';

/** Dois caracteres de conferência calculados sobre o corpo do código. */
export function digitoVerificador(base: string): string {
  let soma = 0;
  let peso = 2;
  for (const caractere of base.toUpperCase().replace(/[^0-9A-Z]/g, '')) {
    const valor = caractere >= '0' && caractere <= '9'
      ? caractere.charCodeAt(0) - 48
      : caractere.charCodeAt(0) - 55;
    soma += valor * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const primeiro = soma % ALFABETO_CODIGO.length;
  const segundo = Math.floor(soma / ALFABETO_CODIGO.length) % ALFABETO_CODIGO.length;
  return ALFABETO_CODIGO[primeiro] + ALFABETO_CODIGO[segundo];
}

/** Corpo mais dígito: é isto que vai impresso e dentro do QR Code. */
export function comDigito(base: string): string {
  return `${base}-${digitoVerificador(base)}`;
}

/** Normaliza o que foi digitado ou lido: maiúsculas, sem espaço. */
export function limparCodigo(bruto: unknown): string {
  return String(bruto ?? '').trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * Aceita o corpo puro ou o código completo com dígito e devolve o corpo, ou
 * nulo quando o formato não bate ou o dígito não confere.
 *
 * @param formato expressão que descreve o corpo, sem o dígito.
 */
export function corpoDoCodigo(bruto: unknown, formato: RegExp): string | null {
  const limpo = limparCodigo(bruto);
  if (!limpo) return null;

  const fonte = formato.source.replace(/^\^/, '').replace(/\$$/, '');
  const completo = limpo.match(new RegExp(`^(${fonte})-([0-9A-Z]{2})$`));
  if (completo) return digitoVerificador(completo[1]) === completo[2] ? completo[1] : null;

  return new RegExp(`^${fonte}$`).test(limpo) ? limpo : null;
}

/* Formatos dos três códigos do sistema. Ficam juntos de propósito: é a lista
   do que existe para ser conferido no campo. */
export const FORMATO_CARTEIRA = /PVH-CAT-\d{4}-\d{4}/;
export const FORMATO_DEMANDA = /DEM-\d{4}/;

export type TipoCredencial = 'carteira' | 'demanda';

/** Reconhece qual das três credenciais é o código lido. */
export function tipoDoCodigo(bruto: unknown): TipoCredencial | null {
  if (corpoDoCodigo(bruto, FORMATO_CARTEIRA)) return 'carteira';
  if (corpoDoCodigo(bruto, FORMATO_DEMANDA)) return 'demanda';
  return null;
}
