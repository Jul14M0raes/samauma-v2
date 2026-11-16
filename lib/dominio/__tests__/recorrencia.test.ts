/* Coleta recorrente.

   O risco deste recurso é o oposto do que parece. Automatizar demais quebra a
   cadeia: agendamento que publicasse demanda sozinho encheria a fila de coletas
   que talvez não existam — feriado, semana fraca — e a cooperativa faria a viagem
   perdida. O sistema estaria gerando exatamente a ocorrência que existe para
   evitar.

   Por isso o teste central não é "gera automaticamente", é "propõe e espera". */

import { beforeEach, describe, expect, it } from 'vitest';
import { GERADORES } from '../catalogo';
import { Recorrencia } from '../recorrencia';
import { Store } from '../store';

const GER = GERADORES[0].id;

/* Uma segunda-feira qualquer, para o teste não depender do dia em que roda. */
const SEGUNDA = new Date('2026-08-24T09:00:00');
const TERCA = new Date('2026-08-25T09:00:00');

function agendarSegundas() {
  return Recorrencia.criar(GER, { residuo: 'papelao', declaradoL: 300, dias: [1] });
}

describe('o agendamento propõe, não publica', () => {
  beforeEach(() => { Store.reiniciar(); Recorrencia.reiniciar(); });

  /* A trava central: criar agendamento não pode criar demanda. */
  it('criar agendamento não cria demanda nenhuma', () => {
    const antes = Store.todas().length;
    agendarSegundas();
    expect(Store.todas().length).toBe(antes);
  });

  it('no dia certo, aparece proposta pendente de confirmação', () => {
    agendarSegundas();
    const propostas = Recorrencia.propostasDoDia(GER, SEGUNDA);
    expect(propostas).toHaveLength(1);
    expect(propostas[0].jaCriada).toBe(false);
  });

  it('em dia que não é do agendamento, não propõe nada', () => {
    agendarSegundas();
    expect(Recorrencia.propostasDoDia(GER, TERCA)).toHaveLength(0);
  });

  it('só a confirmação cria e publica a demanda', () => {
    const a = agendarSegundas();
    const antes = Store.todas().length;
    const demanda = Recorrencia.confirmar(a.id, SEGUNDA);
    expect(Store.todas().length).toBe(antes + 1);
    expect(Store.obter(demanda.id)!.status).toBe('DISPONIVEL');
  });
});

describe('a confirmação não se repete no mesmo dia', () => {
  beforeEach(() => { Store.reiniciar(); Recorrencia.reiniciar(); });

  it('confirmar duas vezes no mesmo dia é recusado', () => {
    const a = agendarSegundas();
    Recorrencia.confirmar(a.id, SEGUNDA);
    expect(() => Recorrencia.confirmar(a.id, SEGUNDA)).toThrow(/já foi confirmada hoje/i);
  });

  it('depois de confirmada, a proposta do dia aparece marcada', () => {
    const a = agendarSegundas();
    Recorrencia.confirmar(a.id, SEGUNDA);
    expect(Recorrencia.propostasDoDia(GER, SEGUNDA)[0].jaCriada).toBe(true);
  });

  it('na semana seguinte, propõe de novo', () => {
    const a = agendarSegundas();
    Recorrencia.confirmar(a.id, SEGUNDA);
    const proxima = new Date('2026-08-31T09:00:00');
    expect(Recorrencia.propostasDoDia(GER, proxima)[0].jaCriada).toBe(false);
    expect(() => Recorrencia.confirmar(a.id, proxima)).not.toThrow();
  });
});

