/* O MTR é a obrigação legal; o comprovante do SAMAÚMA é a necessidade do
   município. Estes testes cobrem a fronteira entre os dois — quando o
   manifesto passa a ser exigível, o que o sistema consegue preencher sozinho,
   e o que ele tem de admitir que não sabe. */

import { beforeEach, describe, expect, it } from 'vitest';
import { Catalogo, COOPERATIVAS, DESTINOS } from '../catalogo';
import {
  CLASSE_RESIDUO, exigeMtr, faltamNoRascunho, PORTAL_MTR,
  rascunhoMtr, situacaoMtr, transportadorDoMtr
} from '../mtr';
import { Store } from '../store';
import { coletar } from './apoio';

describe('manifesto de transporte', () => {
  beforeEach(() => { Store.reiniciar(); });

  const emTransporte = () => Store.todas().find(d => d.status === 'EM_TRANSPORTE') || coletar(Store.disponiveis()[0], 300);
  const comprovada = () => Store.todas().find(d => d.status === 'COMPROVADA')!;
  /* Comprovada sem MTR: a única que aceita o vínculo (RF-020). */
  const semMtr = () => Store.semMtr()[0];

  describe('exigibilidade', () => {
    it('só passa a valer depois do recebimento, sem pendência aberta', () => {
      for (const d of Store.todas()) {
        expect(exigeMtr(d), `${d.id} em ${d.status}`).toBe(d.status === 'COMPROVADA');
      }
    });

    it('carga ainda não comprovada não aceita manifesto', () => {
      const demanda = emTransporte();
      expect(situacaoMtr(demanda).id).toBe('NAO_EXIGIVEL');
      expect(() => Store.registrarMtr(demanda.id, { numero: '2026000123456' }))
        .toThrow(/depois do recebimento/i);
    });
  });

  describe('situação', () => {
    it('percorre pendente, emitido e certificado', () => {
      const demanda = semMtr();
      expect(situacaoMtr(demanda).id).toBe('PENDENTE');
      expect(situacaoMtr(demanda).motivo).toContain(PORTAL_MTR);

      Store.registrarMtr(demanda.id, { numero: '2026000123456' });
      expect(situacaoMtr(Store.obter(demanda.id)!).id).toBe('EMITIDO');

      Store.registrarCdf(demanda.id, { numero: 'CDF-77120' });
      expect(situacaoMtr(Store.obter(demanda.id)!).id).toBe('CERTIFICADO');
    });

    it('sempre devolve motivo escrito', () => {
      for (const d of Store.todas()) {
        expect(situacaoMtr(d).motivo.length).toBeGreaterThan(20);
      }
    });
  });

  describe('registro', () => {
    it('recusa número vazio ou curto demais', () => {
      const demanda = semMtr();
      expect(() => Store.registrarMtr(demanda.id, { numero: '' })).toThrow(/número do MTR/i);
      expect(() => Store.registrarMtr(demanda.id, { numero: '12' })).toThrow(/número do MTR/i);
    });

    it('não registra o mesmo manifesto duas vezes', () => {
      const demanda = semMtr();
      Store.registrarMtr(demanda.id, { numero: '2026000123456' });
      expect(() => Store.registrarMtr(demanda.id, { numero: '2026000999999' })).toThrow(/já tem o MTR/i);
    });

    it('o CDF depende do MTR', () => {
      const demanda = semMtr();
      expect(() => Store.registrarCdf(demanda.id, { numero: 'CDF-1' })).toThrow(/primeiro o número do MTR/i);
    });

    it('deixa os dois registros na trilha', () => {
      const demanda = semMtr();
      const antes = demanda.eventos.length;
      Store.registrarMtr(demanda.id, { numero: '2026000123456' });
      Store.registrarCdf(demanda.id, { numero: 'CDF-77120' });
      const eventos = Store.obter(demanda.id)!.eventos;
      expect(eventos.length).toBe(antes + 2);
      expect(eventos.map(e => e.titulo)).toContain('MTR registrado');
      expect(eventos.map(e => e.titulo)).toContain('CDF registrado');
    });

    it('a fila sem MTR some conforme os manifestos entram', () => {
      const antes = Store.semMtr().length;
      expect(antes).toBeGreaterThan(0);
      Store.registrarMtr(Store.semMtr()[0].id, { numero: '2026000123456' });
      expect(Store.semMtr()).toHaveLength(antes - 1);
    });
  });

  describe('transportador', () => {
    it('é a cooperativa que atende, com CNPJ', () => {
      const demanda = comprovada();
      const t = transportadorDoMtr(demanda);
      const coop = Catalogo.cooperativa(Catalogo.destino(demanda.destino.id)!.cooperativa)!;
      expect(t.cnpj).toBe(coop.cnpj);
      expect(t.impedimento).toBeNull();
    });
  });

  describe('cadastro pronto para o manifesto', () => {
    it('toda cooperativa e toda unidade têm CNPJ válido', () => {
      const valido = (cnpj: string) => {
        const n = cnpj.replace(/\D/g, '');
        if (n.length !== 14) return false;
        const digito = (base: number[], pesos: number[]) => {
          const resto = base.reduce((t, v, i) => t + v * pesos[i], 0) % 11;
          return resto < 2 ? 0 : 11 - resto;
        };
        const nums = n.split('').map(Number);
        return digito(nums.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === nums[12]
          && digito(nums.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === nums[13];
      };
      for (const c of COOPERATIVAS) expect(valido(c.cnpj), `CNPJ da ${c.nome}`).toBe(true);
      for (const d of DESTINOS) expect(valido(d.cnpj), `CNPJ de ${d.nome}`).toBe(true);
    });

    it('toda unidade tem licença declarada', () => {
      for (const d of DESTINOS) expect(d.licenca.length, `licença de ${d.nome}`).toBeGreaterThan(3);
    });
  });

  describe('rascunho do manifesto', () => {
    it('preenche o que o sistema sabe e marca o que não sabe', () => {
      const campos = rascunhoMtr(comprovada());
      const porRotulo = Object.fromEntries(campos.map(c => [c.rotulo, c]));

      for (const rotulo of ['Gerador', 'CNPJ do gerador', 'Destinador', 'CNPJ do destinador',
        'Licença do destinador', 'Resíduo', 'Quantidade', 'Referência no SAMAÚMA']) {
        expect(porRotulo[rotulo]?.valor, `${rotulo} deveria vir preenchido`).toBeTruthy();
        expect(porRotulo[rotulo]?.aPreencher, `${rotulo} não deveria pedir preenchimento`).toBeFalsy();
      }
    });

    it('não inventa o código da Lista Brasileira de Resíduos', () => {
      const codigo = rascunhoMtr(comprovada()).find(c => c.rotulo.includes('Lista Brasileira'))!;
      expect(codigo.valor).toBe('');
      expect(codigo.aPreencher).toBe(true);
      expect(codigo.nota).toMatch(/não preenche/i);
    });

    it('usa a massa da balança quando existe, e diz qual das duas usou', () => {
      const daBalanca = rascunhoMtr(comprovada()).find(c => c.rotulo === 'Quantidade')!;
      expect(daBalanca.nota).toMatch(/balança/i);

      const emCampo = rascunhoMtr(emTransporte()).find(c => c.rotulo === 'Quantidade')!;
      expect(emCampo.nota).toMatch(/observada/i);
    });

    it('classifica todo resíduo do catálogo', () => {
      for (const r of Object.keys(CLASSE_RESIDUO)) {
        expect(CLASSE_RESIDUO[r].classe).toMatch(/^(I|II-A|II-B)$/);
      }
      const semClasse = Store.todas().filter(d => !CLASSE_RESIDUO[d.residuo]);
      expect(semClasse, 'resíduo sem classe no manifesto').toHaveLength(0);
    });

    it('conta quantos campos faltam', () => {
      const demanda = comprovada();
      expect(faltamNoRascunho(demanda)).toBe(rascunhoMtr(demanda).filter(c => c.aPreencher).length);
      expect(faltamNoRascunho(demanda)).toBeGreaterThan(0);
    });
  });
});
