/* As credenciais do sistema são conferidas por gente sem login, no campo,
   às vezes digitando à mão. Os testes cobrem o que quebra em silêncio: um
   dígito que muda de valor entre versões (invalidando o que já foi impresso),
   e um formato que não sobrevive a identificador com hífen a mais. */

import { beforeEach, describe, expect, it } from 'vitest';
import { codigoDeVerificacao } from '../carteira';
import {
  comDigito, corpoDoCodigo, digitoVerificador,
  FORMATO_CARTEIRA, FORMATO_DEMANDA, tipoDoCodigo
} from '../credencial';
import { DemandaRegras as Demanda } from '../demanda';
import { Store } from '../store';

describe('código verificável', () => {
  it('mantém os dígitos já emitidos', () => {
    /* Estes valores estão impressos em carteira. Se mudarem, todo
       código em papel deixa de conferir — então eles ficam presos aqui. */
    expect(comDigito('PVH-CAT-2026-0001')).toBe('PVH-CAT-2026-0001-XY');
    expect(comDigito('PVH-CAT-2026-0005')).toBe('PVH-CAT-2026-0005-X2');
    expect(comDigito('DEM-0001')).toBe(codigoDeVerificacao('DEM-0001'));
  });

  it('reconhece o corpo com e sem o dígito', () => {
    expect(corpoDoCodigo('PVH-CAT-2026-0001-XY', FORMATO_CARTEIRA)).toBe('PVH-CAT-2026-0001');
    expect(corpoDoCodigo('PVH-CAT-2026-0001', FORMATO_CARTEIRA)).toBe('PVH-CAT-2026-0001');
    expect(corpoDoCodigo('  pvh-cat-2026-0001-xy  ', FORMATO_CARTEIRA)).toBe('PVH-CAT-2026-0001');
  });

  it('recusa dígito trocado', () => {
    const bom = comDigito('DEM-0018');
    const ruim = bom.slice(0, -1) + (bom.endsWith('Z') ? 'Y' : 'Z');
    expect(corpoDoCodigo(bom, FORMATO_DEMANDA)).toBe('DEM-0018');
    expect(corpoDoCodigo(ruim, FORMATO_DEMANDA)).toBeNull();
  });

  it('não confunde um código com o formato de outro', () => {
    expect(corpoDoCodigo(comDigito('DEM-0001'), FORMATO_CARTEIRA)).toBeNull();
    expect(corpoDoCodigo(comDigito('PVH-CAT-2026-0001'), FORMATO_DEMANDA)).toBeNull();
    expect(tipoDoCodigo(comDigito('PVH-CAT-2026-0001'))).toBe('carteira');
    expect(tipoDoCodigo(comDigito('DEM-0001'))).toBe('demanda');
    expect(tipoDoCodigo('qualquer coisa')).toBeNull();
  });

  it('o dígito não usa caractere que se confunde à mão', () => {
    const usados = new Set(
      Array.from({ length: 300 }, (_, i) => digitoVerificador('DEM-' + String(i).padStart(4, '0')))
        .flatMap(d => d.split('')));
    for (const proibido of ['I', 'O', 'S', '0', '1', '5']) {
      expect(usados.has(proibido), `não deveria usar ${proibido}`).toBe(false);
    }
  });
});

describe('código da demanda', () => {
  beforeEach(() => { Store.reiniciar(); });

  it('acompanha o identificador e confere', () => {
    const demanda = Store.todas()[0];
    const codigo = Demanda.codigoVerificacao(demanda);
    expect(codigo.startsWith(demanda.id)).toBe(true);
    expect(corpoDoCodigo(codigo, FORMATO_DEMANDA)).toBe(demanda.id);
  });
});