describe('a demanda gerada é uma demanda comum', () => {
  beforeEach(() => { Store.reiniciar(); Recorrencia.reiniciar(); });

  it('herda resíduo, quantidade e ponto do agendamento', () => {
    const a = Recorrencia.criar(GER, { residuo: 'plastico', declaradoL: 180, dias: [1] });
    const d = Store.obter(Recorrencia.confirmar(a.id, SEGUNDA).id)!;
    expect(d.residuo).toBe('plastico');
    expect(d.declaradoL).toBe(180);
    expect(d.gerador.id).toBe(GER);
    expect(d.origem).toBe('CONTRATO');
  });

  /* Rastreabilidade da origem: quem auditar precisa saber que aquela demanda
     nasceu de um agendamento, e de qual. */
  it('diz na observação de qual agendamento nasceu', () => {
    const a = agendarSegundas();
    const d = Store.obter(Recorrencia.confirmar(a.id, SEGUNDA).id)!;
    expect(d.observacao).toContain(a.id);
  });

  it('o prazo é curto, porque a carga já está no estabelecimento', () => {
    const a = agendarSegundas();
    const d = Store.obter(Recorrencia.confirmar(a.id, SEGUNDA).id)!;
    const horas = (new Date(d.prazo).getTime() - SEGUNDA.getTime()) / 3600000;
    expect(horas).toBeGreaterThan(0);
    expect(horas).toBeLessThanOrEqual(48);
  });

  it('a demanda fica disponível para a cooperativa avaliar', () => {
    const a = agendarSegundas();
    const d = Recorrencia.confirmar(a.id, SEGUNDA);
    expect(Store.disponiveis().some(x => x.id === d.id)).toBe(true);
  });
});

describe('pausar e remover', () => {
  beforeEach(() => { Store.reiniciar(); Recorrencia.reiniciar(); });

  it('agendamento pausado não propõe nem confirma', () => {
    const a = agendarSegundas();
    Recorrencia.alternar(a.id);
    expect(Recorrencia.propostasDoDia(GER, SEGUNDA)).toHaveLength(0);
    expect(() => Recorrencia.confirmar(a.id, SEGUNDA)).toThrow(/pausado/i);
  });

  it('reativar volta a propor', () => {
    const a = agendarSegundas();
    Recorrencia.alternar(a.id);
    Recorrencia.alternar(a.id);
    expect(Recorrencia.propostasDoDia(GER, SEGUNDA)).toHaveLength(1);
  });

  /* Remover o agendamento não pode desfazer coleta que já aconteceu. */
  it('remover o agendamento preserva as demandas que ele gerou', () => {
    const a = agendarSegundas();
    const d = Recorrencia.confirmar(a.id, SEGUNDA);
    Recorrencia.remover(a.id);
    expect(Store.obter(d.id)).toBeTruthy();
    expect(Recorrencia.doGerador(GER)).toHaveLength(0);
  });
});

describe('recusa entrada inválida', () => {
  beforeEach(() => { Store.reiniciar(); Recorrencia.reiniciar(); });

  it('exige contrato vigente com cooperativa (RN-005)', () => {
    const semContrato = GERADORES.find(g => !g.operador);
    if (!semContrato) return;
    expect(() => Recorrencia.criar(semContrato.id, { residuo: 'papelao', declaradoL: 100, dias: [1] }))
      .toThrow(/contrato vigente/i);
  });

  it('exige ao menos um dia', () => {
    expect(() => Recorrencia.criar(GER, { residuo: 'papelao', declaradoL: 100, dias: [] }))
      .toThrow(/ao menos um dia/i);
  });

  it('exige quantidade positiva', () => {
    expect(() => Recorrencia.criar(GER, { residuo: 'papelao', declaradoL: 0, dias: [1] }))
      .toThrow(/maior que zero/i);
  });

  it('recusa resíduo desconhecido', () => {
    expect(() => Recorrencia.criar(GER, { residuo: 'inexistente', declaradoL: 100, dias: [1] }))
      .toThrow(/desconhecido/i);
  });

  it('não duplica dia repetido', () => {
    const a = Recorrencia.criar(GER, { residuo: 'papelao', declaradoL: 100, dias: [1, 1, 3] });
    expect(a.dias).toEqual([1, 3]);
  });
});
