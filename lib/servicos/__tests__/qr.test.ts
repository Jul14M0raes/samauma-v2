/* O gerador de QR Code é o único código do sistema que ninguém consegue
   conferir olhando: um módulo trocado não parece errado, só deixa de ler.

   As matrizes abaixo foram conferidas, uma a uma, contra um codificador
   independente — 360 combinações de texto, nível de correção e máscara, todas
   idênticas. Os resumos servem para travar esse resultado: se alguém mexer nas
   tabelas ou no percurso e o resumo mudar, o código parou de ser o mesmo. */

import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { caminhoQr, codewordsDeDados, gerarQr, intercalar, menorVersao, svgQr, type NivelCorrecao } from '../qr';

function resumo(texto: string, nivel: NivelCorrecao) {
  const matriz = gerarQr(texto, { nivel });
  const desenho = matriz.modulos.map(l => l.map(v => (v ? '1' : '0')).join('')).join('\n');
  return { matriz, hash: createHash('sha256').update(desenho).digest('hex').slice(0, 16) };
}

describe('QR Code', () => {
  it('escolhe a menor versão que comporta o conteúdo', () => {
    /* Os limites da tabela da norma: 17 bytes na 1-L, 7 na 1-H. */
    expect(menorVersao(1, 'L', 1)).toBe(1);
    expect(menorVersao(17, 'L', 1)).toBe(1);
    expect(menorVersao(18, 'L', 1)).toBe(2);
    expect(menorVersao(7, 'H', 1)).toBe(1);
    expect(menorVersao(8, 'H', 1)).toBe(2);
  });

  it('recusa conteúdo que não cabe na maior versão prevista', () => {
    expect(() => gerarQr('x'.repeat(400), { nivel: 'H' })).toThrow(/longo demais/i);
  });

  it('preenche os dados com 0xEC e 0x11 alternados, sempre começando pelo 0xEC', () => {
    /* 'A' ocupa 3 codewords na versão 1-L; os 16 restantes são enchimento. */
    const dados = codewordsDeDados('A', 1, 'L');
    expect(dados).toHaveLength(19);
    expect(dados.slice(0, 3)).toEqual([0x40, 0x14, 0x10]);
    expect(dados.slice(3, 7)).toEqual([0xec, 0x11, 0xec, 0x11]);
  });

  it('intercala dados e correção no total de codewords da versão', () => {
    /* Versão 5-Q: 2 blocos de 15 e 2 de 16, com 18 de correção cada. */
    const dados = codewordsDeDados('y'.repeat(60), 5, 'Q');
    expect(dados).toHaveLength(62);
    expect(intercalar(dados, 5, 'Q')).toHaveLength(134);
  });

  it('monta a matriz no tamanho da versão', () => {
    expect(gerarQr('A', { nivel: 'L' }).tamanho).toBe(21);
    expect(gerarQr('x'.repeat(60), { nivel: 'H' }).tamanho).toBe(45);
  });

  it('desenha os três localizadores e a linha de tempo', () => {
    const { modulos, tamanho } = gerarQr('SAM-G01-202608', { nivel: 'Q' });
    const olho = (linha: number, coluna: number) => {
      expect(modulos[linha][coluna]).toBe(true);          /* canto do anel */
      expect(modulos[linha + 1][coluna + 1]).toBe(false);  /* trilha clara */
      expect(modulos[linha + 3][coluna + 3]).toBe(true);   /* miolo */
    };
    olho(0, 0);
    olho(0, tamanho - 7);
    olho(tamanho - 7, 0);

    for (let i = 8; i < tamanho - 8; i++) {
      expect(modulos[6][i]).toBe(i % 2 === 0);
      expect(modulos[i][6]).toBe(i % 2 === 0);
    }
    expect(modulos[tamanho - 8][8]).toBe(true);            /* módulo sempre escuro */
  });

  it('não deixa a área de dados em branco nem toda preenchida', () => {
    const { modulos, tamanho } = gerarQr('https://samauma.portovelho.ro.gov.br/carteira/PVH-CAT-2026-0001', { nivel: 'Q' });
    const escuros = modulos.reduce((soma, linha) => soma + linha.filter(Boolean).length, 0);
    const proporcao = escuros / (tamanho * tamanho);
    expect(proporcao).toBeGreaterThan(0.35);
    expect(proporcao).toBeLessThan(0.65);
  });

  it('produz sempre a mesma matriz para o mesmo conteúdo', () => {
    const casos: [string, NivelCorrecao, number, string][] = [
      ['A', 'L', 1, 'f195dbbdf146dae0'],
      ['HELLO WORLD', 'M', 1, '2d21897bf5a7ac60'],
      ['SAM-G01-202608', 'Q', 2, '910fb88f34fcda4e'],
      ['https://samauma.portovelho.ro.gov.br/carteira/PVH-CAT-2026-0001', 'Q', 6, '622294be6e640971'],
      ['Acentuação: João Silva · CATANORTE · Porto Velho/RO', 'H', 6, '10f756b0c9a62ed1'],
      ['k'.repeat(210), 'L', 9, '1d8b537d43336555']
    ];
    for (const [texto, nivel, versao, hash] of casos) {
      const atual = resumo(texto, nivel);
      expect(atual.matriz.versao, `versão de ${texto.slice(0, 20)}`).toBe(versao);
      expect(atual.hash, `matriz de ${texto.slice(0, 20)} em ${nivel}`).toBe(hash);
    }
  });

  it('gera SVG autônomo com margem e caminho único', () => {
    const svg = svgQr('PVH-CAT-2026-0001-K7', { nivel: 'Q', margem: 2 });
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    expect(svg).toContain('shape-rendering="crispEdges"');
    expect(svg.match(/<path /g)).toHaveLength(1);

    const matriz = gerarQr('PVH-CAT-2026-0001-K7', { nivel: 'Q' });
    expect(svg).toContain(`viewBox="0 0 ${matriz.tamanho + 4} ${matriz.tamanho + 4}"`);
    expect(caminhoQr(matriz).startsWith('M')).toBe(true);
  });
});
