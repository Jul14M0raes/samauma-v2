/* Gestão da equipe pela própria cooperativa.

   A regra que estes testes protegem é a de não apagar ninguém. Desligar um
   cooperado tem que impedir designação nova e, ao mesmo tempo, preservar tudo
   que a pessoa já fez -- produção do período e trilha das cargas. Um
   desligamento que sumisse com o histórico invalidaria comprovante já emitido,
   que é o oposto do que o sistema existe para fazer. */

import { beforeEach, describe, expect, it } from 'vitest';
import { Cadastro } from '../cadastro';
import { Catalogo, COOPERATIVAS } from '../catalogo';
import { Painel } from '../indicadores';
import { Store } from '../store';

const COOP = COOPERATIVAS[0].id;

describe('admissão de cooperado', () => {
  beforeEach(() => { Store.reiniciar(); Cadastro.limpar(); });

  const novo = (nome = 'Marlene Batista') => Cadastro.criar('catador', {
    nome, cooperativa: COOP, veiculo: 'Triciclo elétrico',
    zona: 'Zona Leste', metaSemanal: '180'
  });

  it('entra na equipe da cooperativa e passa a existir no catálogo', () => {
    const { registro, erros } = novo();
    expect(erros).toEqual({});
    expect(registro).toBeDefined();
    expect(Catalogo.catador(registro!.id)).not.toBeNull();
    expect(Catalogo.equipe(COOP).some(c => c.id === registro!.id)).toBe(true);
  });

  it('nasce ativo e já pode receber demanda', () => {
    const { registro } = novo();
    expect(Catalogo.equipeAtiva(COOP).some(c => c.id === registro!.id)).toBe(true);
  });

  /* RN-029: o cooperado trabalha sob a Cooperativa e não tem acesso próprio. */
  it('não recebe código de acesso próprio', () => {
    const { registro } = novo();
    expect((registro as { codigo?: string }).codigo).toBeUndefined();
  });

  it('recusa nome repetido, que tornaria a designação ambígua', () => {
    novo('Maria Nova');
    const { registro, erros } = novo('Maria Nova');
    expect(registro).toBeUndefined();
    expect(erros.nome).toMatch(/já existe/i);
  });

  it('exige veículo, zona e meta antes de admitir', () => {
    const { erros } = Cadastro.criar('catador', { nome: 'Sem Dados', cooperativa: COOP });
    expect(erros.veiculo).toBeDefined();
    expect(erros.zona).toBeDefined();
    expect(erros.metaSemanal).toBeDefined();
  });
});

describe('desligamento de cooperado', () => {
  beforeEach(() => { Store.reiniciar(); Cadastro.limpar(); });

  const alguem = () => Catalogo.equipe(COOP)[0];

  it('sai da lista de designação, mas continua na equipe', () => {
    const c = alguem();
    expect(Cadastro.desligarCooperado(c.id, 'Mudou de cidade', 'CATANORTE')).toBe(true);
    expect(Catalogo.equipeAtiva(COOP).some(x => x.id === c.id)).toBe(false);
    /* Continua na equipe: é assim que o histórico dele segue visível. */
    expect(Catalogo.equipe(COOP).some(x => x.id === c.id)).toBe(true);
  });

  it('guarda quando, por que e quem desligou', () => {
    const c = alguem();
    Cadastro.desligarCooperado(c.id, 'Mudou de cidade', 'CATANORTE');
    const d = Catalogo.catador(c.id)!.desligamento!;
    expect(d.motivo).toBe('Mudou de cidade');
    expect(d.por).toBe('CATANORTE');
    expect(Date.parse(d.quando)).toBeGreaterThan(0);
  });

  it('não apaga a produção já comprovada', () => {
    const c = alguem();
    const antes = Painel.cooperativa(COOP)!.equipe.find(m => m.id === c.id)!.massa;
    expect(antes).toBeGreaterThan(0);
    Cadastro.desligarCooperado(c.id, 'Saiu', 'CATANORTE');
    const depois = Painel.cooperativa(COOP)!.equipe.find(m => m.id === c.id)!.massa;
    expect(depois).toBe(antes);
  });

  it('as cargas que já fez continuam ligadas a ele na trilha', () => {
    const c = alguem();
    const cargas = Store.doCatador(c.id).length;
    expect(cargas).toBeGreaterThan(0);
    Cadastro.desligarCooperado(c.id, 'Saiu', 'CATANORTE');
    expect(Store.doCatador(c.id).length).toBe(cargas);
  });

  it('não desliga duas vezes', () => {
    const c = alguem();
    expect(Cadastro.desligarCooperado(c.id, 'Saiu', 'CATANORTE')).toBe(true);
    expect(Cadastro.desligarCooperado(c.id, 'De novo', 'CATANORTE')).toBe(false);
  });

  it('religar devolve à lista de designação', () => {
    const c = alguem();
    Cadastro.desligarCooperado(c.id, 'Saiu', 'CATANORTE');
    expect(Cadastro.religarCooperado(c.id)).toBe(true);
    expect(Catalogo.equipeAtiva(COOP).some(x => x.id === c.id)).toBe(true);
    expect(Cadastro.ativo(Catalogo.catador(c.id)!)).toBe(true);
  });

  it('religar quem está ativo não faz nada', () => {
    expect(Cadastro.religarCooperado(alguem().id)).toBe(false);
  });

  it('id inexistente não quebra nem inventa registro', () => {
    expect(Cadastro.desligarCooperado('cat-inexistente', 'x', 'y')).toBe(false);
    expect(Cadastro.religarCooperado('cat-inexistente')).toBe(false);
  });

  it('reiniciar a demonstração devolve todo mundo ao ativo', () => {
    const c = alguem();
    Cadastro.desligarCooperado(c.id, 'Saiu', 'CATANORTE');
    Cadastro.limpar();
    expect(Cadastro.ativo(Catalogo.catador(c.id)!)).toBe(true);
  });
});
