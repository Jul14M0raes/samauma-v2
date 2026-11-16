/* A busca precisa achar o que a pessoa procura do jeito que ela digita, e não
   do jeito que o dado foi guardado. Quem fiscaliza digita o CNPJ como está no
   papel, com ponto e barra; quem está em campo digita sem acento e com pressa.
   Os testes cobrem essas distâncias entre o que se digita e o que está gravado. */

import { describe, expect, it } from 'vitest';
import { combina, filtrarPorTexto, normalizar, termos } from '../busca';

describe('normalização', () => {
  it('ignora acento e caixa', () => {
    expect(normalizar('Panificadora MADEIRA')).toBe('panificadora madeira');
    expect(normalizar('Reciclagem São João')).toBe('reciclagem sao joao');
  });

  it('troca pontuação por espaço em vez de apagar', () => {
    /* Apagar juntaria palavras que não são a mesma; trocar por espaço mantém a
       fronteira e ainda permite a comparação sem separador. */
    expect(normalizar('12.345.678/0001-90')).toBe('12 345 678 0001 90');
    expect(normalizar('DEM-0001')).toBe('dem 0001');
  });

  it('não devolve termo vazio', () => {
    expect(termos('   ')).toEqual([]);
    expect(termos('  a   b ')).toEqual(['a', 'b']);
  });
});

describe('combinação de termos', () => {
  const campos = ['Panificadora Madeira', '12.345.678/0001-90', 'Centro'];

  it('acha CNPJ digitado com e sem pontuação', () => {
    expect(combina(campos, '12.345.678/0001-90')).toBe(true);
    expect(combina(campos, '12345678000190')).toBe(true);
    expect(combina(campos, '345678')).toBe(true);
  });

  it('exige todos os termos, em qualquer ordem e em campos diferentes', () => {
    expect(combina(campos, 'madeira centro')).toBe(true);
    expect(combina(campos, 'centro madeira')).toBe(true);
    expect(combina(campos, 'madeira olaria')).toBe(false);
  });

  it('consulta vazia não filtra nada', () => {
    expect(combina(campos, '')).toBe(true);
    expect(combina(campos, '   ')).toBe(true);
  });

  it('ignora campo ausente sem quebrar', () => {
    expect(combina(['Nome', null, undefined], 'nome')).toBe(true);
  });
});

describe('filtragem de lista', () => {
  const itens = [
    { id: 'DEM-0001', nome: 'Panificadora Madeira', bairro: 'Centro' },
    { id: 'DEM-0002', nome: 'Auto Peças Cidade Nova', bairro: 'Cidade Nova' },
    { id: 'DEM-0003', nome: 'Hotel Rio Madeira', bairro: 'Olaria' }
  ];
  const campos = (i: typeof itens[number]) => [i.id, i.nome, i.bairro];

  it('devolve a lista inteira quando não há consulta', () => {
    expect(filtrarPorTexto(itens, '', campos)).toHaveLength(3);
  });

  it('acha por trecho do nome, em mais de um item', () => {
    expect(filtrarPorTexto(itens, 'madeira', campos).map(i => i.id)).toEqual(['DEM-0001', 'DEM-0003']);
  });

  it('acha o processo pelo número, com ou sem o prefixo', () => {
    expect(filtrarPorTexto(itens, 'DEM-0002', campos).map(i => i.id)).toEqual(['DEM-0002']);
    expect(filtrarPorTexto(itens, '0002', campos).map(i => i.id)).toEqual(['DEM-0002']);
  });

  it('estreita o resultado a cada termo digitado', () => {
    expect(filtrarPorTexto(itens, 'madeira', campos)).toHaveLength(2);
    expect(filtrarPorTexto(itens, 'madeira olaria', campos)).toHaveLength(1);
  });

  it('devolve lista vazia quando nada corresponde', () => {
    expect(filtrarPorTexto(itens, 'inexistente', campos)).toEqual([]);
  });
});
