/* SAMAÚMA — busca por texto nas listas.

   Quem procura um estabelecimento digita "madeira", não "Panificadora Madeira";
   quem procura um processo digita "1" ou "dem-0001". Por isso a comparação
   ignora acento, caixa e pontuação, e cada palavra digitada é exigida
   separadamente — "madeira centro" acha o que tem as duas, em qualquer ordem e
   em campos diferentes.

   Pontuação vira espaço em vez de sumir: assim "12.345.678/0001-90" e
   "12345678000190" encontram o mesmo CNPJ, e ninguém precisa saber de que jeito
   o dado foi guardado. */

export function normalizar(texto: unknown): string {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function termos(consulta: string): string[] {
  return normalizar(consulta).split(' ').filter(Boolean);
}

/* Um item entra no resultado quando TODOS os termos aparecem em algum de seus
   campos pesquisáveis. Exigir todos estreita a busca a cada palavra digitada,
   que é o que a pessoa espera ao continuar escrevendo. */
export function combina(campos: unknown[], consulta: string): boolean {
  const procurados = termos(consulta);
  if (!procurados.length) return true;
  const alvo = campos.map(normalizar).filter(Boolean).join(' ');
  const semSeparador = alvo.replace(/ /g, '');
  return procurados.every(t => alvo.includes(t) || semSeparador.includes(t));
}

export function filtrarPorTexto<T>(itens: T[], consulta: string, campos: (item: T) => unknown[]): T[] {
  if (!termos(consulta).length) return itens;
  return itens.filter(item => combina(campos(item), consulta));
}
