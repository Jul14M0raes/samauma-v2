import { describe, expect, it } from 'vitest';
import { exportarBackup, importarBackup, lerBackup } from '../backup';

function armazem(inicial: Record<string, string> = {}) {
  const m = new Map(Object.entries(inicial));
  return {
    m,
    get length() { return m.size; },
    key: (i: number) => [...m.keys()][i] ?? null,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { m.set(k, v); },
    removeItem: (k: string) => { m.delete(k); }
  };
}

const DADOS = { 'samauma.next.demandas.v1': '{"a":1}', 'samauma.next.cadastros.v1': '[1,2]' };

describe('backup', () => {
  it('exporta só dados do sistema, sem preferências do aparelho nem chaves alheias', () => {
    const a = armazem({ ...DADOS, 'samauma.next.acessibilidade.v1': '{}', 'samauma.next.sidebar.v1': '1', outra: 'x' });
    expect(Object.keys(exportarBackup(a).chaves).sort()).toEqual(Object.keys(DADOS).sort());
  });

  it('ida e volta restaura o mesmo estado e remove o que não estava no arquivo', () => {
    const arquivo = JSON.stringify(exportarBackup(armazem(DADOS)));
    const destino = armazem({ 'samauma.next.demandas.v1': '{"velho":true}', 'samauma.next.vendas.v1': '[]', 'samauma.next.sidebar.v1': '1' });
    const r = importarBackup(destino, arquivo);
    expect(r).toEqual({ ok: true, chaves: 2 });
    expect(Object.fromEntries(destino.m)).toEqual({ ...DADOS, 'samauma.next.sidebar.v1': '1' });
  });

  it('arquivo inválido não toca em nada', () => {
    const destino = armazem(DADOS);
    const antes = JSON.stringify([...destino.m]);
    const ruins = [
      'não é json',
      '{"app":"outro","versao":1,"chaves":{}}',
      JSON.stringify({ app: 'samauma', versao: 99, chaves: {} }),
      JSON.stringify({ app: 'samauma', versao: 1, chaves: { 'chave.alheia': '1' } }),
      JSON.stringify({ app: 'samauma', versao: 1, chaves: { 'samauma.next.demandas.v1': 'quebrado{' } }),
      JSON.stringify({ app: 'samauma', versao: 1, chaves: { 'samauma.next.demandas.v1': 5 } })
    ];
    for (const texto of ruins) {
      expect(lerBackup(texto).ok).toBe(false);
      expect(importarBackup(destino, texto).ok).toBe(false);
    }
    expect(JSON.stringify([...destino.m])).toBe(antes);
  });
});
