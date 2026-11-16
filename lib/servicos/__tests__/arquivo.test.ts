import { describe, expect, it } from 'vitest';
import { montarCsv, montarXls } from '../arquivo';

describe('planilhas', () => {
  it('o .xls guarda número como número e escapa o texto', () => {
    const xml = montarXls([{ nome: 'Processos', linhas: [['Gerador', 'Massa'], ['A & B <Ltda>', 12.5]] }]);
    expect(xml).toContain('<Worksheet ss:Name="Processos">');
    expect(xml).toContain('<Data ss:Type="Number">12.5</Data>');
    expect(xml).toContain('A &amp; B &lt;Ltda&gt;');
  });

  it('o CSV usa ponto e vírgula e vírgula decimal', () => {
    expect(montarCsv([['a', 1.5]])).toBe('﻿a;1,5\r\n');
  });
});
