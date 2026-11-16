/* SAMAÚMA — leitura direta da balança. Protótipo: SIMULA o instrumento.
   Na implantação, `lerDaBalanca` passa a consultar o concentrador local que lê
   a balança; o resto do sistema não muda. */

export interface LeituraBalanca {
  /** Massa lida, em quilos. */
  kg: number;
  /** Identificação do instrumento, como ele se declara. */
  balanca: string;
  /** Verificação do INMETRO gravada no instrumento. */
  afericao: string;
  /** Identificador do registro dentro do instrumento. */
  leitura: string;
  /** Momento da leitura, pelo relógio do instrumento. */
  lidaEm: string;
  /** Sempre verdadeiro aqui: serve para a tela poder dizer o que é. */
  simulada: true;
}

/* Instrumento fictício da unidade de triagem da demonstração. Os dados são
   plausíveis, e a validade da aferição é futura de propósito: balança com
   verificação vencida não pode ser usada em transação comercial, e uma
   demonstração que ignorasse isso ensinaria a coisa errada. */
const INSTRUMENTO = {
  balanca: 'Toledo 2098 · plataforma 3 t · patrimônio 004712',
  afericao: 'INMETRO 2026/114, válida até 31/07/2027'
};

/* Ruído da leitura em torno do peso de campo.

   A balança não vai concordar exatamente com o que o catador anotou -- e é
   dessa diferença que vive a tolerância do sistema. Manter o desvio pequeno
   (até 2%) faz a leitura simulada cair dentro da tolerância de 5%, que é o
   comportamento normal; para exercitar pendência, a portaria continua podendo
   digitar o número à mão. */
function ruido(sementeTexto: string): number {
  let h = 0;
  for (let i = 0; i < sementeTexto.length; i++) h = (h * 31 + sementeTexto.charCodeAt(i)) % 1000;
  return (h / 1000) * 0.04 - 0.02;
}

/**
 * Lê a massa do instrumento. Recebe o peso de campo apenas para simular uma
 * leitura coerente com a carga que está no pátio -- a implantação real não
 * precisa deste argumento.
 */
export async function lerDaBalanca(referenciaKg: number, chave: string): Promise<LeituraBalanca> {
  /* A espera existe para a tela ter de fato um estado "lendo": numa balança
     real a resposta não é instantânea, e uma interface que assume que é
     quebra na primeira vez que o instrumento demora. */
  await new Promise(r => setTimeout(r, 700));

  const kg = Math.max(1, Math.round(referenciaKg * (1 + ruido(chave))));
  return {
    kg,
    balanca: INSTRUMENTO.balanca,
    afericao: INSTRUMENTO.afericao,
    leitura: 'LT' + String(Math.abs(kg * 7919 % 100000)).padStart(5, '0'),
    lidaEm: new Date().toISOString(),
    simulada: true
  };
}
