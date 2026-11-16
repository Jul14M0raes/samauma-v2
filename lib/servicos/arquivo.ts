/* SAMAÚMA — saída de arquivos no navegador: download, impressão, CSV e .xls. */

export function baixarBlob(blob: Blob, arquivo: string) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = arquivo;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

export function baixarTexto(conteudo: string, tipo: string, arquivo: string) {
  baixarBlob(new Blob([conteudo], { type: tipo }), arquivo);
}

export function baixarHtml(html: string, arquivo: string) {
  baixarTexto(html, 'text/html;charset=utf-8', arquivo);
}

/* Abre a página numa janela e imprime depois do load, para que imagens e SVG
   já estejam no layout. */
export function abrirParaImprimir(html: string, largura = 760, altura = 820) {
  const janela = window.open('', '_blank', `width=${largura},height=${altura}`);
  if (!janela) return;
  janela.document.write(html);
  janela.document.close();
  janela.addEventListener('load', () => { janela.focus(); janela.print(); });
}

export function carimboArquivo(): string {
  const agora = new Date();
  return `${agora.getFullYear()}${String(agora.getMonth() + 1).padStart(2, '0')}${String(agora.getDate()).padStart(2, '0')}`;
}

/* CSV para o Excel em português: `;` como separador, vírgula decimal e BOM. */
export function celulaCsv(valor: unknown): string {
  if (valor == null) return '';
  const texto = typeof valor === 'number'
    ? valor.toLocaleString('pt-BR', { maximumFractionDigits: 2, useGrouping: false })
    : String(valor);
  return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export function montarCsv(linhas: unknown[][]): string {
  return '﻿' + linhas.map(l => l.map(celulaCsv).join(';')).join('\r\n') + '\r\n';
}

/* Planilha .xls no formato SpreadsheetML (XML do Excel 2003): abre no Excel e
   no LibreOffice sem dependência. Número vai como número, o resto como texto.
   ponytail: o Excel avisa que a extensão não bate com o formato; se incomodar,
   gerar .xlsx (zip) com uma biblioteca. */
export function montarXls(abas: { nome: string; linhas: unknown[][] }[]): string {
  const xml = (texto: string) => texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const celula = (valor: unknown) => typeof valor === 'number' && Number.isFinite(valor)
    ? `<Cell><Data ss:Type="Number">${valor}</Data></Cell>`
    : `<Cell><Data ss:Type="String">${xml(valor == null ? '' : String(valor))}</Data></Cell>`;
  const aba = ({ nome, linhas }: { nome: string; linhas: unknown[][] }) =>
    `<Worksheet ss:Name="${xml(nome.slice(0, 31))}"><Table>` +
    linhas.map(l => `<Row>${l.map(celula).join('')}</Row>`).join('') + '</Table></Worksheet>';
  return '<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>' +
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' +
    abas.map(aba).join('') + '</Workbook>';
}

export function baixarXls(abas: { nome: string; linhas: unknown[][] }[], arquivo: string) {
  baixarTexto(montarXls(abas), 'application/vnd.ms-excel', arquivo);
}
