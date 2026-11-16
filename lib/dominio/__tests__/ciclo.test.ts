/* O ciclo da demanda pela doc funcional (EST-001, EST-002, EST-004).

   Cada bloco trava uma regra que o código antigo não tinha ou fazia de outro
   jeito: a cooperativa avalia e executa, a massa observada não muda depois de
   gravada, prazo vencido vira pendência de execução com janela de 96 h, e a
   divergência só sai de pendência por decisão justificada do Técnico. */

import { beforeEach, describe, expect, it } from 'vitest';
import { Cadastro } from '../cadastro';
import { Catalogo, COOPERATIVAS, GERADORES, JANELA_EXECUCAO_HORAS } from '../catalogo';
import { Parametros } from '../parametros';
import { Regulatorio } from '../regulatorio';
import { Store } from '../store';
import { aceitar, ciclo, coletar, cooperativaDe, designar } from './apoio';

const HORA = 3600000;
const disponivel = () => Store.disponiveis().find(d => d.residuo !== 'rejeito')!;
const outraCooperativa = (coopId: string) => COOPERATIVAS.find(c => c.id !== coopId)!.id;

beforeEach(() => { Store.reiniciar(); Parametros.restaurar(); Cadastro.limpar(); });

describe('declaração do gerador (RF-006, RN-006)', () => {
  it('declara em litros, avulsa por padrão, endereçada à cooperativa do contrato', () => {
    const g = GERADORES.find(x => x.operador && !x.baixa)!;
    const d = Store.criar({ geradorId: g.id, residuo: 'papelao', declaradoL: 800, prazo: new Date(Date.now() + 48 * HORA).toISOString() });
    expect(d.status).toBe('CRIADA');
    expect(d.declaradoL).toBe(800);
    expect(d.origem).toBe('AVULSA');
    expect(Catalogo.destino(d.destino.id)!.cooperativa).toBe(g.operador);
  });

  it('recusa quantidade zerada', () => {
    const g = GERADORES.find(x => x.operador)!;
    expect(() => Store.criar({ geradorId: g.id, residuo: 'papelao', declaradoL: 0, prazo: new Date().toISOString() }))
      .toThrow(/litros/i);
  });
});

describe('avaliação da cooperativa (RF-008, RN-008)', () => {
  it('aceita só o que foi endereçado a ela', () => {
    const d = disponivel();
    expect(() => Store.aceitar(d.id, { cooperativaId: outraCooperativa(cooperativaDe(d)) })).toThrow(/endereçada/i);
    expect(aceitar(d).status).toBe('ACEITA');
  });

  it('não aceitar exige motivo, guarda o registro e permite reavaliar', () => {
    const d = disponivel();
    const coop = cooperativaDe(d);
    expect(() => Store.naoAceitar(d.id, { cooperativaId: coop, motivo: ' ' })).toThrow(/por que/i);
    Store.naoAceitar(d.id, { cooperativaId: coop, motivo: 'caminhão na oficina' });
    const recusada = Store.obter(d.id)!;
    expect(recusada.status).toBe('NAO_ACEITA');
    expect(recusada.naoAceites).toHaveLength(1);
    expect(Store.reavaliar(d.id, { cooperativaId: coop }).status).toBe('DISPONIVEL');
    expect(Store.obter(d.id)!.naoAceites).toHaveLength(1);
  });
});

describe('designação e coleta (RF-009, RF-011, RF-012)', () => {
  it('designa cooperado da própria equipe e passa a Em coleta', () => {
    const d = disponivel();
    aceitar(d);
    const coop = cooperativaDe(d);
    const deFora = Catalogo.equipeAtiva(outraCooperativa(coop))[0];
    expect(() => Store.designar(d.id, { cooperativaId: coop, catadorId: deFora.id })).toThrow(/não é cooperado/i);
    const salva = designar(d);
    expect(salva.status).toBe('EM_COLETA');
    expect(salva.catador!.cooperativa).toBe(coop);
  });

  it('não designa demanda que ainda não foi aceita', () => {
    const d = disponivel();
    const coop = cooperativaDe(d);
    expect(() => Store.designar(d.id, { cooperativaId: coop, catadorId: Catalogo.equipeAtiva(coop)[0].id }))
      .toThrow(/indisponível/i);
  });

  it('a massa observada é gravada uma vez e não muda (RN-023)', () => {
    const d = disponivel();
    designar(d);
    Store.registrarPeso(d.id, 300);
    expect(() => Store.registrarPeso(d.id, 330)).toThrow(/não pode ser alterada/i);
    expect(Store.obter(d.id)!.coletadoKg).toBe(300);
  });

  it('não fecha a carga sem a massa observada', () => {
    const d = disponivel();
    designar(d);
    expect(() => Store.finalizarColeta(d.id)).toThrow(/massa observada/i);
  });

  it('ocorrência fica na trilha sem mudar o estado e exige descrição', () => {
    const d = disponivel();
    designar(d);
    expect(() => Store.registrarOcorrencia(d.id, { tipo: 'ACESSO', nota: '', por: 'Equipe' })).toThrow(/Descreva/);
    Store.registrarOcorrencia(d.id, { tipo: 'ACESSO', nota: 'portão trancado', por: 'Equipe' });
    const salva = Store.obter(d.id)!;
    expect(salva.status).toBe('EM_COLETA');
    expect(salva.ocorrencias).toHaveLength(1);
  });
});

