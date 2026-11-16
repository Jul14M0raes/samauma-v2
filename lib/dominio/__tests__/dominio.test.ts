/* SAMAÚMA — cenários centrais do domínio: semente íntegra, situação
   regulatória, o ciclo completo de uma demanda e o ramo da pendência. */

import { beforeEach, describe, expect, it } from 'vitest';
import { Catalogo, COOPERATIVAS, GERADORES, PONTOS, SITUACOES, STATUS } from '../catalogo';
import type { SituacaoId } from '../tipos';
import { DemandaRegras as Demanda } from '../demanda';
import { Fmt } from '../formato';
import { Painel } from '../indicadores';
import { Regulatorio } from '../regulatorio';
import { Store } from '../store';
import { ciclo, coletar } from './apoio';

beforeEach(() => {
  Store.reiniciar();
});

const nova = (residuo: string, declaradoL = 800) => {
  const d = Store.criar({ geradorId: 'ger-01', residuo, declaradoL, prazo: new Date(Date.now() + 172800000).toISOString() });
  return Store.publicar(d.id);
};

describe('semente', () => {
  it('gera demandas', () => {
    expect(Store.demandas.length).toBeGreaterThan(0);
  });

  it('cooperativa principal é a CATANORTE', () => {
    expect(COOPERATIVAS[0].nome).toBe('CATANORTE');
    expect(Catalogo.equipe('coop-01').length).toBeGreaterThan(0);
  });

  /* RN-029: não há catador autônomo; todo cooperado trabalha sob uma cooperativa. */
  it('todo cooperado pertence a uma cooperativa', () => {
    for (const c of COOPERATIVAS) expect(Catalogo.equipe(c.id).every(x => x.cooperativa === c.id)).toBe(true);
  });

  /* RN-035: a unidade receptora é o galpão da própria cooperativa. */
  it('toda cooperativa tem o seu galpão', () => {
    for (const c of COOPERATIVAS) expect(Catalogo.destino(c.galpao)!.cooperativa).toBe(c.id);
  });

  it('todo ponto de coleta tem coordenada', () => {
    expect(PONTOS.every(p => p.lat != null && p.lng != null)).toBe(true);
  });
});

describe('integridade da semente', () => {
  it('toda demanda tem situação válida', () => {
    expect(Store.todas().every(d => !!STATUS[d.status])).toBe(true);
  });

  it('toda demanda referencia gerador, ponto e destino do catálogo', () => {
    expect(Store.todas().every(d => Catalogo.gerador(d.gerador.id) && Catalogo.ponto(d.ponto) && Catalogo.destino(d.destino.id))).toBe(true);
  });

  it('toda demanda declara quantidade em litros', () => {
    expect(Store.todas().every(d => d.declaradoL > 0)).toBe(true);
  });

  it('rejeito nunca é maior que a massa recebida', () => {
    expect(Store.todas().every(d => d.verificadoKg == null || (d.rejeitoKg || 0) <= d.verificadoKg)).toBe(true);
  });

  it('carga de rejeito é integralmente rejeito', () => {
    const rejeito = Store.todas().filter(d => d.verificadoKg != null && d.residuo === 'rejeito');
    expect(rejeito.every(d => d.rejeitoKg === d.verificadoKg)).toBe(true);
  });

  it('nenhuma comprovada sem recebimento confirmado', () => {
    expect(Store.todas().filter(d => d.status === 'COMPROVADA')
      .every(d => d.eventos.some(e => e.titulo === 'Recebimento confirmado'))).toBe(true);
  });

  it('pendências abertas estão acima da tolerância', () => {
    expect(Store.pendentes().every(d => !Demanda.dentroDaTolerancia(d))).toBe(true);
  });
});

describe('situação regulatória', () => {
  it('as quatro situações aparecem na base', () => {
    const encontradas = new Set(Painel.geradores().map(g => g.situacao.id));
    Object.keys(SITUACOES).forEach(s => expect(encontradas.has(s as SituacaoId), s).toBe(true));
  });

  it('PGRS vencido derruba para irregular', () => {
    const vencido = GERADORES.find(g => Regulatorio.pgrs(g)?.vencido)!;
    expect(Regulatorio.situacao(vencido, Store.doGerador(vencido.id)).id).toBe('IRREGULAR');
  });

  it('toda situação vem com motivo em texto', () => {
    expect(Painel.geradores().every(g => g.situacao.motivos.length > 0)).toBe(true);
  });
});

describe('ciclo completo, do gerador ao recebimento', () => {
  it('percorre declaração, avaliação, coleta e recebimento dentro da tolerância', () => {
    const d = nova('papelao');
    expect(d.status).toBe('DISPONIVEL');
    expect(coletar(d, 785).status).toBe('EM_TRANSPORTE');
    expect(Store.obter(d.id)!.comprovante).toBeNull();

    const recebida = Store.receber(d.id, { kg: 782, rejeitoKg: 60, nota: 'Carga íntegra.' });
    expect(Demanda.reciclado(recebida)).toBe(722);
    expect(recebida.status).toBe('COMPROVADA');
  });

  it('recusa rejeito maior que a massa recebida', () => {
    const d = nova('vidro', 300);
    coletar(d, 100);
    expect(() => Store.receber(d.id, { kg: 100, rejeitoKg: 500 })).toThrow();
    expect(() => Store.receber(d.id, { kg: 100, rejeitoKg: 5 })).not.toThrow();
  });
});

describe('ramo da pendência', () => {
  it('divergência acima da tolerância abre pendência; liberar emite comprovante', () => {
    const d = ciclo(nova('plastico'), 400, 300);
    expect(d.status).toBe('PENDENCIA_DIVERGENCIA');
    const liberada = Store.decidirPendencia(d.id, { resultado: 'LIBERADA', justificativa: 'Tíquete conferido.', por: 'Técnico' });
    expect(liberada.status).toBe('COMPROVADA');
    expect(liberada.comprovante).not.toBeNull();
    expect(Demanda.conciliada(liberada)).toBe(true);
  });
});

describe('rejeito', () => {
  it('não gera recuperação nem renda', () => {
    const d = ciclo(nova('rejeito', 3000), 1500, 1480);
    expect(Demanda.reciclado(d)).toBe(0);
    expect(Demanda.valor(d)).toBe(0);
  });
});

describe('formatação', () => {
  it('kg, litros e percentual formatam em pt-BR', () => {
    expect(Fmt.kg(1234)).toContain('kg');
    expect(Fmt.litros(800)).toMatch(/L/);
    expect(Fmt.percentual(5.5, 1)).toContain('%');
  });
});
