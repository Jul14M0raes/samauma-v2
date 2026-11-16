/* SAMAÚMA — gerador de QR Code (ISO/IEC 18004, modelo 2, modo byte).

   Escrito aqui em vez de instalado porque o site é exportado estático e roda
   sem servidor: uma dependência a menos é uma dependência a menos para auditar
   na homologação da SMTI, e o código impresso na carteirinha precisa ser
   reproduzível byte a byte por quem for conferir.

   Cobre as versões 1 a 10 (até 271 caracteres no nível L), o que é folgado para
   as URLs de verificação do sistema. Os quatro níveis de correção estão
   disponíveis; a carteirinha usa Q, que tolera cerca de 25% de dano — carteira
   de trabalhador vive no bolso, molha, amassa e desbota. */

export type NivelCorrecao = 'L' | 'M' | 'Q' | 'H';

export interface MatrizQr {
  /** Lado da matriz em módulos, sem a margem. */
  tamanho: number;
  /** `modulos[linha][coluna]`; verdadeiro é módulo escuro. */
  modulos: boolean[][];
  versao: number;
  nivel: NivelCorrecao;
  mascara: number;
}

/* Por versão e nível: [correção por bloco, blocos do grupo 1, dados por bloco
   do grupo 1, blocos do grupo 2, dados por bloco do grupo 2]. Tabela 13-22 da
   norma, transcrita apenas até a versão 10. */
const BLOCOS: Record<NivelCorrecao, number[][]> = {
  L: [[], [7, 1, 19, 0, 0], [10, 1, 34, 0, 0], [15, 1, 55, 0, 0], [20, 1, 80, 0, 0], [26, 1, 108, 0, 0],
      [18, 2, 68, 0, 0], [20, 2, 78, 0, 0], [24, 2, 97, 0, 0], [30, 2, 116, 0, 0], [18, 2, 68, 2, 69]],
  M: [[], [10, 1, 16, 0, 0], [16, 1, 28, 0, 0], [26, 1, 44, 0, 0], [18, 2, 32, 0, 0], [24, 2, 43, 0, 0],
      [16, 4, 27, 0, 0], [18, 4, 31, 0, 0], [22, 2, 38, 2, 39], [22, 3, 36, 2, 37], [26, 4, 43, 1, 44]],
  Q: [[], [13, 1, 13, 0, 0], [22, 1, 22, 0, 0], [18, 2, 17, 0, 0], [26, 2, 24, 0, 0], [18, 2, 15, 2, 16],
      [24, 4, 19, 0, 0], [18, 2, 14, 4, 15], [22, 4, 18, 2, 19], [20, 4, 16, 4, 17], [24, 6, 19, 2, 20]],
  H: [[], [17, 1, 9, 0, 0], [28, 1, 16, 0, 0], [22, 2, 13, 0, 0], [16, 4, 9, 0, 0], [22, 2, 11, 2, 12],
      [28, 4, 15, 0, 0], [26, 4, 13, 1, 14], [26, 4, 14, 2, 15], [24, 4, 12, 4, 13], [28, 6, 15, 2, 16]]
};