describe('pendência de execução (RF-031, RN-041)', () => {
  /* Aceita, com o prazo já vencido, constatada pelo sistema. */
  const vencida = () => {
    const d = disponivel();
    aceitar(d);
    Store.verificarPrazos(new Date(new Date(d.prazo).getTime() + HORA));
    return Store.obter(d.id)!;
  };

  it('prazo vencido em Aceita vira pendência de execução com janela de 96 h', () => {
    const d = vencida();
    expect(d.status).toBe('PENDENCIA_EXECUCAO');
    const janela = new Date(d.execucao!.prazoJustificativa).getTime() - new Date(d.execucao!.constatadaEm).getTime();
    expect(janela).toBe(JANELA_EXECUCAO_HORAS * HORA);
  });

  it('dentro da janela, justifica e remarca: volta a Aceita sem cooperado', () => {
    const d = vencida();
    const agora = new Date(new Date(d.execucao!.constatadaEm).getTime() + 2 * HORA);
    expect(() => Store.remarcar(d.id, { justificativa: '', novoPrazo: new Date(agora.getTime() + 24 * HORA).toISOString(), por: 'Coop', agora }))
      .toThrow(/justificativa/i);
    expect(() => Store.remarcar(d.id, { justificativa: 'chuva', novoPrazo: new Date(agora.getTime() - HORA).toISOString(), por: 'Coop', agora }))
      .toThrow(/futura/i);
    const salva = Store.remarcar(d.id, { justificativa: 'chuva', novoPrazo: new Date(agora.getTime() + 24 * HORA).toISOString(), por: 'Coop', agora });
    expect(salva.status).toBe('ACEITA');
    expect(salva.catador).toBeNull();
    expect(salva.execucao!.justificativa).toBe('chuva');
  });

  it('depois das 96 h, remarcar fica bloqueado', () => {
    const d = vencida();
    const agora = new Date(new Date(d.execucao!.prazoJustificativa).getTime() + HORA);
    expect(() => Store.remarcar(d.id, { justificativa: 'chuva', novoPrazo: new Date(agora.getTime() + 24 * HORA).toISOString(), por: 'Coop', agora }))
      .toThrow(/96 horas/);
  });
});

describe('conciliação e pendência de divergência (RF-013, RF-017 a RF-019)', () => {
  it('dentro da tolerância, comprova direto', () => {
    const d = ciclo(disponivel(), 500, 510);
    expect(d.status).toBe('COMPROVADA');
    expect(d.comprovante).toBeTruthy();
  });

  it('fora da tolerância, abre pendência sem tocar nas medições', () => {
    const d = ciclo(disponivel(), 500, 420);
    expect(d.status).toBe('PENDENCIA_DIVERGENCIA');
    expect(d.pendencia!.estado).toBe('ABERTA');
    expect(d.coletadoKg).toBe(500);
    expect(d.verificadoKg).toBe(420);
  });

  it('a tolerância vem do parâmetro, não de 5% fixo', () => {
    Parametros.definir('tolerancia', 20);
    expect(ciclo(disponivel(), 500, 420).status).toBe('COMPROVADA');
  });

  it('liberar exige justificativa e comprova com as três medições intactas', () => {
    const d = ciclo(disponivel(), 500, 420);
    expect(() => Store.decidirPendencia(d.id, { resultado: 'LIBERADA', justificativa: ' ', por: 'Técnico' })).toThrow(/justificativa/i);
    const salva = Store.decidirPendencia(d.id, { resultado: 'LIBERADA', justificativa: 'umidade', por: 'Técnico' });
    expect(salva.status).toBe('COMPROVADA');
    expect(salva.pendencia!.estado).toBe('LIBERADA');
    expect([salva.declaradoL, salva.coletadoKg, salva.verificadoKg]).toEqual([d.declaradoL, 500, 420]);
  });

  it('manter deixa a carga retida e não decide duas vezes', () => {
    const d = ciclo(disponivel(), 500, 420);
    Store.decidirPendencia(d.id, { resultado: 'MANTIDA', justificativa: 'sem explicação', por: 'Técnico' });
    expect(Store.obter(d.id)!.status).toBe('PENDENCIA_DIVERGENCIA');
    expect(() => Store.decidirPendencia(d.id, { resultado: 'LIBERADA', justificativa: 'revisto', por: 'Técnico' }))
      .toThrow(/já foi decidida/i);
  });

  it('carga de rejeito entra inteira como rejeito', () => {
    const rejeito = Store.disponiveis().find(d => d.residuo === 'rejeito');
    if (!rejeito) return;
    coletar(rejeito, 200);
    const d = Store.receber(rejeito.id, { kg: 200, rejeitoKg: 0 });
    expect(d.rejeitoKg).toBe(200);
  });
});

