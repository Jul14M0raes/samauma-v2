/* Separação na origem: a qualidade com que a carga chega ao galpão, registrada
   no recebimento, sem alterar a massa aferida. */

import { beforeEach, describe, expect, it } from 'vitest';
import { Catalogo, QUALIDADES } from '../catalogo';
import { DemandaRegras as Demanda } from '../demanda';
import { Painel } from '../indicadores';
import { Parametros } from '../parametros';
import { Store } from '../store';
import { coletar } from './apoio';

describe('separação na origem', () => {
  beforeEach(() => { Store.reiniciar(); });

  /* Carga nova a caminho, com observada igual à que a balança vai pesar. */
  const aCaminho = (kg = 500) => coletar(Store.disponiveis().find(d => d.residuo !== 'rejeito')!, kg);

  it('registra a qualidade no recebimento e guarda quem conferiu', () => {
    const d = aCaminho();
    Store.receber(d.id, { kg: 500, qualidade: 'CONTAMINADO', conferente: 'Dona Rosa' });
    const salva = Store.obter(d.id)!;
    expect(salva.qualidade!.id).toBe('CONTAMINADO');
    expect(salva.qualidade!.registradaPor).toBe('Dona Rosa');
    expect(salva.qualidade!.perda).toBe(Catalogo.qualidade('CONTAMINADO')!.perda);
  });

  it('não altera a massa aferida — o que a balança pesou continua valendo', () => {
    const d = aCaminho();
    Store.receber(d.id, { kg: 500, qualidade: 'CONTAMINADO' });
    expect(Store.obter(d.id)!.verificadoKg).toBe(500);
  });

  it('aceita recebimento sem qualidade informada, sem travar a portaria', () => {
    const d = aCaminho();
    Store.receber(d.id, { kg: 500 });
    const salva = Store.obter(d.id)!;
    expect(salva.qualidade).toBeNull();
    expect(Demanda.perdaPorSeparacao(salva)).toBeNull();
  });

  it('cobra do gerador só a perda evitável, não a inerente ao material', () => {
    const d = aCaminho(1000);
    Store.receber(d.id, { kg: 1000, qualidade: 'CONTAMINADO' });
    const salva = Store.obter(d.id)!;
    const perda = Demanda.perdaPorSeparacao(salva)!;
    const custo = Demanda.custoDaSeparacao(salva)!;
    const limpo = Catalogo.qualidade('LIMPO')!.perda;
    expect(perda).toBe(Math.round(1000 * Catalogo.qualidade('CONTAMINADO')!.perda));
    /* O custo desconta a perda que existiria mesmo com a carga limpa. */
    expect(custo).toBeCloseTo((perda - 1000 * limpo) * Parametros.preco(salva.residuo), 5);
    expect(custo).toBeLessThan(perda * Parametros.preco(salva.residuo));
  });

  it('carga limpa não gera custo de separação', () => {
    const d = aCaminho(1000);
    Store.receber(d.id, { kg: 1000, qualidade: 'LIMPO' });
    expect(Demanda.custoDaSeparacao(Store.obter(d.id)!)).toBe(0);
  });

  it('resume o índice de separação por conjunto de demandas', () => {
    const sep = Painel.separacao(Store.todas());
    expect(sep.cargas).toBeGreaterThan(0);
    expect(sep.limpas + sep.misturadas + sep.contaminadas).toBe(sep.cargas);
    expect(sep.indice).toBeGreaterThanOrEqual(0);
    expect(sep.indice).toBeLessThanOrEqual(100);
  });

  it('as três faixas de qualidade têm perdas crescentes e distintas', () => {
    const perdas = QUALIDADES.map(q => q.perda);
    expect(perdas).toEqual([...perdas].sort((a, b) => a - b));
    expect(new Set(perdas).size).toBe(perdas.length);
  });
});