/* Centros dos padrões de alinhamento por versão. */
const ALINHAMENTO = [[], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
  [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

const BITS_NIVEL: Record<NivelCorrecao, number> = { L: 0b01, M: 0b00, Q: 0b11, H: 0b10 };

const VERSAO_MAXIMA = 10;

/* ---- Corpo finito GF(256), polinômio primitivo 0x11D ---- */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

(function tabelasGalois() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function multiplicar(a: number, b: number): number {
  return a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]];
}

function polinomioGerador(grau: number): number[] {
  let g = [1];
  for (let i = 0; i < grau; i++) {
    const proximo = new Array<number>(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      proximo[j] ^= multiplicar(g[j], 1);
      proximo[j + 1] ^= multiplicar(g[j], EXP[i]);
    }
    g = proximo;
  }
  return g;
}

function correcao(dados: number[], quantidade: number): number[] {
  const gerador = polinomioGerador(quantidade);
  const resto = dados.concat(new Array<number>(quantidade).fill(0));
  for (let i = 0; i < dados.length; i++) {
    const coeficiente = resto[i];
    if (coeficiente === 0) continue;
    for (let j = 0; j < gerador.length; j++) {
      resto[i + j] ^= multiplicar(gerador[j], coeficiente);
    }
  }
  return resto.slice(dados.length);
}

/* ---- Codificação dos dados ---- */

function bytesUtf8(texto: string): number[] {
  if (typeof TextEncoder !== 'undefined') return Array.from(new TextEncoder().encode(texto));
  return Array.from(unescape(encodeURIComponent(texto)), c => c.charCodeAt(0));
}

function capacidadeDados(versao: number, nivel: NivelCorrecao): number {
  const [, b1, d1, b2, d2] = BLOCOS[nivel][versao];
  return b1 * d1 + b2 * d2;
}

export function menorVersao(bytes: number, nivel: NivelCorrecao, minima: number): number {
  for (let versao = Math.max(1, minima); versao <= VERSAO_MAXIMA; versao++) {
    /* 4 bits de modo + contador (8 bits até a v9, 16 a partir da v10). */
    const cabecalho = 4 + (versao < 10 ? 8 : 16);
    if (capacidadeDados(versao, nivel) * 8 >= cabecalho + bytes * 8) return versao;
  }
  throw new Error(`Conteúdo longo demais para QR Code até a versão ${VERSAO_MAXIMA}: ${bytes} bytes.`);
}

class Fita {
  bits: number[] = [];
  empurrar(valor: number, quantidade: number) {
    for (let i = quantidade - 1; i >= 0; i--) this.bits.push((valor >> i) & 1);
  }
}

export function codewordsDeDados(texto: string, versao: number, nivel: NivelCorrecao): number[] {
  const bytes = bytesUtf8(texto);
  const capacidade = capacidadeDados(versao, nivel);
  const fita = new Fita();

  fita.empurrar(0b0100, 4);                              /* modo byte */
  fita.empurrar(bytes.length, versao < 10 ? 8 : 16);     /* contador de caracteres */
  bytes.forEach(b => fita.empurrar(b, 8));

  const limite = capacidade * 8;
  fita.empurrar(0, Math.min(4, limite - fita.bits.length));      /* terminador */
  while (fita.bits.length % 8) fita.bits.push(0);                /* fecha o byte */

  const codewords: number[] = [];
  for (let i = 0; i < fita.bits.length; i += 8) {
    codewords.push(fita.bits.slice(i, i + 8).reduce((valor, bit) => (valor << 1) | bit, 0));
  }
  /* Preenchimento fixo da norma: 0xEC e 0x11 alternados, sempre começando pelo
     0xEC, independente de quantos codewords de dados vieram antes. */
  const enchimento = [0xec, 0x11];
  for (let i = 0; codewords.length < capacidade; i++) codewords.push(enchimento[i % 2]);
  return codewords;
}

export function intercalar(dados: number[], versao: number, nivel: NivelCorrecao): number[] {
  const [ecc, b1, d1, b2, d2] = BLOCOS[nivel][versao];
  const blocosDados: number[][] = [];
  const blocosEcc: number[][] = [];

  let posicao = 0;
  const acrescentar = (quantos: number, tamanho: number) => {
    for (let i = 0; i < quantos; i++) {
      const bloco = dados.slice(posicao, posicao + tamanho);
      posicao += tamanho;
      blocosDados.push(bloco);
      blocosEcc.push(correcao(bloco, ecc));
    }
  };
  acrescentar(b1, d1);
  acrescentar(b2, d2);

  const saida: number[] = [];
  const maiorDado = Math.max(d1, d2);
  for (let i = 0; i < maiorDado; i++) {
    blocosDados.forEach(bloco => { if (i < bloco.length) saida.push(bloco[i]); });
  }
  for (let i = 0; i < ecc; i++) {
    blocosEcc.forEach(bloco => saida.push(bloco[i]));
  }
  return saida;
}

/* ---- Desenho da matriz ---- */

type Grade = (boolean | null)[][];

function gradeVazia(tamanho: number): Grade {
  return Array.from({ length: tamanho }, () => new Array<boolean | null>(tamanho).fill(null));
}

function porPadrao(grade: Grade, linha: number, coluna: number, valor: boolean) {
  if (linha < 0 || coluna < 0 || linha >= grade.length || coluna >= grade.length) return;
  grade[linha][coluna] = valor;
}

function localizador(grade: Grade, linha: number, coluna: number) {
  for (let i = -1; i <= 7; i++) {
    for (let j = -1; j <= 7; j++) {
      const dentro = i >= 0 && i <= 6 && j >= 0 && j <= 6;
      const escuro = dentro && (i === 0 || i === 6 || j === 0 || j === 6 ||
        (i >= 2 && i <= 4 && j >= 2 && j <= 4));
      porPadrao(grade, linha + i, coluna + j, escuro);
    }
  }
}

function alinhamento(grade: Grade, versao: number) {
  const centros = ALINHAMENTO[versao];
  const ultimo = centros[centros.length - 1];
  centros.forEach(linha => centros.forEach(coluna => {
    /* Os três cantos já são ocupados pelos localizadores. */
    if ((linha === 6 && coluna === 6) || (linha === 6 && coluna === ultimo) || (linha === ultimo && coluna === 6)) return;
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        porPadrao(grade, linha + i, coluna + j, Math.max(Math.abs(i), Math.abs(j)) !== 1);
      }
    }
  }));
}