describe('situação regulatória (EST-002, RN-036 a RN-039)', () => {
  const situacao = (id: string) => Regulatorio.situacao(Catalogo.gerador(id), Store.doGerador(id));

  it('a antecedência do alerta do PGRS é parâmetro', () => {
    /* ger-09 tem PGRS vencendo em cerca de 25 dias e nenhuma pendência. */
    const id = 'ger-09';
    expect(situacao(id).id).toBe('A_RENOVAR');
    Parametros.definir('antecedenciaPgrsDias', 10);
    expect(situacao(id).id).toBe('REGULAR');
  });

  it('PGRS vencido leva a Irregular', () => {
    const vencido = GERADORES.find(g => (Regulatorio.pgrs(g)?.dias ?? 0) < 0)!;
    expect(situacao(vencido.id).id).toBe('IRREGULAR');
  });

  it('cadastro sem responsável técnico impede Regular (RN-004)', () => {
    const incompleto = GERADORES.find(g => !g.responsavelTecnico)!;
    expect(situacao(incompleto.id).id).toBe('IRREGULAR');
  });

  it('divergência aguardando decisão deixa o gerador Pendente', () => {
    const d = ciclo(disponivel(), 500, 420);
    const s = situacao(d.gerador.id);
    expect(['PENDENTE', 'IRREGULAR']).toContain(s.id);
    expect(s.motivos.some(m => /aguardando decisão/.test(m))).toBe(true);
  });
});

describe('cadastro e parâmetros (RF-003, RF-004)', () => {
  it('não cadastra o mesmo CNPJ duas vezes (FL-006-E01)', () => {
    const { registro, erros } = Cadastro.criar('gerador', {
      nome: 'Outro Estabelecimento', cnpj: COOPERATIVAS[0].cnpj, razaoSocial: 'Outro Ltda',
      endereco: 'Rua Nova, 100', ramo: 'Comércio', ponto: GERADORES[0].ponto,
      acesso: 'Portão lateral', volumeMes: '1000'
    }, 'Técnico');
    expect(registro).toBeUndefined();
    expect(erros.cnpj).toMatch(/já está cadastrado/i);
  });

  it('toda alteração de parâmetro fica registrada com autor e valores', () => {
    Parametros.definir('tolerancia', 8, 'Técnico A');
    const [ultima] = Parametros.alteracoes();
    expect(ultima).toMatchObject({ novo: 8, por: 'Técnico A' });
  });
});

describe('documentos do gerador (D-06)', () => {
  it('o QR de regularização traz os quatro itens e cabe no código', async () => {
    const { gerarQr } = await import('../../servicos/qr');
    for (const g of GERADORES) {
      const texto = Regulatorio.conteudoQr(g, Regulatorio.situacao(g, Store.doGerador(g.id)));
      expect(texto).toMatch(/Situação:/);
      expect(texto).toMatch(/Resp\. técnico:/);
      expect(texto).toMatch(/Última coleta:/);
      expect(texto).toMatch(/PGRS/);
      expect(() => gerarQr(texto, { nivel: 'M' })).not.toThrow();
    }
  });
});

describe('prestação de contas (RF-025)', () => {
  it('contrato e avulsa somam todas as demandas do gerador, sem sobrar nem repetir', async () => {
    const { Painel } = await import('../indicadores');
    for (const g of GERADORES) {
      const minhas = Store.doGerador(g.id);
      const o = Painel.porOrigem(minhas);
      expect(o.contrato.total + o.avulsa.total).toBe(minhas.length);
      expect(o.contrato.comprovadas + o.avulsa.comprovadas).toBe(Store.comprovantes(minhas).length);
    }
  });
});
