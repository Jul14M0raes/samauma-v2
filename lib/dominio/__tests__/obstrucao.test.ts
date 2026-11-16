/* Ocorrência de coleta impedida chegando à fiscalização.

   O sistema pedia ao catador que registrasse a viagem perdida e nunca lia o
   registro. Isto conserta o descarte — mas a correção tem um limite que os
   testes aqui protegem: relato de uma parte não pode virar acusação.

   O catador declarou portão fechado; o sistema não sabe se o portão estava
   fechado. Por isso a obstrução entra como pedido de informação, nunca como
   achado de infração — a mesma disciplina que já vale para o MTR. */

import { beforeEach, describe, expect, it } from 'vitest';
import { GERADORES } from '../catalogo';
import {
  achadosDoGerador, filaDeFiscalizacao, obstrucoesDoGerador, solicitacoesDoGerador
} from '../notificacao';
import { Store } from '../store';
import { aceitar } from './apoio';

const CATADOR = { nome: 'João Silva' };

/* Registra `quantas` obstruções em demandas de um mesmo estabelecimento
   regular, e devolve o gerador atingido. */
function comObstrucoes(quantas: number) {
  const regular = GERADORES.find(g => achadosDoGerador(g, Store.doGerador(g.id)).length === 0)!;
  const minhas = Store.doGerador(regular.id).filter(d => ['DISPONIVEL', 'ACEITA', 'EM_COLETA'].includes(d.status));

  let feitas = 0;
  for (const d of minhas) {
    if (feitas >= quantas) break;
    if (d.status === 'DISPONIVEL') aceitar(d);
    Store.registrarOcorrencia(d.id, { tipo: 'ACESSO', nota: 'Portão trancado, sem responsável', por: CATADOR.nome });
    feitas += 1;
  }
  return { gerador: regular, registradas: feitas };
}

describe('a ocorrência deixa de ser jogada fora', () => {
  beforeEach(() => { Store.reiniciar(); });

  it('conta as ocorrências que impediram a coleta', () => {
    const { gerador, registradas } = comObstrucoes(2);
    if (registradas < 2) return;
    const obstrucao = obstrucoesDoGerador(Store.doGerador(gerador.id));
    expect(obstrucao.total).toBe(registradas);
    expect(obstrucao.demandas.length).toBe(registradas);
  });

  /* Ocorrência isolada é imprevisto: não pauta visita nem gera pergunta. */
  it('uma ocorrência sozinha não vira solicitação', () => {
    const { gerador, registradas } = comObstrucoes(1);
    if (registradas < 1) return;
    const pedidos = solicitacoesDoGerador(gerador, Store.doGerador(gerador.id));
    expect(pedidos.some(p => /impedidas/i.test(p.titulo))).toBe(false);
  });

  it('a repetição vira pedido de informação', () => {
    const { gerador, registradas } = comObstrucoes(2);
    if (registradas < 2) return;
    const pedidos = solicitacoesDoGerador(gerador, Store.doGerador(gerador.id));
    const pedido = pedidos.find(p => /impedidas/i.test(p.titulo));
    expect(pedido).toBeTruthy();
    expect(pedido!.detalhe).toMatch(/não constitui apuração/i);
  });

  it('conta apenas o que impediu a coleta, e não toda ocorrência', () => {
    const d = Store.disponiveis()[0];
    aceitar(d);
    /* Material divergente não impede a retirada: a carga pode ser levada
       assim mesmo, com a divergência anotada. */
    Store.registrarOcorrencia(d.id, { tipo: 'MATERIAL_DIVERGENTE', nota: 'veio vidro junto', por: CATADOR.nome });
    Store.registrarOcorrencia(d.id, { tipo: 'VOLUME', nota: 'menos que o combinado', por: CATADOR.nome });
    expect(obstrucoesDoGerador([Store.obter(d.id)!]).total).toBe(0);
  });
});

describe('relato de uma parte nunca vira acusação', () => {
  beforeEach(() => { Store.reiniciar(); });

  /* A trava central deste desenho. Se a obstrução virasse achado, o sistema
     estaria autuando com base no que uma parte disse da outra. */
  it('obstrução repetida não cria achado de infração', () => {
    const { gerador, registradas } = comObstrucoes(3);
    if (registradas < 2) return;
    const achados = achadosDoGerador(gerador, Store.doGerador(gerador.id));
    expect(achados.some(a => /impedid/i.test(a.titulo))).toBe(false);
    expect(achados.length).toBe(0);
  });

  it('a situação regulatória do estabelecimento não piora por obstrução', () => {
    const { gerador } = comObstrucoes(3);
    const antes = Store.doGerador(gerador.id);
    expect(achadosDoGerador(gerador, antes).length).toBe(0);
  });
});

describe('a fila de fiscalização passa a enxergar o padrão', () => {
  beforeEach(() => { Store.reiniciar(); });

  const montarFila = () =>
    filaDeFiscalizacao(GERADORES.map(g => ({ gerador: g, demandas: Store.doGerador(g.id) })));

  it('estabelecimento regular com obstrução repetida entra na fila', () => {
    const { gerador, registradas } = comObstrucoes(2);
    if (registradas < 2) return;
    const linha = montarFila().find(l => l.gerador.id === gerador.id);
    expect(linha).toBeTruthy();
    expect(linha!.achados.length).toBe(0);
    expect(linha!.obstrucao.total).toBeGreaterThanOrEqual(2);
  });

  it('estabelecimento regular sem obstrução continua fora da fila', () => {
    const regular = GERADORES.find(g => achadosDoGerador(g, Store.doGerador(g.id)).length === 0)!;
    expect(montarFila().some(l => l.gerador.id === regular.id)).toBe(false);
  });

  it('quem tem achado apurado continua na frente de quem só tem obstrução', () => {
    comObstrucoes(3);
    const fila = montarFila();
    const primeiroSemAchado = fila.findIndex(l => l.achados.length === 0);
    const ultimoComAchado = fila.map(l => l.achados.length > 0).lastIndexOf(true);
    if (primeiroSemAchado >= 0 && ultimoComAchado >= 0) {
      expect(primeiroSemAchado).toBeGreaterThan(ultimoComAchado);
    }
  });
});
