/* Fluxos de resíduo, conciliação de MTR e leitura instrumentada.

   O piloto opera reciclável, orgânico e rejeito; logística reversa fica fora
   (RN-032). A recuperação é apurada por fluxo, nunca numa média única. */

import { beforeEach, describe, expect, it } from 'vitest';
import { Catalogo, COOPERATIVAS, FLUXOS, RESIDUOS } from '../catalogo';
import { conciliar, conciliarTexto, exemploDeArquivo, lerArquivoMtr } from '../conciliacaoMtr';
import { DemandaRegras as Demanda } from '../demanda';
import { Fluxos } from '../fluxos';
import { CLASSE_RESIDUO } from '../mtr';
import { Store } from '../store';
import { coletar } from './apoio';

describe('fluxos de resíduo', () => {
  beforeEach(() => { Store.reiniciar(); });

  it('todo resíduo do catálogo declara um fluxo conhecido', () => {
    const ids = FLUXOS.map(f => f.id);
    RESIDUOS.forEach(r => {
      expect(ids, `${r.id} sem fluxo válido`).toContain(r.fluxo);
    });
  });

  it('todo fluxo diz quem responde, sob que lei e o que recupera', () => {
    FLUXOS.forEach(f => {
      expect(f.responsavel.length).toBeGreaterThan(10);
      expect(f.baseLegal).toMatch(/Lei|Decreto/);
      expect(f.recuperacao.length).toBeGreaterThan(10);
    });
  });

  it('logística reversa fica fora do piloto (RN-032)', () => {
    expect(FLUXOS.map(f => f.id)).toEqual(['RECICLAVEL', 'ORGANICO', 'REJEITO']);
  });

  it('todo fluxo diz para onde vai a carga', () => {
    FLUXOS.forEach(f => expect(f.destinacao.length).toBeGreaterThan(5));
  });

  it('material desconhecido cai em rejeito, que é a hipótese conservadora', () => {
    const falsa = { ...Store.todas()[0], residuo: 'inexistente' };
    expect(Fluxos.daDemanda(falsa)).toBe('REJEITO');
  });

  it('apura cada fluxo em separado, sem produzir uma média única', () => {
    const linhas = Fluxos.apurar(Store.todas());
    expect(linhas).toHaveLength(FLUXOS.length);
    /* Rejeito nunca tem recuperação: é a definição do art. 3º, XV. */
    const rejeito = linhas.find(l => l.fluxo.id === 'REJEITO')!;
    expect(rejeito.recuperado).toBe(0);
    expect(rejeito.taxa).toBe(0);
  });

  it('classifica todo material novo pela NBR 10004', () => {
    RESIDUOS.forEach(r => {
      expect(CLASSE_RESIDUO[r.id], `${r.id} sem classe`).toBeDefined();
    });
  });

  /* RN-035: a cooperativa acumula a unidade receptora e recebe os três fluxos. */
  it('todo galpão de cooperativa aceita todos os resíduos do catálogo', () => {
    for (const coop of COOPERATIVAS) {
      const galpao = Catalogo.destino(coop.galpao)!;
      RESIDUOS.forEach(r => expect(galpao.aceita).toContain(r.id));
    }
  });
});

