/* Comandos de gestão: corrigir cadastro, dar baixa, classificar inconformidade
   e cadastrar o mercado.

   Duas regras guiam quase todos estes testes:

   1. Nada se apaga. Baixa e suspensão tiram da operação corrente e preservam
      o histórico, porque é o histórico que sustenta comprovante já emitido.

   2. A situação regulatória continua sendo derivada dos dados. A Prefeitura
      só acrescenta a inconformidade grave, com fundamento e autor. */

import { beforeEach, describe, expect, it } from 'vitest';
import { Cadastro } from '../cadastro';
import { Catalogo, GERADORES } from '../catalogo';
import { Regulatorio } from '../regulatorio';
import { Store } from '../store';

const geradorId = () => GERADORES[0].id;

describe('correção de cadastro', () => {
  beforeEach(() => { Store.reiniciar(); Cadastro.limpar(); });

  it('altera nome, ramo, volume e acesso', () => {
    const id = geradorId();
    expect(Cadastro.editarGerador(id, {
      nome: 'Mercado Central Renovado', volumeMes: 9000, km: 4.5
    }, 'Doca dos fundos · 6h às 10h')).toBe(true);
    const g = Catalogo.gerador(id)!;
    expect(g.nome).toBe('Mercado Central Renovado');
    expect(g.volumeMes).toBe(9000);
    expect(Catalogo.ponto(g.ponto)!.acesso).toBe('Doca dos fundos · 6h às 10h');
  });

  it('não deixa o CNPJ ser alterado por esta via', () => {
    const id = geradorId();
    const antes = Catalogo.gerador(id)!.cnpj;
    Cadastro.editarGerador(id, { nome: 'Outro Nome Qualquer' });
    expect(Catalogo.gerador(id)!.cnpj).toBe(antes);
  });

  it('recusa nome que já é de outro estabelecimento', () => {
    expect(Cadastro.editarGerador(geradorId(), { nome: GERADORES[1].nome })).toBe(false);
  });

  it('aceita manter o próprio nome', () => {
    const g = Catalogo.gerador(geradorId())!;
    expect(Cadastro.editarGerador(g.id, { nome: g.nome, km: 7 })).toBe(true);
    expect(Catalogo.gerador(g.id)!.km).toBe(7);
  });

  it('ignora valores inválidos em vez de gravar lixo', () => {
    const id = geradorId();
    const antes = Catalogo.gerador(id)!.volumeMes;
    Cadastro.editarGerador(id, { volumeMes: 0 });
    expect(Catalogo.gerador(id)!.volumeMes).toBe(antes);
  });

  it('edita unidade receptora sem tocar no CNPJ', () => {
    const d = Catalogo.destino('dst-01')!;
    const cnpj = d.cnpj;
    expect(Cadastro.editarDestino(d.id, { licenca: 'LO 2000/2027', capacidadeDiaria: 12000 })).toBe(true);
    expect(Catalogo.destino('dst-01')!.licenca).toBe('LO 2000/2027');
    expect(Catalogo.destino('dst-01')!.cnpj).toBe(cnpj);
  });
});

describe('baixa de cadastro', () => {
  beforeEach(() => { Store.reiniciar(); Cadastro.limpar(); });

  it('registra quando, por que e quem deu baixa', () => {
    const id = geradorId();
    expect(Cadastro.darBaixa('gerador', id, 'Estabelecimento encerrou atividades', 'SEMA')).toBe(true);
    const b = Catalogo.gerador(id)!.baixa!;
    expect(b.motivo).toMatch(/encerrou/);
    expect(b.por).toBe('SEMA');
  });

  it('não apaga o cadastro nem o histórico de cargas', () => {
    const id = geradorId();
    const cargas = Store.doGerador(id).length;
    Cadastro.darBaixa('gerador', id, 'Fechou', 'SEMA');
    expect(Catalogo.gerador(id)).not.toBeNull();
    expect(Store.doGerador(id).length).toBe(cargas);
  });

  it('não dá baixa duas vezes, e reativa depois', () => {
    const id = geradorId();
    Cadastro.darBaixa('gerador', id, 'Fechou', 'SEMA');
    expect(Cadastro.darBaixa('gerador', id, 'De novo', 'SEMA')).toBe(false);
    expect(Cadastro.reativar('gerador', id)).toBe(true);
    expect(Catalogo.gerador(id)!.baixa).toBeNull();
  });

  it('vale também para unidade receptora', () => {
    expect(Cadastro.darBaixa('destino', 'dst-02', 'Licença vencida', 'SEMA')).toBe(true);
    expect(Catalogo.destino('dst-02')!.baixa).toBeTruthy();
  });

  it('id inexistente não quebra', () => {
    expect(Cadastro.darBaixa('gerador', 'ger-nao-existe', 'x', 'y')).toBe(false);
  });
});

/* RN-037, D-05: a Prefeitura só classifica inconformidade grave (leva a
   Irregular); o resto da situação continua derivado dos dados. */
describe('inconformidade grave', () => {
  beforeEach(() => { Store.reiniciar(); Cadastro.limpar(); });

  const situacao = (id: string) => Regulatorio.situacao(Catalogo.gerador(id), Store.doGerador(id));
  const regular = () => GERADORES.find(g => situacao(g.id).id === 'REGULAR')!.id;

  it('classificar leva o gerador a Irregular, com o fundamento nos motivos', () => {
    const id = regular();
    expect(Cadastro.classificarInconformidade(id, 'Descarte irregular no processo 2026/0148', 'SEMA')).toBe(true);
    const s = situacao(id);
    expect(s.id).toBe('IRREGULAR');
    expect(s.inconformidade!.fundamento).toMatch(/Descarte irregular/);
    expect(s.motivos.some(m => /Inconformidade grave/.test(m))).toBe(true);
  });

  it('exige fundamento e não classifica duas vezes', () => {
    const id = regular();
    expect(Cadastro.classificarInconformidade(id, 'ok', 'SEMA')).toBe(false);
    expect(Cadastro.classificarInconformidade(id, 'Fundamento suficiente', 'SEMA')).toBe(true);
    expect(Cadastro.classificarInconformidade(id, 'Outro fundamento', 'SEMA')).toBe(false);
  });

  it('revogar devolve a situação ao que os dados dizem e guarda o histórico', () => {
    const id = regular();
    Cadastro.classificarInconformidade(id, 'Fundamento suficiente', 'SEMA');
    expect(Cadastro.revogarInconformidade(id, 'Defesa acolhida', 'SEMA')).toBe(true);
    expect(situacao(id).id).toBe('REGULAR');
    expect(Cadastro.historicoDeInconformidade(id).map(i => i.acao)).toEqual(['REVOGADA', 'CLASSIFICADA']);
  });

  it('não revoga o que não foi classificado', () => {
    expect(Cadastro.revogarInconformidade(regular(), 'Sem motivo real', 'SEMA')).toBe(false);
  });
});
