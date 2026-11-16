/* Previsão de chegada na unidade receptora.

   A unidade só enxergava carga já em trânsito, e descobria a demanda no momento
   em que o caminhão encostava — sem condição de dimensionar turno, prensa ou
   espaço de galpão.

   O risco de corrigir isso é somar o que não se soma. Demanda aceita é
   compromisso assumido; demanda disponível ainda aguarda a avaliação da
   cooperativa e pode não ser aceita. Uma unidade que somasse as duas
   dimensionaria equipe para massa que talvez não venha. Os testes travam essa
   separação. */

import { beforeEach, describe, expect, it } from 'vitest';
import { DESTINOS } from '../catalogo';
import { Painel } from '../indicadores';
import { Store } from '../store';
import { aceitar, coletar, cooperativaDe } from './apoio';

const UNIDADE = DESTINOS[0].id;

/** Uma demanda publicada e destinada à unidade em teste. */
function disponivelDaUnidade() {
  return Store.disponiveis().find(d => d.destino.id === UNIDADE);
}

describe('a unidade passa a enxergar o que vem antes de sair', () => {
  beforeEach(() => { Store.reiniciar(); });

  it('conta as cargas destinadas que ainda não saíram', () => {
    const p = Painel.destino(UNIDADE)!;
    const naUnidade = Store.paraDestino(UNIDADE);
    const esperadoCompromissado = naUnidade.filter(d => ['ACEITA', 'EM_COLETA'].includes(d.status)).length;
    const esperadoPossivel = naUnidade.filter(d => d.status === 'DISPONIVEL').length;

    expect(p.previsao.compromissada.cargas).toBe(esperadoCompromissado);
    expect(p.previsao.possivel.cargas).toBe(esperadoPossivel);
  });

  it('não conta carga de outra unidade', () => {
    const p = Painel.destino(UNIDADE)!;
    for (const d of [...p.previsao.compromissada.demandas, ...p.previsao.possivel.demandas]) {
      expect(d.destino.id).toBe(UNIDADE);
    }
  });

  it('não conta o que já está em trânsito, que tem tela própria', () => {
    const p = Painel.destino(UNIDADE)!;
    const emPrevisao = [...p.previsao.compromissada.demandas, ...p.previsao.possivel.demandas];
    for (const d of emPrevisao) expect(d.status).not.toBe('EM_TRANSPORTE');
  });

  it('não conta carga já comprovada nem encerrada', () => {
    const p = Painel.destino(UNIDADE)!;
    const emPrevisao = [...p.previsao.compromissada.demandas, ...p.previsao.possivel.demandas];
    for (const d of emPrevisao) {
      expect(['COMPROVADA', 'NAO_ACEITA', 'PENDENCIA_DIVERGENCIA', 'PENDENCIA_EXECUCAO']).not.toContain(d.status);
    }
  });
});

describe('compromisso e possibilidade não se somam', () => {
  beforeEach(() => { Store.reiniciar(); });

  /* A trava central: o total previsto conta apenas o que foi aceito. Incluir
     a disponível faria a unidade planejar com massa incerta. */
  it('o total previsto é só a massa compromissada', () => {
    const p = Painel.destino(UNIDADE)!;
    expect(p.previsao.totalPrevisto).toBeCloseTo(p.previsao.compromissada.massa, 5);
  });

  it('a massa possível fica fora do total previsto', () => {
    const p = Painel.destino(UNIDADE)!;
    if (!p.previsao.possivel.massa) return;
    expect(p.previsao.totalPrevisto).toBeLessThan(
      p.previsao.compromissada.massa + p.previsao.possivel.massa);
  });

  /* Aceitar uma demanda move massa de "possível" para "compromissada": é o
     momento em que alguém assume, e o número da unidade muda de natureza. */
  it('aceitar a demanda move a massa de possível para compromissada', () => {
    const alvo = disponivelDaUnidade();
    if (!alvo) return;
    const antes = Painel.destino(UNIDADE)!.previsao;

    aceitar(alvo);
    const depois = Painel.destino(UNIDADE)!.previsao;

    expect(depois.possivel.cargas).toBe(antes.possivel.cargas - 1);
    expect(depois.compromissada.cargas).toBe(antes.compromissada.cargas + 1);
    expect(depois.totalPrevisto).toBeGreaterThan(antes.totalPrevisto);
  });
});

describe('a previsão acompanha o que acontece na cadeia', () => {
  beforeEach(() => { Store.reiniciar(); });

  it('não aceitar a demanda tira a carga da previsão', () => {
    const alvo = disponivelDaUnidade();
    if (!alvo) return;
    const antes = Painel.destino(UNIDADE)!.previsao.possivel.cargas;
    Store.naoAceitar(alvo.id, { cooperativaId: cooperativaDe(alvo), motivo: 'sem caminhão' });
    expect(Painel.destino(UNIDADE)!.previsao.possivel.cargas).toBe(antes - 1);
  });

  it('reavaliar volta a carga para possível', () => {
    const alvo = disponivelDaUnidade();
    if (!alvo) return;
    Store.naoAceitar(alvo.id, { cooperativaId: cooperativaDe(alvo), motivo: 'sem caminhão' });
    const antes = Painel.destino(UNIDADE)!.previsao.possivel.cargas;
    Store.reavaliar(alvo.id, { cooperativaId: cooperativaDe(alvo) });
    expect(Painel.destino(UNIDADE)!.previsao.possivel.cargas).toBe(antes + 1);
  });

  /* Quando a carga sai, ela deixa a previsão e entra na fila de trânsito: as
     duas listas nunca mostram a mesma demanda ao mesmo tempo. */
  it('a carga coletada sai da previsão e entra no trânsito', () => {
    const alvo = disponivelDaUnidade();
    if (!alvo) return;
    coletar(alvo, 200);

    const p = Painel.destino(UNIDADE)!;
    const naPrevisao = [...p.previsao.compromissada.demandas, ...p.previsao.possivel.demandas];
    expect(naPrevisao.some(d => d.id === alvo.id)).toBe(false);
    expect(p.aCaminho.some(d => d.id === alvo.id)).toBe(true);
  });
});
