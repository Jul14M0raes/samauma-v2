/* Campos numéricos dos formulários.

   Este arquivo existe por causa de um defeito que quase foi para uma
   demonstração: o campo de quantidade da nova demanda tinha `min={1}` com
   `step={10}`, e o navegador calcula os valores válidos a partir do mínimo —
   1, 11, 21, e assim por diante. Todo número redondo era recusado.

   O pior não era a recusa, era o silêncio: o formulário simplesmente não
   enviava, com um balão do navegador preso a um campo fora da tela. Quem
   apresentasse digitaria 500, clicaria e não aconteceria nada.

   O teste lê os arquivos de tela e reprova a combinação, porque este é um erro
   que nenhum teste de domínio pega: a regra estava certa, a porta é que não
   abria. */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const RAIZ = join(__dirname, '..', '..', '..');

function arquivosDeTela(dir: string, achados: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    if (nome === 'node_modules' || nome === '.next' || nome === 'out') continue;
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) arquivosDeTela(caminho, achados);
    else if (nome.endsWith('.tsx')) achados.push(caminho);
  }
  return achados;
}

/** Cada `<input type="number">` do arquivo, com seus atributos. */
function camposNumericos(conteudo: string): string[] {
  return conteudo.match(/<input[^>]*type="number"[^>]*>/g) || [];
}

function atributoNumerico(campo: string, nome: string): number | null {
  const m = campo.match(new RegExp(nome + '=\\{?"?([0-9.]+)'));
  return m ? Number(m[1]) : null;
}

describe('nenhum campo numérico recusa número redondo', () => {
  const telas = [
    ...arquivosDeTela(join(RAIZ, 'app')),
    ...arquivosDeTela(join(RAIZ, 'components'))
  ];

  it('encontra os arquivos de tela do projeto', () => {
    expect(telas.length).toBeGreaterThan(10);
  });

  /* O navegador conta os passos a partir do `min`. Se o mínimo não for múltiplo
     do passo, os valores válidos ficam deslocados e todo número redondo é
     recusado — silenciosamente, porque o formulário apenas não envia. */
  it('todo min é múltiplo do step, quando os dois existem', () => {
    const quebrados: string[] = [];

    for (const caminho of telas) {
      const conteudo = readFileSync(caminho, 'utf8');
      for (const campo of camposNumericos(conteudo)) {
        const min = atributoNumerico(campo, 'min');
        const step = atributoNumerico(campo, 'step');
        if (min == null || step == null || step <= 0) continue;

        const passos = min / step;
        if (Math.abs(passos - Math.round(passos)) > 1e-9) {
          const id = (campo.match(/id="([^"]+)"/) || [])[1] || campo.slice(0, 60);
          quebrados.push(`${caminho.replace(RAIZ, '')} · ${id} · min=${min} step=${step}`);
        }
      }
    }

    expect(quebrados).toEqual([]);
  });

  /* Campo de massa em quilos não deveria obrigar passo largo: quem digita sabe
     o peso que leu na balança, e arredondar por imposição da tela falsearia a
     medição que o sistema inteiro existe para provar. */
  it('campos de massa aceitam qualquer valor', () => {
    const comPassoLargo: string[] = [];

    for (const caminho of telas) {
      const conteudo = readFileSync(caminho, 'utf8');
      for (const campo of camposNumericos(conteudo)) {
        const id = (campo.match(/id="([^"]+)"/) || [])[1] || '';
        if (!/kg|peso|quantidade|massa|recebido|conciliado|valorCorrigido/i.test(id)) continue;

        const step = atributoNumerico(campo, 'step');
        if (step != null && step > 1) {
          comPassoLargo.push(`${caminho.replace(RAIZ, '')} · ${id} · step=${step}`);
        }
      }
    }

    expect(comPassoLargo).toEqual([]);
  });
});