describe('conciliação de MTR', () => {
  beforeEach(() => { Store.reiniciar(); });

  it('lê CSV com ponto e vírgula, com cabeçalho', () => {
    const { linhas, invalidas } = lerArquivoMtr(
      'numero;cnpj_gerador;cnpj_destinador;massa_kg;data;cdf\n' +
      'MTR001;12.345.678/0001-95;15.224.777/0001-07;820;2026-08-14;CDF9'
    );
    expect(invalidas).toHaveLength(0);
    expect(linhas).toHaveLength(1);
    expect(linhas[0].numero).toBe('MTR001');
    expect(linhas[0].massaKg).toBe(820);
    expect(linhas[0].cnpjGerador).toBe('12345678000195');
  });

  it('aceita vírgula como separador e massa com decimal brasileiro', () => {
    const { linhas } = lerArquivoMtr('MTR002,11111111000191,22222222000191,"1.250,50",2026-08-01,');
    expect(linhas[0].massaKg).toBeCloseTo(1250.5, 2);
  });

  it('reporta a linha ilegível em vez de recusar o arquivo inteiro', () => {
    const { linhas, invalidas } = lerArquivoMtr(
      'MTR003;11111111000191;22222222000191;500;2026-08-01;\n' +
      'lixo;sem;massa\n' +
      'MTR004;11111111000191;22222222000191;600;2026-08-02;'
    );
    expect(linhas).toHaveLength(2);
    expect(invalidas).toHaveLength(1);
    expect(invalidas[0].linha).toBe(2);
  });

  it('recusa massa não numérica, porque manifesto sem massa não concilia nada', () => {
    const { invalidas } = lerArquivoMtr('MTR005;11111111000191;22222222000191;abc;2026-08-01;');
    expect(invalidas).toHaveLength(1);
    expect(invalidas[0].motivo).toMatch(/massa/i);
  });

  it('casa por CNPJ e massa quando o número ainda não está registrado', () => {
    const r = conciliarTexto(exemploDeArquivo(Store.todas()));
    expect(r.resumo.casadas).toBeGreaterThan(0);
    expect(r.pares.some(p => p.por === 'CNPJ_E_MASSA')).toBe(true);
  });

  it('aponta a divergência de massa que o arquivo de exemplo carrega', () => {
    const r = conciliarTexto(exemploDeArquivo(Store.todas()));
    expect(r.resumo.divergentes).toBeGreaterThan(0);
    const divergente = r.pares.find(p => !p.confere)!;
    expect(divergente.divergenciaPercentual).toBeGreaterThan(5);
  });

  it('separa o manifesto órfão da carga sem manifesto', () => {
    const r = conciliarTexto(exemploDeArquivo(Store.todas()));
    /* O exemplo inclui de propósito um MTR que não corresponde a carga alguma. */
    expect(r.mtrSemCarga.some(m => m.numero === 'MTR999888')).toBe(true);
    /* E sobra carga sem manifesto, porque o exemplo só cobre as oito primeiras. */
    expect(r.cargaSemMtr.length).toBeGreaterThan(0);
  });

  it('nunca usa a mesma carga em dois manifestos', () => {
    const r = conciliarTexto(exemploDeArquivo(Store.todas()));
    const ids = r.pares.map(p => p.demanda.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('só concilia carga que já saiu do gerador', () => {
    const r = conciliar([], Store.todas());
    r.cargaSemMtr.forEach(d => {
      expect(['COLETADA', 'PENDENCIA', 'COMPROVADA']).toContain(d.status);
    });
  });

  it('arquivo vazio não quebra nem inventa par', () => {
    const r = conciliarTexto('');
    expect(r.resumo.lidas).toBe(0);
    expect(r.pares).toHaveLength(0);
  });
});

describe('leitura instrumentada da balança', () => {
  beforeEach(() => { Store.reiniciar(); });

  const aCaminho = () => coletar(Store.disponiveis().find(d => d.residuo !== 'rejeito')!, 500);

  it('marca como leitura do instrumento e vira o degrau mais alto da prova', () => {
    const d = aCaminho();
    Store.receber(d.id, {
      kg: 500, balanca: 'Toledo 2098', afericao: 'INMETRO 2026/114',
      origemPesagem: 'INSTRUMENTO', leitura: 'LT04217'
    });
    const salva = Store.obter(d.id)!;
    expect(salva.pesagem!.origem).toBe('INSTRUMENTO');
    const forca = Demanda.forcaDaProva(salva);
    expect(forca.id).toBe('INSTRUMENTADA');
    expect(forca.motivo).toContain('LT04217');
    expect(forca.motivo).toMatch(/não foi digitado/i);
  });

  it('leitura do instrumento dispensa tíquete para ser a prova mais forte', () => {
    const d = aCaminho();
    Store.receber(d.id, {
      kg: 500, balanca: 'Toledo 2098', afericao: 'INMETRO 2026/114',
      origemPesagem: 'INSTRUMENTO', leitura: 'LT1', tiquete: null
    });
    expect(Demanda.forcaDaProva(Store.obter(d.id)!).id).toBe('INSTRUMENTADA');
  });

  it('sem origem declarada, continua valendo a classificação antiga', () => {
    const d = aCaminho();
    Store.receber(d.id, { kg: 500, balanca: 'Toledo 2098', afericao: 'INMETRO 2026/114', tiquete: 'data:image/png;base64,AA' });
    expect(Demanda.forcaDaProva(Store.obter(d.id)!).id).toBe('MEDIDA');
  });

  it('massa digitada sem instrumento segue valendo como declaração', () => {
    const d = aCaminho();
    Store.receber(d.id, { kg: 500 });
    expect(Demanda.forcaDaProva(Store.obter(d.id)!).id).toBe('DECLARADA');
  });
});
