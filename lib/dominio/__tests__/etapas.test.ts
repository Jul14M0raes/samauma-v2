/* A trilha reorganizada por etapa.

   O risco desta funcionalidade é silencioso: um evento que não case com nenhuma
   etapa some da tela sem ninguém notar, e uma trilha com buraco é pior que
   trilha nenhuma — dá a impressão de completude que não existe.

   Por isso o teste central não é "classifica certo", é "não perde nada". */

import { beforeEach, describe, expect, it } from 'vitest';
import { Carteiras } from '../carteira';
import { DemandaRegras as Demanda } from '../demanda';
import { Store } from '../store';
import { ciclo, cooperativaDe, designar } from './apoio';

describe('nenhum evento se perde na classificação', () => {
  beforeEach(() => { Store.reiniciar(); Carteiras.reiniciar(); });

  it('a soma dos grupos é igual ao total de eventos, em toda a semente', () => {
    for (const d of Store.todas()) {
      const grupos = Demanda.trilhaPorEtapa(d);
      const somados = Object.values(grupos).reduce((s, g) => s + g.length, 0);
      expect(somados).toBe(d.eventos.length);
    }
  });

  it('nenhum evento da semente cai no grupo dos não classificados', () => {
    const orfaos: string[] = [];
    for (const d of Store.todas()) {
      for (const e of Demanda.trilhaPorEtapa(d)[0]) orfaos.push(e.titulo);
    }
    expect([...new Set(orfaos)]).toEqual([]);
  });

  /* Percorre o ciclo inteiro com as saídas previstas (não aceite, pendência de
     execução, divergência), para que os títulos criados depois da semente
     também passem pelo classificador. */
  it('classifica também os eventos das saídas de erro', () => {
    const d = Store.disponiveis().find(x => x.residuo !== 'rejeito')!;
    Store.naoAceitar(d.id, { cooperativaId: cooperativaDe(d), motivo: 'sem caminhão' });
    Store.reavaliar(d.id, { cooperativaId: cooperativaDe(d) });
    designar(d);
    Store.registrarOcorrencia(d.id, { tipo: 'ACESSO', nota: 'rua interditada', por: 'Equipe' });
    Store.verificarPrazos(new Date(Date.now() + 400 * 24 * 3600000));
    const pendente = Store.obter(d.id)!;
    Store.remarcar(d.id, {
      justificativa: 'chuva', novoPrazo: new Date(new Date(pendente.prazo).getTime() + 48 * 3600000).toISOString(),
      por: 'Equipe', agora: new Date(new Date(pendente.prazo).getTime() + 3600000)
    });
    ciclo(d, 300, 400);
    Store.decidirPendencia(d.id, { resultado: 'LIBERADA', justificativa: 'balança conferida', por: 'Técnico' });
    Store.registrarMtr(d.id, { numero: 'MTR-123456' });

    const atual = Store.obter(d.id)!;
    const grupos = Demanda.trilhaPorEtapa(atual);
    expect(grupos[0]).toEqual([]);
    expect(Object.values(grupos).reduce((s, g) => s + g.length, 0)).toBe(atual.eventos.length);
  });
});

describe('cada evento cai na etapa certa', () => {
  beforeEach(() => { Store.reiniciar(); Carteiras.reiniciar(); });

  it('põe o que é da demanda na etapa 1', () => {
    expect(Demanda.etapaDoEvento('Demanda criada')).toBe(1);
    expect(Demanda.etapaDoEvento('Demanda disponível')).toBe(1);
  });

  it('põe a avaliação da cooperativa na etapa 2', () => {
    expect(Demanda.etapaDoEvento('Demanda aceita')).toBe(2);
    expect(Demanda.etapaDoEvento('Demanda não aceita')).toBe(2);
    expect(Demanda.etapaDoEvento('Nova avaliação')).toBe(2);
  });

  it('põe a execução da coleta na etapa 3', () => {
    expect(Demanda.etapaDoEvento('Cooperado designado')).toBe(3);
    expect(Demanda.etapaDoEvento('Peso registrado')).toBe(3);
    expect(Demanda.etapaDoEvento('Pendência de execução')).toBe(3);
    expect(Demanda.etapaDoEvento('Coleta remarcada')).toBe(3);
    expect(Demanda.etapaDoEvento('Ocorrência: estabelecimento fechado')).toBe(3);
  });

  it('põe transporte e manifesto na etapa 4', () => {
    expect(Demanda.etapaDoEvento('Carga em transporte')).toBe(4);
    expect(Demanda.etapaDoEvento('MTR registrado')).toBe(4);
  });

  it('põe recebimento, conciliação e pendência na etapa 5', () => {
    expect(Demanda.etapaDoEvento('Recebimento confirmado')).toBe(5);
    expect(Demanda.etapaDoEvento('Conciliação')).toBe(5);
    expect(Demanda.etapaDoEvento('Pendência de divergência aberta')).toBe(5);
  });

  it('põe comprovante e decisão da pendência na etapa 6', () => {
    expect(Demanda.etapaDoEvento('Comprovante emitido')).toBe(6);
    expect(Demanda.etapaDoEvento('Divergência liberada')).toBe(6);
    expect(Demanda.etapaDoEvento('Divergência mantida')).toBe(6);
  });

  it('devolve nulo para título desconhecido, em vez de chutar uma etapa', () => {
    expect(Demanda.etapaDoEvento('Algo que ainda não existe')).toBeNull();
  });
});

describe('a trilha por etapa preserva a ordem e a autoria', () => {
  beforeEach(() => { Store.reiniciar(); Carteiras.reiniciar(); });

  it('mantém os eventos de cada etapa em ordem cronológica', () => {
    const comprovada = Store.comprovantes(Store.todas())[0];
    for (const grupo of Object.values(Demanda.trilhaPorEtapa(comprovada))) {
      const tempos = grupo.map(e => new Date(e.quando).getTime());
      expect(tempos).toEqual([...tempos].sort((a, b) => a - b));
    }
  });

  it('todo evento agrupado continua com autor e horário', () => {
    const comprovada = Store.comprovantes(Store.todas())[0];
    for (const grupo of Object.values(Demanda.trilhaPorEtapa(comprovada))) {
      for (const e of grupo) {
        expect(e.autor).toBeTruthy();
        expect(Number.isNaN(new Date(e.quando).getTime())).toBe(false);
      }
    }
  });
});
