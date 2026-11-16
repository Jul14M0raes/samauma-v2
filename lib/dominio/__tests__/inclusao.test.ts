/* Inclusão produtiva: quanto da massa passa por cooperativa de catadores.

   É o indicador que a Lei nº 12.305/2010 pede sem nomear — o art. 7º põe a
   inclusão de catadores entre os objetivos, e o art. 36 manda priorizar
   organizações de catadores. No piloto toda coleta é feita por cooperativa
   (RN-035); o que sobra é gerador ainda sem contrato vigente.

   O risco aqui é aritmético e silencioso: se a soma das fatias não fechar com o
   total, a Secretaria reporta um número errado a partir do sistema. Por isso o
   teste central é de fechamento, e não de valor esperado. */

import { beforeEach, describe, expect, it } from 'vitest';
import { Painel } from '../indicadores';
import { Store } from '../store';

describe('a divisão fecha', () => {
  beforeEach(() => { Store.reiniciar(); });

  it('a soma das fatias é a massa total', () => {
    const i = Painel.inclusaoProdutiva();
    expect(i.cooperativa.massa + i.semOperador.massa).toBeCloseTo(i.total, 5);
  });

  it('a soma dos percentuais é cem, quando há massa', () => {
    const i = Painel.inclusaoProdutiva();
    if (!i.total) return;
    expect(i.cooperativa.parte + i.semOperador.parte).toBeCloseTo(100, 4);
  });

  /* O total daqui tem de ser o mesmo total do painel do município: dois números
     diferentes para a mesma massa destruiriam a confiança em ambos. */
  it('o total bate com a massa comprovada do município', () => {
    expect(Painel.inclusaoProdutiva().total).toBeCloseTo(Painel.municipio().ambiental.massa, 5);
  });

  it('a taxa de inclusão é a massa da cooperativa sobre o total', () => {
    const i = Painel.inclusaoProdutiva();
    if (!i.total) return;
    expect(i.massaIncluida).toBeCloseTo(i.cooperativa.massa, 5);
    expect(i.taxaInclusao!).toBeCloseTo((i.massaIncluida / i.total) * 100, 5);
  });
});