function reservarFormato(grade: Grade) {
  const n = grade.length;
  for (let i = 0; i < 9; i++) {
    if (grade[8][i] === null) grade[8][i] = false;
    if (grade[i][8] === null) grade[i][8] = false;
  }
  for (let i = 0; i < 8; i++) {
    if (grade[8][n - 1 - i] === null) grade[8][n - 1 - i] = false;
    if (grade[n - 1 - i][8] === null) grade[n - 1 - i][8] = false;
  }
}

function esqueleto(versao: number): Grade {
  const n = versao * 4 + 17;
  const grade = gradeVazia(n);

  localizador(grade, 0, 0);
  localizador(grade, 0, n - 7);
  localizador(grade, n - 7, 0);
  alinhamento(grade, versao);

  for (let i = 8; i < n - 8; i++) {
    const escuro = i % 2 === 0;
    grade[6][i] = escuro;
    grade[i][6] = escuro;
  }
  grade[n - 8][8] = true;   /* módulo sempre escuro */

  if (versao >= 7) {
    const info = infoVersao(versao);
    for (let i = 0; i < 18; i++) {
      const bit = ((info >> i) & 1) === 1;
      grade[Math.floor(i / 3)][n - 11 + (i % 3)] = bit;
      grade[n - 11 + (i % 3)][Math.floor(i / 3)] = bit;
    }
  }

  reservarFormato(grade);
  return grade;
}

function infoVersao(versao: number): number {
  let resto = versao << 12;
  for (let i = 0; i < 12; i++) {
    if ((resto >> (17 - i)) & 1) resto ^= 0x1f25 << (5 - i);
  }
  return (versao << 12) | (resto & 0xfff);
}

function infoFormato(nivel: NivelCorrecao, mascara: number): number {
  const dados = (BITS_NIVEL[nivel] << 3) | mascara;
  let resto = dados << 10;
  for (let i = 0; i < 5; i++) {
    if ((resto >> (14 - i)) & 1) resto ^= 0x537 << (4 - i);
  }
  return ((dados << 10) | (resto & 0x3ff)) ^ 0x5412;
}

const MASCARAS: ((i: number, j: number) => boolean)[] = [
  (i, j) => (i + j) % 2 === 0,
  (i) => i % 2 === 0,
  (_i, j) => j % 3 === 0,
  (i, j) => (i + j) % 3 === 0,
  (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0,
  (i, j) => ((i * j) % 2) + ((i * j) % 3) === 0,
  (i, j) => (((i * j) % 2) + ((i * j) % 3)) % 2 === 0,
  (i, j) => (((i + j) % 2) + ((i * j) % 3)) % 2 === 0
];

function semearDados(grade: Grade, codewords: number[]): [number, number][] {
  const n = grade.length;
  const posicoes: [number, number][] = [];
  let bit = 0;
  let subindo = true;

  let direita = n - 1;
  while (direita > 0) {
    if (direita === 6) direita -= 1;   /* a coluna 6 é a linha de tempo */
    for (let passo = 0; passo < n; passo++) {
      const linha = subindo ? n - 1 - passo : passo;
      for (const coluna of [direita, direita - 1]) {
        if (grade[linha][coluna] !== null) continue;
        const byte = codewords[bit >> 3];
        grade[linha][coluna] = byte !== undefined && ((byte >> (7 - (bit & 7))) & 1) === 1;
        posicoes.push([linha, coluna]);
        bit++;
      }
    }
    subindo = !subindo;
    direita -= 2;
  }
  return posicoes;
}

function aplicarMascara(grade: Grade, livres: [number, number][], mascara: number): boolean[][] {
  const copia = grade.map(linha => linha.map(v => v === true));
  const regra = MASCARAS[mascara];
  livres.forEach(([linha, coluna]) => {
    if (regra(linha, coluna)) copia[linha][coluna] = !copia[linha][coluna];
  });
  return copia;
}

function gravarFormato(matriz: boolean[][], nivel: NivelCorrecao, mascara: number) {
  const n = matriz.length;
  const info = infoFormato(nivel, mascara);
  for (let i = 0; i < 15; i++) {
    const bit = ((info >> i) & 1) === 1;
    /* Cópia junto ao localizador superior esquerdo. */
    if (i < 6) matriz[i][8] = bit;
    else if (i < 8) matriz[i + 1][8] = bit;
    else if (i === 8) matriz[8][7] = bit;
    else matriz[8][14 - i] = bit;
    /* Cópia repartida entre os outros dois localizadores. */
    if (i < 8) matriz[8][n - 1 - i] = bit;
    else matriz[n - 15 + i][8] = bit;
  }
}

function penalidade(matriz: boolean[][]): number {
  const n = matriz.length;
  let total = 0;

  const contarCorrida = (ler: (a: number, b: number) => boolean) => {
    for (let a = 0; a < n; a++) {
      let corrida = 1;
      for (let b = 1; b < n; b++) {
        if (ler(a, b) === ler(a, b - 1)) {
          corrida++;
        } else {
          if (corrida >= 5) total += 3 + (corrida - 5);
          corrida = 1;
        }
      }
      if (corrida >= 5) total += 3 + (corrida - 5);
    }
  };
  contarCorrida((linha, coluna) => matriz[linha][coluna]);
  contarCorrida((coluna, linha) => matriz[linha][coluna]);

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1; j++) {
      const v = matriz[i][j];
      if (v === matriz[i][j + 1] && v === matriz[i + 1][j] && v === matriz[i + 1][j + 1]) total += 3;
    }
  }

  const alvo = [true, false, true, true, true, false, true, false, false, false, false];
  const alvoInverso = alvo.slice().reverse();
  const casa = (ler: (k: number) => boolean, inicio: number, molde: boolean[]) =>
    molde.every((v, k) => ler(inicio + k) === v);
  for (let a = 0; a < n; a++) {
    for (let b = 0; b <= n - 11; b++) {
      if (casa(k => matriz[a][k], b, alvo) || casa(k => matriz[a][k], b, alvoInverso)) total += 40;
      if (casa(k => matriz[k][a], b, alvo) || casa(k => matriz[k][a], b, alvoInverso)) total += 40;
    }
  }

  const escuros = matriz.reduce((soma, linha) => soma + linha.filter(Boolean).length, 0);
  const proporcao = (escuros * 100) / (n * n);
  total += Math.floor(Math.abs(proporcao - 50) / 5) * 10;

  return total;
}

/** Codifica o texto e devolve a matriz de módulos já mascarada. */
export function gerarQr(texto: string, opcoes: { nivel?: NivelCorrecao; versaoMinima?: number; mascara?: number } = {}): MatrizQr {
  const nivel = opcoes.nivel || 'M';
  const versao = menorVersao(bytesUtf8(texto).length, nivel, opcoes.versaoMinima || 1);
  const dados = codewordsDeDados(texto, versao, nivel);
  const fluxo = intercalar(dados, versao, nivel);

  const grade = esqueleto(versao);
  const livres = semearDados(grade, fluxo);

  let melhor: boolean[][] | null = null;
  let melhorMascara = 0;
  let melhorNota = Infinity;
  const candidatas = opcoes.mascara != null ? [opcoes.mascara] : [0, 1, 2, 3, 4, 5, 6, 7];
  for (const mascara of candidatas) {
    const candidata = aplicarMascara(grade, livres, mascara);
    gravarFormato(candidata, nivel, mascara);
    const nota = penalidade(candidata);
    if (nota < melhorNota) {
      melhorNota = nota;
      melhor = candidata;
      melhorMascara = mascara;
    }
  }

  return { tamanho: grade.length, modulos: melhor!, versao, nivel, mascara: melhorMascara };
}

/* ---- Saídas ---- */

/** Caminho SVG único com todos os módulos escuros, em coordenadas de módulo. */
export function caminhoQr(matriz: MatrizQr): string {
  const partes: string[] = [];
  matriz.modulos.forEach((linha, i) => {
    let inicio = -1;
    linha.forEach((escuro, j) => {
      if (escuro && inicio < 0) inicio = j;
      if ((!escuro || j === linha.length - 1) && inicio >= 0) {
        const fim = escuro ? j + 1 : j;
        partes.push(`M${inicio} ${i}h${fim - inicio}v1h-${fim - inicio}z`);
        inicio = -1;
      }
    });
  });
  return partes.join('');
}

/** SVG completo, para arquivo baixado ou impressão fora do React. */
export function svgQr(texto: string, opcoes: { nivel?: NivelCorrecao; margem?: number; cor?: string; titulo?: string } = {}): string {
  const matriz = gerarQr(texto, { nivel: opcoes.nivel });
  const margem = opcoes.margem ?? 2;
  const lado = matriz.tamanho + margem * 2;
  const titulo = opcoes.titulo || 'QR Code de verificação';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}" role="img" aria-label="${titulo}" shape-rendering="crispEdges">` +
    `<rect width="${lado}" height="${lado}" fill="#fff"/>` +
    `<g transform="translate(${margem} ${margem})" fill="${opcoes.cor || '#12241c'}">` +
    `<path d="${caminhoQr(matriz)}"/></g></svg>`;
}
